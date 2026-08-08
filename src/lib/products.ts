// DB-backed product catalog, server-side only (imports `prisma`, which
// touches env vars/native bindings that don't belong in client bundles).
// Migrated 2026-08-07 from the static array in src/lib/placeholder-data.ts
// so admin can edit price/stock/promo state live — see src/app/admin/products.
// Client components that need product lookups use the catalog context
// instead (src/lib/product-catalog-context.tsx), which calls /api/products.

import { prisma } from "@/lib/prisma";
import { accessoryCategorySlugs, beautyCategorySlugs } from "@/lib/placeholder-data";
import type { Product, FragranceNotes, IconKey, ProductBadge } from "@/lib/product-types";

// Raw shape as stored/returned by Prisma — badge/icon are plain strings in
// Postgres (no native enum for these, matching the original static file's
// looseness), fragranceNotes is Json. This narrows them back to the app's
// stricter Product type.
type ProductRow = {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  compareAtPrice: number | null;
  badge: string | null;
  icon: string;
  image: string | null;
  images: string[];
  sizes: string[];
  colors: string[];
  sizePricing: unknown;
  description: string;
  benefits: string[];
  directions: string;
  ingredients: string | null;
  fragranceNotes: unknown;
  rating: number;
  reviewCount: number;
  inStock: boolean;
};

function toProduct(row: ProductRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category,
    categorySlug: row.categorySlug,
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? undefined,
    badge: (row.badge as ProductBadge | null) ?? undefined,
    icon: row.icon as IconKey,
    image: row.image ?? undefined,
    images: row.images ?? [],
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    sizePricing: (row.sizePricing as Record<string, number> | null) ?? undefined,
    description: row.description,
    benefits: row.benefits,
    directions: row.directions,
    ingredients: row.ingredients ?? undefined,
    fragranceNotes: (row.fragranceNotes as FragranceNotes | null) ?? undefined,
    rating: row.rating,
    reviewCount: row.reviewCount,
    inStock: row.inStock,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return rows.map(toProduct);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const row = await prisma.product.findUnique({ where: { slug } });
  return row ? toProduct(row) : undefined;
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where:
      categorySlug === "accessories"
        ? { categorySlug: { in: accessoryCategorySlugs } }
        : categorySlug === "beauty-skincare"
          ? { categorySlug: { in: beautyCategorySlugs } }
          : { categorySlug },
    orderBy: { name: "asc" },
  });
  return rows.map(toProduct);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const [sameCategory, others] = await Promise.all([
    prisma.product.findMany({
      where: { categorySlug: product.categorySlug, slug: { not: product.slug } },
      take: limit,
    }),
    prisma.product.findMany({
      where: { categorySlug: { not: product.categorySlug } },
      take: limit,
    }),
  ]);
  return [...sameCategory, ...others].slice(0, limit).map(toProduct);
}

export async function getBestSellers(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ where: { badge: "Best Seller" }, orderBy: { name: "asc" } });
  return rows.map(toProduct);
}

export async function getNewArrivals(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ where: { badge: "New" }, orderBy: { name: "asc" } });
  return rows.map(toProduct);
}

export async function getGiftSets(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ where: { category: "Gift Sets" }, orderBy: { name: "asc" } });
  return rows.map(toProduct);
}

export async function getOilPerfumes(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ where: { category: "Oil Perfumes" }, orderBy: { name: "asc" } });
  return rows.map(toProduct);
}

// Powers the header's search icon (see /search) — matches on name,
// category label, or description, case-insensitive. Simple substring
// search is enough for a catalog this size; no separate search index.
export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim();
  if (!q) return [];
  const rows = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
  });
  return rows.map(toProduct);
}
