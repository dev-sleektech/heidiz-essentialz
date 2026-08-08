"use client";

import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { ProductVisual } from "@/components/ui/product-visual";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/product-types";
import { formatNaira } from "@/lib/format";

export function CartLineItem({
  product,
  quantity,
  size,
  color,
  unitPrice,
}: {
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
  unitPrice?: number;
}) {
  const { setQuantity, removeItem } = useCart();
  const options = { size, color };

  return (
    <div className="flex gap-4 border-b border-brand-black/10 py-6 first:pt-0">
      <Link href={`/product/${product.slug}`} className="shrink-0">
        <ProductVisual icon={product.icon} src={product.image} className="h-24 w-20 sm:h-28 sm:w-24" />
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs uppercase tracking-wide text-charcoal/50">{product.category}</span>
            <Link href={`/product/${product.slug}`}>
              <h3 className="font-display text-base text-brand-black sm:text-lg">{product.name}</h3>
            </Link>
            {(size || color) && (
              <span className="text-xs text-charcoal/50">
                {[size && `Size ${size}`, color].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Remove from cart"
            onClick={() => removeItem(product.slug, options)}
            className="shrink-0 text-charcoal/40 hover:text-burnt-orange"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center rounded-button border border-brand-black/15">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity(product.slug, quantity - 1, options)}
              className="flex h-8 w-8 items-center justify-center text-charcoal hover:text-burnt-orange"
            >
              <Minus className="h-3 w-3" strokeWidth={1.5} />
            </button>
            <span className="w-6 text-center text-xs">{quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity(product.slug, Math.min(10, quantity + 1), options)}
              className="flex h-8 w-8 items-center justify-center text-charcoal hover:text-burnt-orange"
            >
              <Plus className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>

          <span className="text-sm font-medium text-burnt-orange">
            {formatNaira((unitPrice ?? product.price) * quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
