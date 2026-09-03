import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { isStaffEmail } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";
import { sendOrderReceiptEmail } from "@/lib/email";
import { orderDetailsFromStored } from "@/lib/order";

// Sends the receipt for an order that already exists, on demand from the
// admin dashboard. Built for the case the checkout cannot cover: the send
// failed at the time, or the customer never got the mail and asks for it.
//
// Two things make this deliberately different from POST /api/orders/receipt.
//
// First, the request body is ignored completely. That route takes the order
// from the body because at checkout the cart is the only source of truth.
// Here the order is on disk, so every figure is re-read from the database.
// A staff-triggered send must not be able to mail a customer a total that
// was never charged.
//
// Second, it reports failure honestly. The checkout route always answers
// 200 so that a missing receipt cannot look like a failed order to someone
// who has just paid. The entire point of pressing this button is to learn
// whether the mail actually went, so the real result comes back instead.
export async function POST(_request: Request, props: { params: Promise<{ orderNumber: string }> }) {
  // Re-check staff auth here rather than trusting that only the gated
  // /admin page can reach this route, the same as the status route.
  const user = await currentUser();
  if (!isStaffEmail(user?.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ sent: false, message: "Not authorized." }, { status: 403 });
  }

  const { orderNumber } = await props.params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ sent: false, message: "Order not found." }, { status: 404 });
  }

  // Worth separating from a send failure: a guest order with no address on
  // it can never receive a receipt, so retrying will not help. Say so
  // plainly and point at the channel that does work.
  if (!order.email) {
    return NextResponse.json(
      { sent: false, message: "No email address on this order. Reach the customer on WhatsApp instead." },
      { status: 400 },
    );
  }

  const result = await sendOrderReceiptEmail(orderDetailsFromStored(order));

  if (!result.sent) {
    console.error("[order receipt] manual send failed", {
      orderNumber: order.orderNumber,
      reason: result.message,
    });
  }

  return NextResponse.json({ ...result, email: order.email });
}
