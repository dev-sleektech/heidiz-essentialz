import type { Metadata } from "next";
import { MessageCircle, PackageSearch, AlertCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";
import { OrderStatusTimeline, type OrderStatus } from "@/components/shop/order-status-timeline";
import { formatNaira } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { inputClass, labelClass } from "@/lib/form-styles";

export const metadata: Metadata = {
  title: "Order Tracking",
  description: "Track the status of your HEIDIZ Essentialz order using your order number and phone number.",
};


// Normalizes phone input for comparison — customers type numbers with all
// sorts of spacing/dashes/leading-zero variations, and we only need to
// confirm "this is roughly the same phone number", not an exact string
// match.
function normalizePhone(phone: string) {
  return phone.replace(/[^0-9]/g, "").replace(/^234/, "0");
}

export default async function OrderTrackingPage(props: PageProps<"/order-tracking">) {
  const searchParams = await props.searchParams;
  const orderNumber = typeof searchParams.order === "string" ? searchParams.order.trim() : "";
  const phone = typeof searchParams.phone === "string" ? searchParams.phone.trim() : "";
  const hasSearched = Boolean(orderNumber && phone);

  const found = hasSearched
    ? await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } })
    : null;
  const order = found && normalizePhone(found.phone) === normalizePhone(phone) ? found : null;
  const notFoundOrMismatch = hasSearched && !order;

  return (
    <>
      <CollectionHeader
        eyebrow="Track Your Order"
        title="Order Tracking"
        description="Enter your order number and the phone number used at checkout to see its current status. No account needed."
        crumbs={[{ label: "Order Tracking" }]}
      />

      <Container className="flex flex-col items-center py-12 md:py-16">
        <form method="GET" className="flex w-full max-w-lg flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Order Number</span>
            <input
              required
              type="text"
              name="order"
              defaultValue={orderNumber}
              className={inputClass}
              placeholder="HE-12345678"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Phone Number Used at Checkout</span>
            <input
              required
              type="tel"
              name="phone"
              defaultValue={phone}
              className={inputClass}
              placeholder="080X XXX XXXX"
            />
          </label>
          <button
            type="submit"
            className="rounded-button bg-burnt-orange px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Track Order
          </button>
        </form>

        {notFoundOrMismatch && (
          <div className="mt-8 flex w-full max-w-lg items-start gap-2 rounded-button bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>
              We couldn&apos;t find an order matching that order number and phone number. Double-check
              both and try again, or reach us on WhatsApp for help.
            </span>
          </div>
        )}

        {!hasSearched && !order && (
          <div className="mt-10 flex flex-col items-center gap-2 text-center text-charcoal/70">
            <PackageSearch className="h-10 w-10 text-burnt-orange/60" strokeWidth={1.5} />
            <p className="max-w-sm text-sm">
              Your order number was sent to you when you checked out. It looks like{" "}
              <span className="font-medium text-charcoal">HE-12345678</span>.
            </p>
          </div>
        )}

        {order && (
          <div className="mt-10 w-full max-w-2xl">
            <div className="flex flex-col gap-2 text-center">
              <h2 className="font-display text-2xl text-brand-black">{order.orderNumber}</h2>
              <span className="text-sm text-charcoal/70">
                Placed{" "}
                {new Date(order.createdAt).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="mt-6 rounded-[4px] border border-brand-black/10 bg-white p-6 md:p-8">
              <OrderStatusTimeline status={order.status as OrderStatus} />
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-[4px] border border-brand-black/10 bg-white p-6">
              <h3 className="font-display text-lg text-brand-black">Items</h3>
              <div className="flex flex-col divide-y divide-brand-black/10">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-brand-black">{item.productName}</span>
                      <span className="text-xs text-charcoal/70">
                        {[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(" · ")}
                        {(item.size || item.color) ? " · " : ""}Qty {item.quantity}
                      </span>
                    </div>
                    <span className="text-sm text-charcoal/70">
                      {formatNaira(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="hairline" />
              <div className="flex justify-between font-display text-base text-brand-black">
                <span>Total</span>
                <span>{formatNaira(order.total)}</span>
              </div>
            </div>

            <a
              href={`https://wa.me/2347053220268?text=${encodeURIComponent(
                `Hi HEIDIZ Essentialz, I have a question about order ${order.orderNumber}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-button bg-[#25D366] px-7 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
              Ask About This Order
            </a>
          </div>
        )}
      </Container>
    </>
  );
}
