import type { Metadata } from "next";
import { OrderStatusSelect } from "@/components/staff/order-status-select";
import type { OrderStatus } from "@/components/shop/order-status-timeline";
import { formatNaira } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Orders | HEIDIZ Admin" };

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "PLACED", label: "Order Placed" },
  { value: "PAYMENT_CONFIRMED", label: "Payment Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default async function AdminOrdersPage(props: PageProps<"/admin/orders">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const status = typeof searchParams.status === "string" ? searchParams.status : "";

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status: status as OrderStatus } : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: "insensitive" as const } },
              { customerName: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="p-8 md:p-10">
      <h1 className="font-display text-2xl text-brand-black">Orders ({orders.length})</h1>

      <form method="GET" className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search order number or customer name"
          className="w-full max-w-sm rounded-button border border-brand-black/15 bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-charcoal/70 focus:outline-none focus:ring-2 focus:ring-burnt-orange"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-button border border-brand-black/15 bg-white px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-burnt-orange"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-button bg-burnt-orange px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Filter
        </button>
        {(q || status) && (
          <a href="/admin/orders" className="text-sm text-charcoal/70 hover:text-burnt-orange">
            Clear
          </a>
        )}
      </form>

      <div className="mt-6 overflow-x-auto rounded-[4px] border border-brand-black/10 bg-white">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-brand-black/10 text-left text-xs uppercase tracking-wide text-charcoal/70">
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Items</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Payment</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-brand-black/5 last:border-0">
                <td className="px-5 py-3 font-medium text-brand-black">{order.orderNumber}</td>
                <td className="px-5 py-3 text-charcoal/70">
                  {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                </td>
                <td className="px-5 py-3 text-charcoal/70">
                  {order.customerName}
                  <br />
                  <span className="text-xs text-charcoal/70">{order.phone}</span>
                </td>
                <td className="px-5 py-3 text-charcoal/70">
                  {order.items
                    .map((i) => {
                      const options = [i.size && `Size ${i.size}`, i.color].filter(Boolean).join(", ");
                      return `${i.productName}${options ? ` (${options})` : ""} x${i.quantity}`;
                    })
                    .join(", ")}
                </td>
                <td className="px-5 py-3 text-charcoal/70">{formatNaira(order.total)}</td>
                <td className="px-5 py-3 text-charcoal/70">{order.paymentMethodLabel}</td>
                <td className="px-5 py-3">
                  <OrderStatusSelect orderNumber={order.orderNumber} currentStatus={order.status as OrderStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p className="py-10 text-center text-sm text-charcoal/70">
            {q || status ? "No orders match this search." : "No orders yet."}
          </p>
        )}
      </div>
    </div>
  );
}
