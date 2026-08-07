import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { isStaffEmail } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["PLACED", "PAYMENT_CONFIRMED", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

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
    await prisma.order.update({ where: { orderNumber }, data: { status } });
    return NextResponse.json({ updated: true });
  } catch {
    return NextResponse.json({ updated: false, message: "Order not found." }, { status: 404 });
  }
}
