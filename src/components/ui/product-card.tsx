"use client";


import Link from "next/link";
import { Heart, Check } from "lucide-react";
import { ProductVisual } from "@/components/ui/product-visual";
import { useCart } from "@/lib/cart-context";
import { useTransientFlag } from "@/lib/use-transient-flag";
import { useWishlist } from "@/lib/wishlist-context";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/product-types";
import { formatNaira } from "@/lib/format";
import { PromoBadge, computeDiscountPercent, isPromoBadge } from "@/components/ui/promo-badge";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  /** Set on the first row of a grid: on the catalog routes these cards are
   *  the first visible content, so lazy-loading them delayed the largest
   *  paint on exactly the pages built to sell. */
  priority?: boolean;
}) {
  const { addItem } = useCart();
  const { toggle, has } = useWishlist();
  const [justAdded, markAdded] = useTransientFlag();
  const wishlisted = has(product.slug);

  function handleAddToCart() {
    addItem(product.slug);
    markAdded();
  }

  return (
    <div className="group flex flex-col">
      <div className="relative">
        {/* Full-cover click target so the image opens the product page;
            sits below the wishlist/add-to-cart controls in z-index so
            those stay clickable without nesting a <button> in an <a>. */}
        <Link
          href={`/product/${product.slug}`}
          aria-label={product.name}
          className="absolute inset-0 z-10"
        />

        <ProductVisual
          priority={priority}
          icon={product.icon}
          src={product.image}
          className="aspect-[4/5] w-full"
        />

        {product.badge && isPromoBadge(product.badge) ? (
          <PromoBadge
            badge={product.badge}
            discountPercent={computeDiscountPercent(product.price, product.compareAtPrice)}
            className="absolute top-3 right-0 z-10"
          />
        ) : (
          product.badge && (
            <span className="absolute top-3 right-3 rounded-full bg-brand-black/85 px-3 py-1 text-[0.65rem] tracking-wide text-white">
              {product.badge}
            </span>
          )
        )}

        <button
          type="button"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={() => toggle(product.slug)}
          className={cn(
            "absolute top-3 left-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-brand-black backdrop-blur transition-opacity duration-300",
            wishlisted
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"
          )}
        >
          <Heart
            className="h-4 w-4"
            strokeWidth={1.5}
            fill={wishlisted ? "currentColor" : "none"}
          />
        </button>

        {/* pointer-events-none until hovered: without this, the invisible
            button here still sits above the full-cover Link (z-20 > z-10)
            and silently intercepts taps meant for "view product" — hover
            never fires on touch devices, so this was hijacking every tap
            in this region on mobile into an add-to-cart instead of a
            navigation. */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 translate-y-2 opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="relative flex w-full items-center justify-center gap-1.5 rounded-button bg-brand-black/90 py-2.5 text-xs tracking-wide text-white backdrop-blur hover:bg-burnt-orange disabled:cursor-not-allowed disabled:opacity-50"
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                Added
              </>
            ) : product.inStock ? (
              "Add to Cart"
            ) : (
              "Out of Stock"
            )}
          </button>
        </div>
      </div>

      <Link href={`/product/${product.slug}`} className="mt-4 flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-charcoal/70">
          {product.category}
        </span>
        <h3 className="font-display text-lg text-brand-black">{product.name}</h3>
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium text-burnt-orange">
            {formatNaira(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-xs text-charcoal/70 line-through">
              {formatNaira(product.compareAtPrice)}
            </span>
          )}
        </span>
      </Link>
    </div>
  );
}
