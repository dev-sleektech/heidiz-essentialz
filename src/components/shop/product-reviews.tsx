import { StarRating } from "@/components/ui/star-rating";
import { productReviewPool } from "@/lib/placeholder-data";
import type { Product } from "@/lib/product-types";

export function ProductReviews({ product }: { product: Product }) {
  // Cycles a small generic review pool per product until real customer
  // reviews start coming in; see productReviewPool in placeholder-data.ts.
  const offset = product.slug.length % productReviewPool.length;
  const reviews = [
    ...productReviewPool.slice(offset),
    ...productReviewPool.slice(0, offset),
  ].slice(0, 3);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-4">
        <span className="font-display text-4xl text-brand-black">{product.rating.toFixed(1)}</span>
        <div className="flex flex-col gap-1">
          <StarRating rating={product.rating} />
          <span className="text-xs text-charcoal/50">Based on {product.reviewCount} reviews</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {reviews.map((review) => (
          <div
            key={review.name}
            className="flex flex-col gap-3 rounded-[4px] border border-brand-black/10 bg-white p-6"
          >
            <StarRating rating={review.rating} starClassName="h-3.5 w-3.5" />
            <p className="text-sm leading-relaxed text-charcoal/70">&ldquo;{review.quote}&rdquo;</p>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-brand-black">{review.name}</span>
              <span className="text-xs text-charcoal/50">{review.location}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
