"use client";

// Client-side wishlist, persisted to localStorage. Same caveat as
// cart-context.tsx: no backend yet, swap for a server-backed list once
// accounts exist.

import { createContext, useCallback, useContext, useMemo } from "react";
import { usePersistedState } from "@/lib/use-persisted-state";

const STORAGE_KEY = "heidiz-wishlist-v1";

// Stable reference — see the matching note in cart-context.tsx.
const NO_SLUGS: string[] = [];

type WishlistContextValue = {
  slugs: string[];
  toggle: (slug: string) => void;
  has: (slug: string) => boolean;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = usePersistedState<string[]>(STORAGE_KEY, NO_SLUGS);

  const toggle = useCallback(
    (slug: string) => {
      setSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
    },
    [setSlugs]
  );

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  // Without this the context value is a new object on every render, which
  // re-renders every consumer (the header badge, every product card) on
  // any parent render.
  const value = useMemo(() => ({ slugs, toggle, has }), [slugs, toggle, has]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
