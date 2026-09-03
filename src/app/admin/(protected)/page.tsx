import Link from "next/link";
import { ChevronRight, ShoppingBag, Wallet, Clock, TrendingUp } from "lucide-react";
import type { OrderStatus } from "@/components/shop/order-status-timeline";
import { formatNaira } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const STATUS_LABELS: Record<string, string> = {
  PLACED: "Order Placed",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  PROCESSING: "Processing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

// "Needs attention" — orders that haven't reached a terminal state yet.
const PENDING_STATUSES: OrderStatus[] = ["PLACED", "PAYMENT_CONFIRMED", "PROCESSING"];

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[4px] border border-brand-black/10 bg-white p-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-champagne/30 text-burnt-orange">
        <Icon className="h-4 w-4" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-display text-2xl text-brand-black">{value}</p>
        <p className="text-xs uppercase tracking-wide text-charcoal/70">{label}</p>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [todayOrderCount, todayRevenueAgg, pendingCount, allTimeCount, allTimeRevenueAgg, recentOrders] =
    await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: startOfToday }, status: { not: "CANCELLED" } },
      }),
      prisma.order.count({ where: { status: { in: PENDING_STATUSES } } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: "CANCELLED" } } }),
      prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { items: true } }),
    ]);

  return (
    <div className="p-8 md:p-10">
      <h1 className="font-display text-2xl text-brand-black">Dashboard</h1>
      <p className="mt-1 text-sm text-charcoal/70">
        {now.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ShoppingBag} label="Orders Today" value={String(todayOrderCount)} />
        <StatCard icon={Wallet} label="Revenue Today" value={formatNaira(todayRevenueAgg._sum.total ?? 0)} />
        <StatCard icon={Clock} label="Needs Attention" value={String(pendingCount)} />
        <StatCard icon={TrendingUp} label="All-Time Revenue" value={formatNaira(allTimeRevenueAgg._sum.total ?? 0)} />
      </div>
      <p className="mt-3 text-xs text-charcoal/70">
        {allTimeCount} orders total · revenue figures exclude cancelled orders
      </p>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-brand-black">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-sm text-burnt-orange hover:underline"
          >
            View All Orders
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto rounded-[4px] border border-brand-black/10 bg-white">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-brand-black/10 text-left text-xs uppercase tracking-wide text-charcoal/70">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-brand-black/5 last:border-0">
                  <td className="px-5 py-3 font-medium text-brand-black">{order.orderNumber}</td>
                  <td className="px-5 py-3 text-charcoal/70">{order.customerName}</td>
                  <td className="px-5 py-3 text-charcoal/70">{formatNaira(order.total)}</td>
                  <td className="px-5 py-3 text-charcoal/70">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentOrders.length === 0 && (
            <p className="py-10 text-center text-sm text-charcoal/70">No orders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
