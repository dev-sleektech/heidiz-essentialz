import { getDeliveryFee, FREE_DELIVERY_THRESHOLD } from "@/lib/delivery";
import { formatNaira } from "@/lib/format";

export function OrderSummary({
  subtotal,
  itemCount,
  children,
}: {
  subtotal: number;
  itemCount: number;
  children?: React.ReactNode;
}) {
  const delivery = getDeliveryFee(subtotal);
  const total = subtotal + delivery;
  const remainingForFreeDelivery = FREE_DELIVERY_THRESHOLD - subtotal;

  return (
    <div className="flex flex-col gap-4 rounded-[4px] border border-brand-black/10 bg-white p-6">
      <h2 className="font-display text-xl text-brand-black">Order Summary</h2>

      <div className="flex flex-col gap-2 text-sm text-charcoal/70">
        <div className="flex justify-between">
          <span>Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
          <span>{formatNaira(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery</span>
          <span>{delivery === 0 ? "Complimentary" : formatNaira(delivery)}</span>
        </div>
        {delivery > 0 && remainingForFreeDelivery > 0 && (
          <p className="text-xs text-burnt-orange">
            Add {formatNaira(remainingForFreeDelivery)} more for complimentary delivery.
          </p>
        )}
      </div>

      <div className="hairline" />

      <div className="flex justify-between font-display text-lg text-brand-black">
        <span>Total</span>
        <span>{formatNaira(total)}</span>
      </div>

      {children}
    </div>
  );
}
