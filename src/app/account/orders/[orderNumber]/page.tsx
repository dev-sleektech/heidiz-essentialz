import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { OrderStatusTimeline, type OrderStatus } from "@/components/shop/order-status-timeline";
import { formatNaira } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(
  props: PageProps<"/account/orders/[orderNumber]">
): Promise<Metadata> {
  const { orderNumber } = await props.params;
  return { title: `Order ${orderNumber} | HEIDIZ Essentialz` };
}

export default async function OrderDetailPage(props: PageProps<"/account/orders/[orderNumber]">) {
  const { orderNumber } = await props.params;
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });

  if (!order || order.userId !== userId) notFound();

  return (
    <Container className="py-10 md:py-14">
      <Breadcrumbs
        items={[
          { label: "Account", href: "/account" },
          { label: "Orders", href: "/account/orders" },
          { label: order.orderNumber },
        ]}
      />

      <div className="mt-4 flex flex-col gap-2">
        <h1 className="font-display text-3xl text-brand-black md:text-4xl">{order.orderNumber}</h1>
        <span className="text-sm text-charcoal/50">
          Placed{" "}
          {new Date(order.createdAt).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="mt-10 rounded-[4px] border border-brand-black/10 bg-white p-6 md:p-8">
        <OrderStatusTimeline status={order.status as OrderStatus} />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-xl text-brand-black">Items</h2>
          <div className="flex flex-col divide-y divide-brand-black/10 rounded-[4px] border border-brand-black/10 bg-white">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-brand-black">{item.productName}</span>
                  <span className="text-xs text-charcoal/50">Qty {item.quantity}</span>
                </div>
                <span className="text-sm text-charcoal/70">{formatNaira(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-[4px] border border-brand-black/10 bg-white p-6">
            <h2 className="font-display text-lg text-brand-black">Summary</h2>
            <div className="flex justify-between text-sm text-charcoal/70">
              <span>Subtotal</span>
              <span>{formatNaira(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-charcoal/70">
              <span>Delivery</span>
              <span>{order.delivery === 0 ? "Complimentary" : formatNaira(order.delivery)}</span>
            </div>
            <div className="hairline" />
            <div className="flex justify-between font-display text-base text-brand-black">
              <span>Total</span>
              <span>{formatNaira(order.total)}</span>
            </div>
            <p className="pt-2 text-xs text-charcoal/50">Paid via {order.paymentMethodLabel}</p>
          </div>

          <div className="flex flex-col gap-2 rounded-[4px] border border-brand-black/10 bg-white p-6">
            <h2 className="font-display text-lg text-brand-black">Delivery To</h2>
            <p className="text-sm text-charcoal/70">
              {order.customerName}
              <br />
              {order.address}, {order.city}, {order.state}
              <br />
              {order.phone}
            </p>
          </div>

          <a
            href={`https://wa.me/2347053220268?text=${encodeURIComponent(
              `Hi HEIDIZ Essentialz, I have a question about order ${order.orderNumber}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-button bg-[#25D366] px-7 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
            Ask About This Order
          </a>
        </div>
      </div>
    </Container>
  );
}
