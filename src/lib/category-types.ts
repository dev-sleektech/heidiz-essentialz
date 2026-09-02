// Shared category shape, used by both the DB-backed query layer
// (src/lib/categories.ts) and the client components that receive
// categories as props or over /api/categories. Kept separate from
// categories.ts for the same reason product-types.ts is kept separate from
// products.ts: that file imports `prisma` and must never reach a client
// bundle.

import type { IconKey } from "@/lib/product-types";

// The two header dropdowns. A category with no nav group is still fully
// browsable at its own URL, it just isn't listed on the menu — umbrellas
// (Collections, Accessories) and the standalone Beauty & Skincare link are
// reachable from the top-level bar itself.
export const NAV_GROUPS = ["collections", "accessories"] as const;

export type NavGroup = (typeof NAV_GROUPS)[number];

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  collections: "Collections",
  accessories: "Accessories",
};

export type Category = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: IconKey;
  /** Real photo (public path or uploaded URL) shown on the category tile. */
  image?: string;
  /** Extra category slugs folded into this one's page (umbrella categories
   *  like Accessories). The category's own slug is always included on top
   *  of these, so an ordinary category leaves this empty. */
  groupSlugs: string[];
  /** Which header dropdown this collection sits under. Both menus are
   *  rendered alphabetically, so `sortOrder` doesn't apply there. */
  navGroup: NavGroup | null;
  sortOrder: number;
  /** False for pure umbrellas: they hold no products of their own, so they
   *  aren't offered when assigning a category to a product. */
  assignable: boolean;
  /** Whether it gets a tile in the homepage "Shop by Collection" grid. */
  showOnHome: boolean;
};

/** Splits a category list into the two header dropdowns, each sorted
 *  alphabetically by name as the client specified — deliberately not by
 *  sortOrder, which orders the homepage grid instead. Lives here rather
 *  than in categories.ts so the header (a client component receiving
 *  categories as props) can call it without pulling in prisma. */
export function groupForNav(categories: Category[]): Record<NavGroup, Category[]> {
  const byName = (a: Category, b: Category) => a.name.localeCompare(b.name);
  return {
    collections: categories.filter((c) => c.navGroup === "collections").sort(byName),
    accessories: categories.filter((c) => c.navGroup === "accessories").sort(byName),
  };
}
