"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, Heart, Repeat, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { cn } from "@/lib/utils";

export function ProductActions({ slug, inStock }: { slug: string; inStock: boolean }) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem } = useCart();
  const { toggle, has } = useWishlist();
  const router = useRouter();
  const wishlisted = has(slug);

  function handleAddToCart() {
    addItem(slug, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  function handleBuyNow() {
    addItem(slug, quantity);
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col gap-4">
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
