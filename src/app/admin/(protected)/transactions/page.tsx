import type { Metadata } from "next";
import { Wallet, Banknote, CreditCard } from "lucide-react";
import { formatNaira } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Transactions | HEIDIZ Admin" };

// Real transaction/sales history + income cash book, entirely derived from
// existing Order data — no new tracking needed, this is auto-tracked income
// per the user's chosen scope (2026-08-07): "auto-track sales income" +
// "transaction history", not manual expense logging or reconciliation.
function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

const STATUS_LABELS: Record<string, string> = {
  PLACED: "Order Placed",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  PROCESSING: "Processing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default async function AdminTransactionsPage(props: PageProps<"/admin/transactions">) {
  const searchParams = await props.searchParams;
  const fromParam = typeof searchParams.from === "string" ? searchParams.from : "";
  const toParam = typeof searchParams.to === "string" ? searchParams.to : "";

  const from = fromParam ? new Date(fromParam) : startOfMonth();
  const to = toParam ? new Date(toParam) : new Date();
  // Inclusive of the whole "to" day.
  const toEnd = new Date(to);
  toEnd.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lte: toEnd } },
    orderBy: { createdAt: "desc" },
  });

  // Cancelled orders never actually collected money — excluded from income
  // totals, but still shown in the transaction list for the paper trail.
  const counted = orders.filter((o) => o.status !== "CANCELLED");
  const totalSales = counted.reduce((sum, o) => sum + o.total, 0);

  const byMethod = new Map<string, { count: number; total: number }>();
  for (const order of counted) {
    const entry = byMethod.get(order.paymentMethodLabel) ?? { count: 0, total: 0 };
    entry.count++;
    entry.total += order.total;
    byMethod.set(order.paymentMethodLabel, entry);
  }

  const methodIcon = (label: string) => {
    if (label.includes("Card")) return CreditCard;
    if (label.includes("Bank Transfer")) return Banknote;
    return Wallet; // Pay on Delivery / cash
  };

  return (
    <div className="p-8 md:p-10">
      <h1 className="font-display text-2xl text-brand-black">Transactions</h1>
      <p className="mt-1 text-sm text-charcoal/70">
        Sales income by payment method, a running cash book pulled straight from real orders.
      </p>

      <form method="GET" className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wide text-charcoal/80">From</span>
          <input
            type="date"
            name="from"
            defaultValue={toDateInputValue(from)}
            className="rounded-button border border-brand-black/15 bg-white px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-burnt-orange"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wide text-charcoal/80">To</span>
          <input
            type="date"
            name="to"
            defaultValue={toDateInputValue(to)}
            className="rounded-button border border-brand-black/15 bg-white px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-burnt-orange"
          />
        </label>
        <button
          type="submit"
          className="rounded-button bg-burnt-orange px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Filter
        </button>
        <a href="/admin/transactions" className="pb-2.5 text-sm text-charcoal/70 hover:text-burnt-orange">
          This Month
        </a>
      </form>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3 rounded-[4px] border border-burnt-orange/30 bg-champagne/20 p-6">
          <span className="text-xs uppercase tracking-wide text-charcoal/70">Total Sales</span>
          <span className="font-display text-2xl text-brand-black">{formatNaira(totalSales)}</span>
          <span className="text-xs text-charcoal/70">{counted.length} transactions</span>
        </div>
        {Array.from(byMethod.entries()).map(([label, { count, total }]) => {
          const Icon = methodIcon(label);
          return (
            <div key={label} className="flex flex-col gap-3 rounded-[4px] border border-brand-black/10 bg-white p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory text-burnt-orange">
                <Icon className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <span className="font-display text-2xl text-brand-black">{formatNaira(total)}</span>
              <span className="text-xs text-charcoal/70">
                {label} &middot; {count}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-8 overflow-x-auto rounded-[4px] border border-brand-black/10 bg-white">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-brand-black/10 text-left text-xs uppercase tracking-wide text-charcoal/70">
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Payment Method</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-brand-black/5 last:border-0">
                <td className="px-5 py-3 text-charcoal/70">
                  {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-5 py-3 font-medium text-brand-black">{order.orderNumber}</td>
                <td className="px-5 py-3 text-charcoal/70">{order.customerName}</td>
                <td className="px-5 py-3 text-charcoal/70">{order.paymentMethodLabel}</td>
                <td className="px-5 py-3">
                  <span
                    className={
                      order.status === "CANCELLED"
                        ? "rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-700"
                        : "rounded-full bg-champagne/40 px-2.5 py-1 text-xs text-brand-black"
                    }
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-charcoal/70">
                  {order.status === "CANCELLED" ? (
                    <span className="text-charcoal/70 line-through">{formatNaira(order.total)}</span>
                  ) : (
                    formatNaira(order.total)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p className="py-10 text-center text-sm text-charcoal/70">No transactions in this date range.</p>
        )}
      </div>
    </div>
  );
}
