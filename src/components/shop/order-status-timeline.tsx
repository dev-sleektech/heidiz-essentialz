import { Check, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeliveryScooter } from "@/components/shop/delivery-scooter";

// Keep in sync with the OrderStatus enum in prisma/schema.prisma.
export type OrderStatus = "PLACED" | "PAYMENT_CONFIRMED" | "PROCESSING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PLACED", label: "Order Placed" },
  { status: "PAYMENT_CONFIRMED", label: "Payment Confirmed" },
  { status: "PROCESSING", label: "Processing" },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { status: "DELIVERED", label: "Delivered" },
];

export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-2 rounded-button bg-red-50 px-4 py-3 text-sm text-red-700">
        <XCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        This order was cancelled.
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.status === status);

  return (
    <div className="flex flex-col gap-6">
      {status === "OUT_FOR_DELIVERY" && (
        <div className="flex flex-col items-center gap-3 rounded-[4px] bg-champagne/20 px-4 py-6 text-center sm:flex-row sm:gap-6 sm:px-6 sm:text-left">
          <div className="relative w-40 shrink-0 overflow-hidden sm:w-48">
            <DeliveryScooter className="animate-scooter-ride h-20 w-full text-burnt-orange sm:h-24" />
          </div>
          <p className="text-sm text-brand-black">
            <span className="block font-display text-base">Your rider is on the way.</span>
            <span className="text-charcoal/60">Expect your order shortly.</span>
          </p>
        </div>
      )}

      <div className="flex flex-col gap-0 sm:flex-row sm:items-start">
        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const upcoming = i > currentIndex;

          return (
            <div key={step.status} className="flex flex-1 items-center sm:flex-col sm:items-stretch">
              <div className="flex items-center sm:flex-col">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs",
                    done && "border-burnt-orange bg-burnt-orange text-white",
                    active && "border-burnt-orange text-burnt-orange",
                    upcoming && "border-brand-black/15 text-charcoal/30"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-px flex-1 sm:mx-0 sm:mt-3 sm:h-px sm:w-full",
                      done ? "bg-burnt-orange" : "bg-brand-black/10"
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "ml-3 py-3 text-xs sm:ml-0 sm:mt-2 sm:py-0 sm:text-center",
                  (done || active) ? "text-brand-black" : "text-charcoal/40"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
