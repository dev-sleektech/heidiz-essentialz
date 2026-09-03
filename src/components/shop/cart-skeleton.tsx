// Placeholder rows for the window between a cart page mounting and the
// client catalog arriving from /api/products.
//
// This exists because the alternative is worse than a spinner: cart lines
// live in localStorage but carry only a slug, so until the catalog resolves
// there is nothing to render a line from and `resolvedLines` is empty. Both
// the cart and checkout read that as "the cart is empty" and said so —
// while the header badge, which counts localStorage directly, showed the
// real number. On a slow connection that self-contradicting page was the
// last thing a ready-to-buy customer saw.

export function CartSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-6 py-8" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-4">
          <div className="h-24 w-20 shrink-0 animate-pulse rounded-button bg-charcoal/10 sm:h-28 sm:w-24" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <div className="h-3 w-24 animate-pulse rounded bg-charcoal/10" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-charcoal/10" />
            <div className="h-4 w-20 animate-pulse rounded bg-charcoal/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
