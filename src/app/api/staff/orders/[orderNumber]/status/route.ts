import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { isStaffEmail } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusEmail } from "@/lib/email";

const VALID_STATUSES = ["PLACED", "PAYMENT_CONFIRMED", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
// PLACED/PAYMENT_CONFIRMED are already covered by the checkout-time receipt
// email — only notify on statuses that change later, unprompted by the
// customer's own action.
const NOTIFY_STATUSES = new Set(["PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]);

export async function PATCH(request: Request, props: { params: Promise<{ orderNumber: string }> }) {
  // Defense in depth: re-check staff auth server-side rather than trusting
  // that only the /staff/orders page (also gated) can reach this route.
  const user = await currentUser();
  if (!isStaffEmail(user?.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ updated: false, message: "Not authorized." }, { status: 403 });
  }

  const { orderNumber } = await props.params;
  const { status } = await request.json().catch(() => ({ status: null }));

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ updated: false, message: "Invalid status." }, { status: 400 });
  }

  try {
    const order = await prisma.order.update({ where: { orderNumber }, data: { status } });
    if (NOTIFY_STATUSES.has(status)) {
      // Fire-and-forget, same contract as every other email helper in this
      // app — a Resend failure must never fail the status update itself.
      sendOrderStatusEmail({
        email: order.email,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        status: order.status,
      }).catch(() => {});
    }
    return NextResponse.json({ updated: true });
  } catch {
    return NextResponse.json({ updated: false, message: "Order not found." }, { status: 404 });
  }
}
