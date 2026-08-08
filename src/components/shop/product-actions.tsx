"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, Heart, Repeat, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { cn } from "@/lib/utils";

export function ProductActions({
  slug,
  inStock,
  sizes = [],
  colors = [],
}: {
  slug: string;
  inStock: boolean;
  sizes?: string[];
  colors?: string[];
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

  return (
    <div className="flex flex-col gap-4">
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
