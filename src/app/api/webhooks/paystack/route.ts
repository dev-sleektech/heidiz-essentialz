import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { verifyPaystackReference } from "@/lib/paystack-server";

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
    // Only advance orders still sitting at PLACED, so this never regresses
    // an order staff has already moved further along the timeline.
    await prisma.order.updateMany({
      where: { orderNumber: event.data.reference, status: "PLACED" },
      data: { status: "PAYMENT_CONFIRMED" },
    });
  } catch (err) {
    console.error("[paystack webhook] error", err);
  }

  return NextResponse.json({ received: true });
}
