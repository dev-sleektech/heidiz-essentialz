import { getDeliveryFee, FREE_DELIVERY_THRESHOLD } from "@/lib/delivery";
import { formatNaira } from "@/lib/format";

export function OrderSummary({
  subtotal,
  itemCount,
  children,
  deliveryFeeOverride,
  deliveryEtaLabel,
}: {
  subtotal: number;
  itemCount: number;
  children?: React.ReactNode;
  // Checkout passes these once it knows the customer's state, for the real
  // zone-based fee + ETA (see src/lib/delivery.ts getDeliveryEstimate).
  // Omitted on the cart page (no address collected yet), where this falls
  // back to the same flat-fee estimate it always showed.
  deliveryFeeOverride?: number;
  deliveryEtaLabel?: string;
}) {
  const delivery = deliveryFeeOverride ?? getDeliveryFee(subtotal);
  // Without an address we're showing the flat fee, and the zone fee at
  // checkout can be higher (up to 6,000 for the far zones against a 3,500
  // flat estimate). Saying "estimated" here means the total going up after
  // five form fields isn't a surprise — a total that rises late is the most
  // reliable abandonment trigger there is.
  const isEstimate = deliveryFeeOverride === undefined && delivery > 0;
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
          <span>{isEstimate ? "Delivery (estimated)" : "Delivery"}</span>
          <span>{delivery === 0 ? "Complimentary" : formatNaira(delivery)}</span>
        </div>
        {isEstimate && (
          <p className="text-xs text-charcoal/70">
            Final fee is calculated at checkout from your state.
          </p>
        )}
        {deliveryEtaLabel && (
          <p className="text-xs text-charcoal/70">Estimated delivery: {deliveryEtaLabel}</p>
        )}
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
