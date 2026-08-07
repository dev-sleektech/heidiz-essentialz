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
  | "sunglasses";

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
  description: string;
  benefits: string[];
  directions: string;
  ingredients?: string;
  fragranceNotes?: FragranceNotes;
  rating: number;
  reviewCount: number;
  inStock: boolean;
};
