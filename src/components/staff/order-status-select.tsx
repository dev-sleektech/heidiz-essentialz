"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { OrderStatus } from "@/components/shop/order-status-timeline";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "PLACED", label: "Order Placed" },
  { value: "PAYMENT_CONFIRMED", label: "Payment Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function OrderStatusSelect({
  orderNumber,
  currentStatus,
}: {
  orderNumber: string;
  currentStatus: OrderStatus;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleChange(next: OrderStatus) {
    setError(null);
    const previous = status;
    setStatus(next);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/staff/orders/${orderNumber}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        const data = await res.json();
        if (!data.updated) {
          setStatus(previous);
          setError(data.message ?? "Update failed.");
        } else {
          router.refresh();
        }
      } catch {
        setStatus(previous);
        setError("Update failed.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <select
          value={status}
          disabled={isPending}
          onChange={(e) => handleChange(e.target.value as OrderStatus)}
          className="cursor-pointer rounded-button border border-brand-black/15 bg-white px-3 py-2 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-burnt-orange disabled:opacity-50"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-charcoal/40" strokeWidth={1.5} />}
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
