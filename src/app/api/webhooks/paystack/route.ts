import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { verifyPaystackReference } from "@/lib/paystack-server";
import { coversTotal, shortPaymentNote } from "@/lib/payment-confirmation";
import { computeOrderTotals, type PricedLine } from "@/lib/order-pricing";

// Redundant, more reliable confirmation path alongside the client-triggered
// verify in src/app/api/paystack/verify/route.ts (which only fires if the
// customer's browser is still open when the inline popup reports success).
// Configure this URL as your webhook in the Paystack dashboard
// (Settings -> API Keys & Webhooks): https://<your-domain>/api/webhooks/paystack
//
// Security: every request's x-paystack-signature header is an HMAC-SHA512
// of the raw request body, keyed with the secret key — verified below
// before trusting anything in the payload. The payload's own "success"
// claim is still not enough on its own: we re-verify with Paystack's API
// (the same verifyPaystackReference() the popup path uses) before touching
// the order, exactly per Paystack's documented best practice.
export function isValidSignature(rawBody: string, signature: string | null, secretKey: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || secretKey.includes("replace_me")) {
    // Not configured — nothing to verify against, just acknowledge so
    // Paystack doesn't retry forever.
    return NextResponse.json({ received: true });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!isValidSignature(rawBody, signature, secretKey)) {
    return NextResponse.json({ received: false, message: "Invalid signature." }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ received: false, message: "Invalid payload." }, { status: 400 });
  }

  // Always 200 from here — Paystack retries on non-2xx, and every failure
  // mode past this point is either "nothing to do" or already logged.
  if (event.event !== "charge.success" || !event.data?.reference) {
    return NextResponse.json({ received: true });
  }

  try {
    const result = await verifyPaystackReference(event.data.reference);
    if (!result.paid) {
      return NextResponse.json({ received: true });
    }

    // orderNumber IS the payment reference for both gateways (see
    // makeOrderNumber() in checkout/page.tsx) — no separate lookup needed.
    //
    // Test existence rather than counting an update: a card order is
    // written as PAYMENT_CONFIRMED already, so an "advance only PLACED
    // rows" update matches nothing on the happy path. Treating that as
    // "missing" would send every healthy payment down the recovery branch.
    const existing = await prisma.order.findUnique({
      where: { orderNumber: event.data.reference },
      select: { status: true, total: true, notes: true },
    });

    if (!existing) {
      // Paid, but no order. The browser is meant to record it on a
      // fire-and-forget fetch, so a closed tab, a dropped connection or a
      // failure between the charge and our own write loses it entirely —
      // exactly what happened for eight days from 2026-08-26, when a bug
      // rejected every card payment after the customer had been charged
      // (fixed in dab48c6). Paystack tells us independently of the
      // customer's browser, which makes this the only place that can
      // catch it. So it creates the order rather than shrugging.
      await createOrderFromWebhook(event.data.reference, result.metadata, result.requestedAmount ?? result.amount);
    } else if (existing.status === "PLACED") {
      // Recorded but not yet confirmed — advance it, but only if the charge
      // covered the order's total (see lib/payment-confirmation.ts): a
      // successful N100 charge against a bigger order's reference must not
      // confirm it. Anything further along is left alone so this never
      // regresses an order staff have already moved down the timeline.
      const paidKobo = result.requestedAmount ?? result.amount;
      if (result.currency && result.currency !== "NGN") {
        console.error("[paystack webhook] non-NGN charge, not confirming", { reference: event.data.reference });
      } else if (coversTotal(paidKobo, existing.total)) {
        await prisma.order.update({
          where: { orderNumber: event.data.reference },
          data: { status: "PAYMENT_CONFIRMED" },
        });
      } else {
        const note = shortPaymentNote(event.data.reference, paidKobo ?? 0, Math.round(existing.total * 100));
        console.error("[paystack webhook] charge does not cover order total, not confirming", {
          reference: event.data.reference,
          paidKobo,
          total: existing.total,
        });
        if (!existing.notes?.includes(note)) {
          await prisma.order.update({
            where: { orderNumber: event.data.reference },
            data: { notes: [existing.notes, note].filter(Boolean).join(" | ") },
          });
        }
      }
    }
  } catch (err) {
    console.error("[paystack webhook] error", err);
  }

  return NextResponse.json({ received: true });
}

type RecoveryOrder = {
  customerName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
  lines?: PricedLine[];
};

// Rebuilds an order Paystack accepted but we never recorded, from the
// delivery details attached as metadata when checkout opened.
//
// Prices are never taken from the metadata — it reaches Paystack through
// the customer's browser, so it is exactly as editable as the cart is.
// computeOrderTotals re-prices every line from the Product table, the same
// authority the verify and create routes use.
async function createOrderFromWebhook(reference: string, metadata: unknown, paidKobo: number | undefined) {
  const order = (metadata as { order?: RecoveryOrder } | null)?.order;
  if (!order?.lines?.length || !order.state) {
    console.error("[paystack webhook] paid with no order and no recovery metadata", { reference });
    return;
  }

  const computed = await computeOrderTotals(order.lines, order.state);
  if (!computed) {
    console.error("[paystack webhook] paid but could not price the order", { reference });
    return;
  }

  // A recovered order is confirmed only if the charge covered the re-priced
  // total; otherwise it is still recorded (never lost) but left PLACED with a
  // note for staff, because the metadata came through the customer's browser.
  const covered = coversTotal(paidKobo, computed.total);
  const shortNote = covered ? null : shortPaymentNote(reference, paidKobo ?? 0, Math.round(computed.total * 100));

  try {
    await prisma.order.create({
      data: {
        orderNumber: reference,
        // No Clerk session on a webhook — it is a server-to-server call, so
        // a recovered order is always guest-shaped even if the customer was
        // signed in. It still shows up in /order-tracking by number+phone.
        userId: null,
        customerName: order.customerName || "Recovered from payment",
        email: order.email ?? null,
        phone: order.phone ?? "",
        address: order.address ?? "",
        city: order.city ?? "",
        state: order.state,
        notes: [order.notes, "Order recovered from the Paystack webhook — the checkout never recorded it.", shortNote]
          .filter(Boolean)
          .join(" | "),
        paymentMethodLabel: "Pay with Card (Paystack)",
        paymentReference: reference,
        subtotal: computed.subtotal,
        delivery: computed.delivery,
        total: computed.total,
        status: covered ? "PAYMENT_CONFIRMED" : "PLACED",
        items: { create: computed.items },
      },
    });
    console.warn("[paystack webhook] recovered an order the checkout lost", { reference });
  } catch (err) {
    // Most likely a duplicate: the browser won the race and created it
    // between our updateMany and here. orderNumber is unique, so the
    // database is the arbiter and losing here is the correct outcome.
    console.error("[paystack webhook] could not create recovered order", { reference, err });
  }
}
