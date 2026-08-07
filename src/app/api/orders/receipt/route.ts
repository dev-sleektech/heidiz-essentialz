import { NextResponse } from "next/server";
import { sendOrderReceiptEmail } from "@/lib/email";
import type { OrderDetails } from "@/lib/order";

// Fired from the checkout page right after Paystack confirms and verifies
// payment (see src/app/checkout/page.tsx). Never blocks or fails the order
// itself — the WhatsApp handoff is the reliable confirmation channel;
// this is a nice-to-have on top of it.
export async function POST(request: Request) {
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
  return NextResponse.json(result, { status: result.sent ? 200 : 200 });
}
