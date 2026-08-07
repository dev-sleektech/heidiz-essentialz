"use client";

// Client-side mirror of the DB-backed catalog (src/lib/products.ts), for
// components that can't be server components: cart-context (computes
// subtotal from slugs), cart/checkout/wishlist pages. Fetches the full
// catalog once on mount from /api/products and exposes the same
// getProduct(slug)-by-array-scan shape the old static import had, so call
// sites barely changed — just swap the import for this hook.

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/product-types";

type ProductCatalogValue = {
  products: Product[];
  getProduct: (slug: string) => Product | undefined;
  loading: boolean;
};

const ProductCatalogContext = createContext<ProductCatalogValue | null>(null);

export function ProductCatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setProducts(data.products ?? []);
      })
      .catch(() => {
        // Cart/checkout degrade to "product not found" per-line rather than
        // crashing — same failure mode as a missing slug did before.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<ProductCatalogValue>(() => {
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    return {
      products,
      getProduct: (slug: string) => bySlug.get(slug),
      loading,
    };
  }, [products, loading]);

  return <ProductCatalogContext.Provider value={value}>{children}</ProductCatalogContext.Provider>;
}

export function useProductCatalog() {
  const ctx = useContext(ProductCatalogContext);
  if (!ctx) throw new Error("useProductCatalog must be used within ProductCatalogProvider");
  return ctx;
}
