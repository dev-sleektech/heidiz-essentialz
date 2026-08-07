// Shared product shape, used by both the DB-backed query layer
// (src/lib/products.ts) and the client-side catalog context
// (src/lib/product-catalog-context.tsx). Kept separate from
// src/lib/placeholder-data.ts (which still owns categories/testimonials/
// Instagram posts — not part of the product-catalog DB migration) to avoid
// a circular import between that file and the Prisma-backed one.

export type IconKey =
  | "perfume"
  | "skincare"
  | "makeup"
  | "hair"
  | "watch"
  | "bag"
  | "jewelry"
  | "sunglasses"
  | "shoes"
  | "candle";

export type FragranceNotes = {
  top: string[];
  heart: string[];
  base: string[];
};

export type ProductBadge = "New" | "Best Seller" | "Limited" | "Sale";

export type Product = {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  compareAtPrice?: number;
  badge?: ProductBadge;
  icon: IconKey;
  image?: string;
  /** Full gallery, up to 10 photos, for the product detail page. Empty when
   *  only a single `image` has been set (older/simpler products). */
  images: string[];
  /** Informational option tags (e.g. ["40","41","42"]) — not per-size stock
   *  tracking, just a picker whose selection rides along on the cart line. */
  sizes: string[];
  colors: string[];
  description: string;
  benefits: string[];
  directions: string;
  ingredients?: string;
  fragranceNotes?: FragranceNotes;
  rating: number;
  reviewCount: number;
  inStock: boolean;
};
