import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch, MessageCircle, ChevronRight } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";
import { ButtonLink } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Order History | HEIDIZ Essentialz",
  description: "Your HEIDIZ Essentialz order history.",
};

const STATUS_LABELS: Record<string, string> = {
  PLACED: "Order Placed",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  PROCESSING: "Processing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default async function OrderHistoryPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <>
        <CollectionHeader
          eyebrow="My Account"
          title="Order History"
          crumbs={[{ label: "Account", href: "/account" }, { label: "Orders" }]}
        />
        <Container className="flex flex-col items-center gap-5 py-20 text-center md:py-28">
          <PackageSearch className="h-12 w-12 text-burnt-orange" strokeWidth={1.5} />
          <h2 className="font-display text-2xl text-brand-black">Sign In to View Your Orders</h2>
          <p className="max-w-md text-sm text-charcoal/70">
            Order history is tied to your account. Sign in to see it, or message us on
            WhatsApp any time with your order number for a status update.
          </p>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <ButtonLink href="/sign-in" variant="primary" size="md">
              Sign In
            </ButtonLink>
            <a
              href="https://wa.me/2347053220268"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-button border border-brand-black/70 px-7 py-3 text-sm font-medium text-brand-black transition-all hover:bg-brand-black hover:text-white"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
              Chat With Us
            </a>
          </div>
        </Container>
      </>
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <>
      <CollectionHeader
        eyebrow="My Account"
        title="Order History"
        crumbs={[{ label: "Account", href: "/account" }, { label: "Orders" }]}
      />

      <Container className="py-12 md:py-16">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <PackageSearch className="h-10 w-10 text-charcoal/30" strokeWidth={1.5} />
            <p className="font-display text-xl text-brand-black">No orders yet</p>
            <ButtonLink href="/shop" variant="primary" size="md">
              Shop the Collection
            </ButtonLink>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.orderNumber}`}
                className="flex items-center justify-between gap-4 rounded-[4px] border border-brand-black/10 bg-white p-5 transition-colors hover:border-burnt-orange/40"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-display text-base text-brand-black">{order.orderNumber}</span>
                  <span className="text-xs text-charcoal/50">
                    {order.items.length} {order.items.length === 1 ? "item" : "items"} &middot;{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-medium text-burnt-orange">{formatNaira(order.total)}</span>
                    <span className="text-xs text-charcoal/50">{STATUS_LABELS[order.status]}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-charcoal/30" strokeWidth={1.5} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
