import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { OrderDetails } from "@/lib/order";

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
        paymentReference: order.paymentMethodLabel.includes("Paystack") ? order.orderNumber : null,
        subtotal: order.subtotal,
        delivery: order.delivery,
        total: order.total,
        status: order.paymentMethodLabel.includes("Paystack") ? "PAYMENT_CONFIRMED" : "PLACED",
        items: {
          create: order.lines.map(({ product, quantity }) => ({
            productSlug: product.slug,
            productName: product.name,
            unitPrice: product.price,
            quantity,
          })),
        },
      },
    });

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
