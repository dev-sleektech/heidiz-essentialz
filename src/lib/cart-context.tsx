"use client";

// Client-side cart, persisted to localStorage. There's no backend yet (see
// project memory), so this is the full cart implementation for now — swap
// for a server-backed cart (session/user-scoped) once accounts + a real
// backend exist.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useProductCatalog } from "@/lib/product-catalog-context";

const STORAGE_KEY = "heidiz-cart-v1";

// Optional, informational-only selections (see sizes/colors on Product) —
// not a full variant-inventory system, just carried along on the line so
// it survives into checkout/orders instead of silently vanishing. Two
// lines for the same product with different size/color are kept separate.
export type CartLine = { slug: string; quantity: number; size?: string; color?: string };
type LineOptions = { size?: string; color?: string };

function sameLine(line: CartLine, slug: string, options?: LineOptions) {
  return line.slug === slug && line.size === options?.size && line.color === options?.color;
}

type CartContextValue = {
  lines: CartLine[];
  addItem: (slug: string, quantity?: number, options?: LineOptions) => void;
  removeItem: (slug: string, options?: LineOptions) => void;
  setQuantity: (slug: string, quantity: number, options?: LineOptions) => void;
  clear: () => void;
  totalItems: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { getProduct } = useProductCatalog();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load once on mount (client only, avoids SSR/localStorage mismatch).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore malformed/inaccessible storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem = useCallback((slug: string, quantity = 1, options?: LineOptions) => {
    setLines((prev) => {
      const existing = prev.find((l) => sameLine(l, slug, options));
      if (existing) {
        return prev.map((l) =>
          sameLine(l, slug, options) ? { ...l, quantity: l.quantity + quantity } : l
        );
      }
      return [...prev, { slug, quantity, size: options?.size, color: options?.color }];
    });
  }, []);

  const removeItem = useCallback((slug: string, options?: LineOptions) => {
    setLines((prev) => prev.filter((l) => !sameLine(l, slug, options)));
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number, options?: LineOptions) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => !sameLine(l, slug, options));
      return prev.map((l) => (sameLine(l, slug, options) ? { ...l, quantity } : l));
    });
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const { totalItems, subtotal } = useMemo(() => {
    let count = 0;
    let sum = 0;
    for (const line of lines) {
      const product = getProduct(line.slug);
      if (!product) continue;
      count += line.quantity;
      sum += product.price * line.quantity;
    }
    return { totalItems: count, subtotal: sum };
  }, [lines, getProduct]);

  return (
    <CartContext.Provider
      value={{ lines, addItem, removeItem, setQuantity, clear, totalItems, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
