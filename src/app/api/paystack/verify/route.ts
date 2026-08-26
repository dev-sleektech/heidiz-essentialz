import { NextResponse } from "next/server";
import { isPaystackServerConfigured, verifyPaystackReference } from "@/lib/paystack-server";
import { computeOrderTotals, type PricedLine } from "@/lib/order-pricing";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/rate-limit";

// Verifies a Paystack transaction server-side, using the secret key (never
// exposed to the browser). The client-side inline popup only tells us a
// charge *appeared* to succeed; this confirms it with Paystack directly
// before we treat the order as paid. See src/lib/paystack.ts for the
// client-side trigger, and src/app/api/webhooks/paystack for the redundant
// webhook-driven confirmation path.
//
// Rate limited per IP — each call round-trips to Paystack's API, so an
// unbounded loop here isn't just noise, it's a real remote call every time.
export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = checkRateLimit(`paystack-verify:${clientIp(request)}`, {
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) return rateLimitResponse(retryAfterSeconds);

  if (!isPaystackServerConfigured()) {
    return NextResponse.json(
      { status: false, message: "Paystack secret key is not configured on the server." },
      { status: 500 }
    );
  }

  let reference: string | undefined;
  let items: PricedLine[] | undefined;
  let state: string | undefined;
  try {
    const body = await request.json();
    reference = body?.reference;
    items = body?.items;
    state = body?.state;
  } catch {
    return NextResponse.json({ status: false, message: "Invalid request body." }, { status: 400 });
  }

  if (!reference) {
    return NextResponse.json({ status: false, message: "Missing transaction reference." }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0 || typeof state !== "string") {
    return NextResponse.json({ status: false, message: "Missing order details to verify." }, { status: 400 });
  }

  try {
    const result = await verifyPaystackReference(reference);
    if (!result.paid) {
      return NextResponse.json({ status: false, message: result.message });
    }

    // Paystack confirming *a* charge succeeded isn't enough on its own —
    // confirm it was for the real, server-computed order total (in kobo).
    // The cart is client-side localStorage, so its unitPrice/subtotal is
    // editable before this request is even sent; without this check a
    // tampered cart could pay a fraction of the real cost and still be
    // treated as paid in full (see src/lib/order-pricing.ts).
    const computed = await computeOrderTotals(items, state);
    const expectedKobo = computed ? Math.round(computed.total * 100) : null;
    if (expectedKobo === null || result.amount !== expectedKobo) {
      console.error("[paystack verify] amount mismatch", { reference, expectedKobo, actual: result.amount });
      return NextResponse.json({
        status: false,
        message: "The amount paid didn't match the order total. Please contact us with your reference number.",
      });
    }

    return NextResponse.json({ status: true, message: result.message, amount: result.amount, currency: result.currency });
  } catch {
    return NextResponse.json(
      { status: false, message: "Could not reach Paystack to verify the transaction." },
      { status: 502 }
    );
  }
}
