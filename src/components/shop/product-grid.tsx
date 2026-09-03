"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/ui/product-card";
import type { Product } from "@/lib/product-types";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

const SORT_LABELS: Record<SortKey, string> = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Top Rated",
};

export function ProductGrid({ products }: { products: Product[] }) {
  const [sort, setSort] = useState<SortKey>("featured");

  const sorted = useMemo(() => {
    const list = [...products];
    switch (sort) {
      case "price-asc":
        return list.sort((a, b) => a.price - b.price);
      case "price-desc":
        return list.sort((a, b) => b.price - a.price);
      case "rating":
        return list.sort((a, b) => b.rating - a.rating);
      default:
        return list;
    }
  }, [products, sort]);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-brand-black/10 pb-4">
        <span className="text-xs uppercase tracking-wide text-charcoal/70">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </span>

        <label className="flex items-center gap-2 text-xs text-charcoal/70">
          <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="cursor-pointer rounded-button border border-brand-black/15 bg-white px-3 py-2 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-burnt-orange"
          >
            {Object.entries(SORT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-24 text-center">
          <p className="font-display text-xl text-brand-black">
            This collection is still being curated.
          </p>
          <p className="text-sm text-charcoal/80">Check back soon, or explore another category.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {sorted.map((product, i) => (
            // The grid is 4-up at its widest, so the first four are the
            // only ones reliably above the fold.
            <ProductCard key={product.slug} product={product} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
