import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { OrderDetails } from "@/lib/order";
import { computeOrderTotals } from "@/lib/order-pricing";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/rate-limit";
import { checkPaystackPayment, shortPaymentNote } from "@/lib/payment-confirmation";
import { EMAIL, LIMITS, invalidText } from "@/lib/input-limits";

// Card orders arrive here right after the browser saw the charge succeed, but
// the browser's word is not proof: this endpoint is public, so a direct
// request could otherwise record a "paid" order without paying anything. A
// Paystack order is confirmed only when Paystack itself reports a charge
// covering the server-computed total (lib/payment-confirmation.ts). Anything
// else is saved as PLACED, never rejected: the order is not lost, and the
// Paystack webhook confirms it the moment the payment checks out. Monnify is
// not in use; its orders stay PLACED for staff or its webhook to confirm.
// Bank transfer / pay on delivery start at PLACED, confirmed by staff.
function isCardPayment(label: string) {
  return label.includes("Paystack") || label.includes("Monnify");
}

// Saves every order (Paystack, bank transfer, pay on delivery alike) to the
// database, linked to the signed-in Clerk user when there is one — guest
// checkout still works, userId is just null. Called from checkout right
// after completeOrder() builds the order object, same moment the WhatsApp
// link and (for Paystack) the email receipt fire.
export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = await checkRateLimit(`orders-create:${clientIp(request)}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) return rateLimitResponse(retryAfterSeconds);

  const { userId } = await auth();

  let order: OrderDetails;
  try {
    order = await request.json();
  } catch {
    return NextResponse.json({ saved: false, message: "Invalid request body." }, { status: 400 });
  }

  if (!order?.orderNumber || !Array.isArray(order.lines) || order.lines.length === 0) {
    return NextResponse.json({ saved: false, message: "Missing order details." }, { status: 400 });
  }

  // Server-side checks: this endpoint is public, so the checkout form's own
  // validation proves nothing. Wrong types or oversized fields are rejected.
  const invalid =
    invalidText({
      "Order number": { value: order.orderNumber, max: 64 },
      Name: { value: order.customerName, max: LIMITS.name },
      Email: { value: order.email, max: LIMITS.email, optional: true },
      Phone: { value: order.phone, max: LIMITS.phone },
      Address: { value: order.address, max: LIMITS.address },
      City: { value: order.city, max: LIMITS.shortText },
      State: { value: order.state, max: LIMITS.shortText },
      Notes: { value: order.notes, max: LIMITS.notes, optional: true },
      "Payment method": { value: order.paymentMethodLabel, max: LIMITS.shortText },
    }) ??
    (!/^[A-Za-z0-9-]+$/.test(order.orderNumber) ? "Order number is invalid." : null) ??
    (order.email && !EMAIL.test(order.email) ? "Email is invalid." : null) ??
    (order.lines.length > 50 ? "Too many items in one order." : null) ??
    (order.lines.some(
      (l) =>
        !l ||
        typeof l.product?.slug !== "string" ||
        l.product.slug.length > LIMITS.shortText ||
        !Number.isInteger(l.quantity) ||
        l.quantity < 1 ||
        l.quantity > 99 ||
        (l.size != null && (typeof l.size !== "string" || l.size.length > LIMITS.shortText)) ||
        (l.color != null && (typeof l.color !== "string" || l.color.length > LIMITS.shortText))
    )
      ? "One or more items are invalid."
      : null);
  if (invalid) {
    return NextResponse.json({ saved: false, message: invalid }, { status: 400 });
  }

  // Never trust order.subtotal/delivery/total/lines[].unitPrice from the
  // client — the cart is client-side localStorage, so those are editable
  // before this request ever leaves the browser. Recompute the real prices
  // from the Product table; this is what actually gets stored and shipped.
  const computed = await computeOrderTotals(
    order.lines.map(({ product, quantity, size, color }) => ({ slug: product.slug, quantity, size, color })),
    order.state
  );
  if (!computed) {
    return NextResponse.json(
      { saved: false, message: "One or more items in this order could not be priced. Please refresh your cart and try again." },
      { status: 400 }
    );
  }

  const card = isCardPayment(order.paymentMethodLabel ?? "");
  let status: "PAYMENT_CONFIRMED" | "PLACED" = "PLACED";
  let paymentNote: string | null = null;
  if (card && order.paymentMethodLabel.includes("Paystack")) {
    const check = await checkPaystackPayment(order.orderNumber, computed.total);
    if (check.outcome === "paid") status = "PAYMENT_CONFIRMED";
    else if (check.outcome === "short") {
      paymentNote = shortPaymentNote(order.orderNumber, check.paidKobo, check.expectedKobo);
      console.error("[orders/create] card payment does not cover total", { orderNumber: order.orderNumber, ...check });
    } else if (check.outcome === "error") {
      console.error("[orders/create] could not verify card payment; saved as PLACED for the webhook", {
        orderNumber: order.orderNumber,
        message: check.message,
      });
    }
  }

  try {
    const created = await prisma.order.create({
      data: {
        orderNumber: order.orderNumber,
        userId: userId ?? null,
        customerName: order.customerName,
        email: order.email,
        phone: order.phone,
        address: order.address,
        city: order.city,
        state: order.state,
        notes: [order.notes, paymentNote].filter(Boolean).join(" | ") || null,
        paymentMethodLabel: order.paymentMethodLabel,
        paymentReference: card ? order.orderNumber : null,
        subtotal: computed.subtotal,
        delivery: computed.delivery,
        total: computed.total,
        status,
        items: { create: computed.items },
      },
    });

    // Fire-and-forget — this order completing means any pending abandoned-
    // checkout reminder for the same email is no longer relevant.
    if (order.email) {
      prisma.abandonedCheckout
        .updateMany({ where: { email: order.email, converted: false }, data: { converted: true } })
        .catch(() => {});
    }

    return NextResponse.json({ saved: true, orderId: created.id });
  } catch (err) {
    // Duplicate orderNumber (e.g. a retried request) is a harmless no-op,
    // not a failure the customer needs to see.
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return NextResponse.json({ saved: true, message: "Order already recorded." });
    }
    console.error("Failed to save order:", err);
    return NextResponse.json({ saved: false, message: "Could not save order." }, { status: 500 });
  }
}
