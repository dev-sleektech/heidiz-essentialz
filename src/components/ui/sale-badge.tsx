// Original tag-shaped "Sale" badge — replaces the plain pill previously
// used for the Sale badge specifically (New/Best Seller/Limited keep the
// simple pill, unchanged). Built as a real price-tag silhouette (pointed
// end + punched hole) via clip-path rather than a stock graphic, in the
// site's own burnt-orange/champagne palette. Shows "-X%" when a discount
// percentage can be computed from price vs compareAtPrice, else just
// "SALE".
export function SaleBadge({
  discountPercent,
  className,
}: {
  discountPercent?: number;
  className?: string;
}) {
  // `className` (e.g. "absolute top-3 right-0") controls placement in the
  // caller's layout. It's kept on its own outer wrapper rather than merged
  // into the badge's own classes below, since both would otherwise set a
  // conflicting `position` value on the same element — Tailwind doesn't
  // resolve that by className order, so whichever wins is unpredictable.
  // The inner div's own `relative` (needed as the containing block for the
  // hole-punch dot) stays safe from that clash this way.
  return (
    <div className={className}>
      <div
        className="relative flex items-center gap-1 py-1.5 pl-5 pr-3 text-[0.65rem] font-semibold tracking-wide text-white shadow-sm"
        style={{
          background: "linear-gradient(135deg, #D9642C 0%, #B5531E 100%)",
          clipPath: "polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)",
        }}
      >
        <span
          className="absolute left-[7px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-ivory/90"
          aria-hidden="true"
        />
        {discountPercent ? `-${discountPercent}% SALE` : "SALE"}
      </div>
    </div>
  );
}

export function computeDiscountPercent(price: number, compareAtPrice?: number): number | undefined {
  if (!compareAtPrice || compareAtPrice <= price) return undefined;
  return Math.round((1 - price / compareAtPrice) * 100);
}
