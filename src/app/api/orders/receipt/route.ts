import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderReceiptEmail } from "@/lib/email";
import { orderDetailsFromStored } from "@/lib/order";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/rate-limit";

// Fired from the checkout page right after an order is placed (see
// src/app/checkout/page.tsx). Never blocks or fails the order itself; the
// WhatsApp handoff is the reliable confirmation channel and this is on top.
//
// Security: the request body is ignored except for the order number. This
// route used to build the receipt from the body and send it to whatever
// address the body named, so anyone could make HEIDIZ's verified domain mail
// a real-looking "receipt" with their own wording to any inbox (phishing
// from our own sender). Now it only ever sends a REAL order's stored details
// to the email stored on that order, and only shortly after it was placed
// (a checkout-time receipt; staff resend older ones from the admin page).
const RECENT_MS = 2 * 60 * 60 * 1000;
const ORDER_NUMBER = /^[A-Za-z0-9-]{4,64}$/;

// The checkout fires this and /api/orders/create at the same moment, so the
// order is often not saved yet when this arrives. Wait briefly for it.
async function findRecentOrder(orderNumber: string) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } });
    if (order) return order;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = await checkRateLimit(`orders-receipt:${clientIp(request)}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) return rateLimitResponse(retryAfterSeconds);

  let orderNumber: unknown;
  try {
    orderNumber = ((await request.json()) as { orderNumber?: unknown } | null)?.orderNumber;
  } catch {
    return NextResponse.json({ sent: false, message: "Invalid request body." }, { status: 400 });
  }
  if (typeof orderNumber !== "string" || !ORDER_NUMBER.test(orderNumber)) {
    return NextResponse.json({ sent: false, message: "Missing order details." }, { status: 400 });
  }

  const order = await findRecentOrder(orderNumber);
  if (!order || Date.now() - order.createdAt.getTime() > RECENT_MS || !order.email) {
    // Same answer whether the order is unknown, old or has no email, so this
    // can't be used to probe which order numbers exist.
    console.error("[order receipt] not sent: no recent order with an email", { orderNumber });
    return NextResponse.json({ sent: false, message: "No receipt to send." });
  }

  const result = await sendOrderReceiptEmail(orderDetailsFromStored(order));

  // Log the failure. A receipt that never arrives used to be invisible from
  // every angle: Resend rejects it, this route answers 200 with
  // {sent:false}, and the checkout fires the request without ever reading
  // the response. On 2026-09-03 a customer was charged, Paystack emailed
  // them, and the HEIDIZ receipt silently never sent - nothing anywhere
  // recorded why.
  //
  // Still a 200 and still non-blocking: the order is already recorded by this
  // point, and failing the request would only make a missing receipt look like
  // a failed order. This is about being able to find out, not changing the outcome.
  if (!result.sent) {
    console.error("[order receipt] not sent", { orderNumber: order.orderNumber, reason: result.message });
  }

  return NextResponse.json(result);
}
