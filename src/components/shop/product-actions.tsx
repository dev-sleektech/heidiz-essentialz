"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Minus, Plus, Heart, Repeat, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PromoBadge, computeDiscountPercent, isPromoBadge } from "@/components/ui/promo-badge";

export function ProductActions({
  slug,
  price,
  compareAtPrice,
  badge,
  inStock,
  sizes = [],
  colors = [],
  sizePricing,
}: {
  slug: string;
  price: number;
  compareAtPrice?: number;
  badge?: string;
  inStock: boolean;
  sizes?: string[];
  colors?: string[];
  sizePricing?: Record<string, number>;
}) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  // Size starts unselected (unlike color) since the list mixes men's and
  // women's sizes — defaulting to the first entry would silently pick a
  // gendered size for the customer instead of making them choose.
  const [size, setSize] = useState<string | undefined>(undefined);
  const [color, setColor] = useState<string | undefined>(colors[0]);
  const [optionError, setOptionError] = useState(false);
  const { addItem } = useCart();
  const { toggle, has } = useWishlist();
  const router = useRouter();
  const wishlisted = has(slug);

  // Price lives here (not in the parent server page) specifically so it can
  // react to the size the customer has picked — a 100ml perfume shouldn't
  // show the same price as the 25ml, once size-specific pricing is set from
  // admin. Falls back to the base price when the selected size has no
  // override, or when nothing's selected yet.
  const effectivePrice = useMemo(() => {
    if (size && sizePricing?.[size] !== undefined) return sizePricing[size];
    return price;
  }, [size, sizePricing, price]);

  function validated() {
    if ((sizes.length > 0 && !size) || (colors.length > 0 && !color)) {
      setOptionError(true);
      return false;
    }
    setOptionError(false);
    return true;
  }

  function handleAddToCart() {
    if (!validated()) return;
    addItem(slug, quantity, { size, color });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  function handleBuyNow() {
    if (!validated()) return;
    addItem(slug, quantity, { size, color });
    router.push("/checkout");
  }

  const hasSizePricing = sizes.some((s) => sizePricing?.[s] !== undefined);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="font-display text-2xl text-burnt-orange">{formatNaira(effectivePrice)}</span>
        {compareAtPrice && (
          <span className="text-base text-charcoal/40 line-through">{formatNaira(compareAtPrice)}</span>
        )}
        {badge && isPromoBadge(badge) ? (
          <PromoBadge badge={badge} discountPercent={computeDiscountPercent(effectivePrice, compareAtPrice)} />
        ) : (
          badge && (
            <span className="rounded-full bg-brand-black px-3 py-1 text-[0.65rem] tracking-wide text-white">
              {badge}
            </span>
          )
        )}
      </div>
      {hasSizePricing && !size && (
        <p className="-mt-2 text-xs text-charcoal/50">Price varies by size, select one below.</p>
      )}

      {sizes.length > 0 && (
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-charcoal/60">Size</span>
          <select
            value={size ?? ""}
            onChange={(e) => setSize(e.target.value || undefined)}
            className={cn(
              "rounded-button border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-burnt-orange",
              size ? "border-brand-black/15 text-brand-black" : "border-brand-black/15 text-charcoal/50"
            )}
          >
            <option value="" disabled>
              Select a size
            </option>
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      )}

      {colors.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-charcoal/60">Color</span>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "rounded-button border px-4 py-2 text-sm transition-colors",
                  color === c
                    ? "border-burnt-orange bg-champagne/20 text-brand-black"
                    : "border-brand-black/15 text-charcoal/70 hover:border-burnt-orange"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {optionError && (
        <p className="text-xs text-red-600">Please select a {!size ? "size" : "color"} before continuing.</p>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-button border border-brand-black/15">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-11 w-11 items-center justify-center text-charcoal hover:text-burnt-orange"
          >
            <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <span className="w-8 text-center text-sm">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            className="flex h-11 w-11 items-center justify-center text-charcoal hover:text-burnt-orange"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          disabled={!inStock}
          onClick={handleAddToCart}
        >
          {justAdded ? (
            <>
              <Check className="h-4 w-4" strokeWidth={1.5} />
              Added to Cart
            </>
          ) : inStock ? (
            "Add to Cart"
          ) : (
            "Out of Stock"
          )}
        </Button>
      </div>

      <Button variant="dark" size="lg" disabled={!inStock} onClick={handleBuyNow}>
        Buy Now
      </Button>

      <div className="flex items-center gap-6 pt-1 text-xs text-charcoal/60">
        <button
          type="button"
          onClick={() => toggle(slug)}
          className={cn(
            "flex items-center gap-1.5 hover:text-burnt-orange",
            wishlisted && "text-burnt-orange"
          )}
        >
          <Heart className="h-4 w-4" strokeWidth={1.5} fill={wishlisted ? "currentColor" : "none"} />
          {wishlisted ? "Wishlisted" : "Wishlist"}
        </button>
        <button type="button" className="flex items-center gap-1.5 hover:text-burnt-orange">
          <Repeat className="h-4 w-4" strokeWidth={1.5} />
          Compare
        </button>
        <button type="button" className="flex items-center gap-1.5 hover:text-burnt-orange">
          <Share2 className="h-4 w-4" strokeWidth={1.5} />
          Share
        </button>
      </div>
    </div>
  );
}
