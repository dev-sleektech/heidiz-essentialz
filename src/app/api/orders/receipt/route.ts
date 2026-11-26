import { NextResponse } from "next/server";
import { sendOrderReceiptEmail } from "@/lib/email";
import type { OrderDetails } from "@/lib/order";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/rate-limit";

// Fired from the checkout page right after Paystack confirms and verifies
// payment (see src/app/checkout/page.tsx). Never blocks or fails the order
// itself — the WhatsApp handoff is the reliable confirmation channel;
// this is a nice-to-have on top of it.
//
// No auth (guest checkout sends receipts too) and it sends to whatever
// email is in the request body — rate limited per IP so this can't be
// turned into a free spam relay against our Resend account/reputation.
export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = await checkRateLimit(`orders-receipt:${clientIp(request)}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) return rateLimitResponse(retryAfterSeconds);

  let order: OrderDetails;
  try {
    order = await request.json();
  } catch {
    return NextResponse.json({ sent: false, message: "Invalid request body." }, { status: 400 });
  }

  if (!order?.orderNumber || !Array.isArray(order.lines)) {
    return NextResponse.json({ sent: false, message: "Missing order details." }, { status: 400 });
  }

  const result = await sendOrderReceiptEmail(order);

  // Log the failure. A receipt that never arrives used to be invisible from
  // every angle: Resend rejects it, this route answers 200 with
  // {sent:false}, and the checkout fires the request without ever reading
  // the response. On 2026-09-03 a customer was charged, Paystack emailed
  // them, and the HEIDIZ receipt silently never sent - nothing anywhere
  // recorded why.
  //
  // Still a 200 and still non-blocking: the order is already paid and
  // recorded by this point, and failing the request would only make a
  // missing receipt look like a failed order. This is about being able to
  // find out, not about changing the outcome.
  if (!result.sent) {
    console.error("[order receipt] not sent", {
      orderNumber: order.orderNumber,
      reason: result.message,
    });
  }

  return NextResponse.json(result);
}
