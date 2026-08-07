import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { OrderDetails } from "@/lib/order";

// An order paid via either card gateway arrives here already verified
// (see completeOrder()'s sendEmailReceipt=true branch in checkout/page.tsx,
// which only fires after Paystack/Monnify confirm the charge) — so both
// should land as PAYMENT_CONFIRMED, not just Paystack. Bank transfer / pay
// on delivery start at PLACED, confirmed manually by staff later.
function isCardPayment(label: string) {
  return label.includes("Paystack") || label.includes("Monnify");
}

// Saves every order (Paystack, bank transfer, pay on delivery alike) to the
// database, linked to the signed-in Clerk user when there is one — guest
// checkout still works, userId is just null. Called from checkout right
// after completeOrder() builds the order object, same moment the WhatsApp
// link and (for Paystack) the email receipt fire.
export async function POST(request: Request) {
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
        notes: order.notes,
        paymentMethodLabel: order.paymentMethodLabel,
        paymentReference: isCardPayment(order.paymentMethodLabel) ? order.orderNumber : null,
        subtotal: order.subtotal,
        delivery: order.delivery,
        total: order.total,
        status: isCardPayment(order.paymentMethodLabel) ? "PAYMENT_CONFIRMED" : "PLACED",
        items: {
          create: order.lines.map(({ product, quantity, size, color }) => ({
            productSlug: product.slug,
            productName: product.name,
            unitPrice: product.price,
            quantity,
            size: size ?? null,
            color: color ?? null,
          })),
        },
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
