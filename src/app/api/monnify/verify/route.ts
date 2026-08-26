import { NextResponse } from "next/server";
import { isMonnifyServerConfigured, verifyMonnifyReference } from "@/lib/monnify-server";
import { computeOrderTotals, type PricedLine } from "@/lib/order-pricing";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/rate-limit";

// Verifies a Monnify transaction server-side. The client-side modal
// (src/lib/monnify.ts) only tells us a charge *appeared* to complete; this
// confirms it with Monnify directly before we treat the order as paid. See
// src/app/api/webhooks/monnify for the redundant webhook-driven
// confirmation path.
//
// Rate limited per IP — each call round-trips to Monnify's API, so an
// unbounded loop here isn't just noise, it's a real remote call every time.
export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = checkRateLimit(`monnify-verify:${clientIp(request)}`, {
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) return rateLimitResponse(retryAfterSeconds);

  if (!isMonnifyServerConfigured()) {
    return NextResponse.json(
      { status: false, message: "Monnify keys are not configured on the server." },
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
    const result = await verifyMonnifyReference(reference);
    if (!result.paid) {
      return NextResponse.json({ status: false, message: result.message });
    }

    // Monnify confirming *a* charge succeeded isn't enough on its own —
    // confirm it was for the real, server-computed order total (naira).
    // The cart is client-side localStorage, so its unitPrice/subtotal is
    // editable before this request is even sent; without this check a
    // tampered cart could pay a fraction of the real cost and still be
    // treated as paid in full (see src/lib/order-pricing.ts). A ₦1
    // tolerance absorbs float rounding, not a meaningful underpayment.
    const computed = await computeOrderTotals(items, state);
    if (!computed || result.amount === undefined || Math.abs(result.amount - computed.total) > 1) {
      console.error("[monnify verify] amount mismatch", { reference, expected: computed?.total, actual: result.amount });
      return NextResponse.json({
        status: false,
        message: "The amount paid didn't match the order total. Please contact us with your reference number.",
      });
    }

    return NextResponse.json({ status: true, message: result.message, amount: result.amount, currency: result.currency });
  } catch (err) {
    console.error("[monnify verify] error", err);
    return NextResponse.json(
      { status: false, message: "Could not reach Monnify to verify the transaction." },
      { status: 502 }
    );
  }
}
