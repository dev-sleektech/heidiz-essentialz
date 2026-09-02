// DB-backed category list, server-side only (imports `prisma`, same
// constraint as products.ts). Migrated 2026-09-02 from the static
// `categories` array in src/lib/placeholder-data.ts so staff can manage
// collections from /admin/categories without a deploy.
//
// Client components get categories either as props from a server component
// (header/footer via SiteChrome, the admin forms) or over /api/categories.
//
// Two read paths, deliberately:
//
//   getAllCategories()      cached across requests, for the storefront
//   getAllCategoriesFresh() straight from the DB, for /admin
//
// The storefront reads this list on every page render — the root layout
// builds the header and footer from it — including on uncacheable routes
// like /cart and /search, so without a cross-request cache each of those
// paid for a query against data that changes maybe weekly. The admin can't
// share that cache: a route handler can only mark a tag stale
// (`revalidateTag`; `updateTag` is Server-Actions-only), so staff could
// save a category and find their own edit missing on the next screen.
// Admin correctness beats admin speed, so it queries directly.

import { cache } from "react";
import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import type { Category, NavGroup } from "@/lib/category-types";
import { NAV_GROUPS } from "@/lib/category-types";
import type { IconKey } from "@/lib/product-types";

export type { Category, NavGroup };

/** Cache tag every storefront category read shares, so one revalidateTag in
 *  the admin write routes refreshes the header, footer, homepage grid and
 *  every category page at once. */
export const CATEGORIES_CACHE_TAG = "categories";

const ORDER_BY = [{ sortOrder: "asc" as const }, { name: "asc" as const }];

type CategoryRow = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  image: string | null;
  groupSlugs: string[];
  navGroup: string | null;
  sortOrder: number;
  assignable: boolean;
  showOnHome: boolean;
};

function toCategory(row: CategoryRow): Category {
  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    icon: row.icon as IconKey,
    image: row.image ?? undefined,
    groupSlugs: row.groupSlugs ?? [],
    navGroup: NAV_GROUPS.includes(row.navGroup as NavGroup) ? (row.navGroup as NavGroup) : null,
    sortOrder: row.sortOrder,
    assignable: row.assignable,
    showOnHome: row.showOnHome,
  };
}

async function queryAllCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({ orderBy: ORDER_BY });
  return rows.map(toCategory);
}

const loadAllCategories = unstable_cache(queryAllCategories, ["all-categories"], {
  tags: [CATEGORIES_CACHE_TAG],
  revalidate: 3600,
});

// React's `cache` on top of the cross-request cache collapses the several
// reads within a single render (layout + page + generateMetadata) into one.
export const getAllCategories = cache(async function getAllCategories(): Promise<Category[]> {
  return loadAllCategories();
});

/** Uncached read for /admin, so staff always see what they just saved. */
export const getAllCategoriesFresh = cache(async function getAllCategoriesFresh(): Promise<
  Category[]
> {
  return queryAllCategories();
});

// Served from the already-loaded list rather than its own query: there are
// a couple of dozen categories, and every caller has triggered the list
// load through the layout anyway.
export const getCategory = cache(async function getCategory(
  slug: string
): Promise<Category | undefined> {
  return (await getAllCategories()).find((c) => c.slug === slug);
});

export const getCategoryFresh = cache(async function getCategoryFresh(
  slug: string
): Promise<Category | undefined> {
  return (await getAllCategoriesFresh()).find((c) => c.slug === slug);
});

/** Only the categories a product can actually be filed under — excludes
 *  pure umbrellas like Accessories. Drives the admin product form's picker,
 *  so it reads fresh. */
export async function getAssignableCategories(): Promise<Category[]> {
  return (await getAllCategoriesFresh()).filter((c) => c.assignable);
}

/** Every category slug whose products belong on `slug`'s page: the category
 *  itself plus anything it folds in (see Category.groupSlugs). Used by
 *  getProductsByCategory — replaces the old hard-coded
 *  accessoryCategorySlugs / beautyCategorySlugs constants. */
export async function getCategorySlugsForPage(slug: string): Promise<string[]> {
  const category = await getCategory(slug);
  if (!category) return [slug];
  return Array.from(new Set([category.slug, ...category.groupSlugs]));
}

/** Number of products currently filed under a category. The delete route
 *  refuses non-zero, and the admin list shows it so staff can see what a
 *  delete would take with it. */
export async function countProductsInCategory(slug: string): Promise<number> {
  return prisma.product.count({ where: { categorySlug: slug } });
}

export async function getProductCountsByCategory(): Promise<Record<string, number>> {
  const rows = await prisma.product.groupBy({ by: ["categorySlug"], _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.categorySlug, r._count._all]));
}
