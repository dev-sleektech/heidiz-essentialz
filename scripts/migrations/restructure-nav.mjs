// One-off restructure (2026-09-02, second pass) to the header the client
// specified:
//
//   New Arrivals | Collections ▾ | Beauty & Skincare | Accessories ▾ |
//   Contact | Refund Policy
//
// with both dropdowns listed alphabetically. Which collection appears in
// which dropdown is `Category.navGroup`, editable at /admin/categories, so
// the menu follows the catalog instead of a hard-coded list in the header.
//
// This script:
//   1. adds the five collections the client named that didn't exist yet
//      (The NICHE Collections, Incense, Miniatures, Bracelets, Necklaces),
//   2. renames three to the client's wording (Oil Perfumes, Wristwatches,
//      Hand Bags),
//   3. assigns every collection to its dropdown,
//   4. adds a "Collections" umbrella page so the menu label itself has
//      somewhere to point, mirroring how Accessories already worked,
//   5. refiles the two Jewelry products that now have a home of their own.
//
// Nothing is deleted. Idempotent: safe to re-run.
// `node scripts/restructure-nav.mjs`

import { randomUUID } from "node:crypto";
import pg from "pg";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — expected on CI/Vercel, real env vars are already set
}

// Collections the client named that had no category yet. sortOrder only
// drives the homepage grid — both dropdowns are alphabetical by name.
const NEW_CATEGORIES = [
  {
    slug: "the-niche-collections",
    name: "The NICHE Collections",
    tagline: "Rare houses, small batches",
    description:
      "Limited-allocation bottles from niche perfumers, the pieces that aren't on every counter.",
    icon: "perfume",
    navGroup: "collections",
    sortOrder: 5,
  },
  {
    slug: "incense",
    name: "Incense",
    tagline: "Bakhoor & oud chips",
    description:
      "Bakhoor, oud chips and incense blends for scenting a room, a wardrobe, or fabric the traditional way.",
    icon: "candle",
    navGroup: "collections",
    sortOrder: 45,
  },
  {
    slug: "miniatures",
    name: "Miniatures",
    tagline: "Travel sizes & discovery",
    description:
      "Small-format bottles and discovery sizes, made to travel or to try a house before committing to a full bottle.",
    icon: "perfume",
    navGroup: "collections",
    sortOrder: 55,
  },
  {
    slug: "bracelets",
    name: "Bracelets",
    tagline: "Wrist finishing pieces",
    description:
      "Charm bracelets, bangles and cuffs in gold, silver and precious stones, made for everyday wear as much as the occasion.",
    icon: "jewelry",
    navGroup: "accessories",
    sortOrder: 100,
  },
  {
    slug: "necklaces",
    name: "Necklaces",
    tagline: "Pendants & pearls",
    description:
      "Pendants, chains and pearl strands that finish a look without competing with it.",
    icon: "jewelry",
    navGroup: "accessories",
    sortOrder: 105,
  },
];

// The client's wording for collections that already existed.
const RENAMES = [
  ["oil-perfumes", "Oil Perfumes"],
  ["watches", "Wristwatches"],
  ["handbags", "Hand Bags"],
];

// Dropdown membership. Everything listed here also gets a homepage tile.
const COLLECTIONS_MENU = [
  "arabian-perfumes",
  "body-mist",
  "designer-perfumes",
  "gift-sets",
  "home-fragrance",
  "incense",
  "miniatures",
  "oil-perfumes",
  "the-niche-collections",
];

const ACCESSORIES_MENU = [
  "bracelets",
  "handbags",
  "necklaces",
  "shoes",
  "sunglasses",
  "watches",
];

// Jewelry keeps anything that isn't a bracelet or a necklace (the stud
// earrings), and stays reachable through the Accessories umbrella below —
// it just doesn't get a dropdown entry of its own, since the client's list
// replaced it with the two specific types.
const PRODUCT_MOVES = [
  ["Pandora Moments Charm Bracelet", "bracelets"],
  ["Swarovski Pearl Necklace", "necklaces"],
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

let created = 0;
for (const c of NEW_CATEGORIES) {
  const res = await client.query(
    `insert into "Category"
       (id, slug, name, tagline, description, icon, image, "groupSlugs",
        "navGroup", "sortOrder", assignable, "showOnHome", "createdAt", "updatedAt")
     values ($1,$2,$3,$4,$5,$6,null,'{}',$7,$8,true,true, now(), now())
     on conflict (slug) do nothing`,
    [randomUUID(), c.slug, c.name, c.tagline, c.description, c.icon, c.navGroup, c.sortOrder]
  );
  created += res.rowCount;
}

// The "Collections" menu label needs a page of its own, the same way
// Accessories has one: a pure umbrella gathering everything in the menu,
// plus the general Perfumes collection that still holds the bottles
// awaiting a Designer/Arabian assignment.
await client.query(
  `insert into "Category"
     (id, slug, name, tagline, description, icon, image, "groupSlugs",
      "navGroup", "sortOrder", assignable, "showOnHome", "createdAt", "updatedAt")
   values ($1,'collections','Collections','The full HEIDIZ fragrance wardrobe',
           'Every HEIDIZ collection in one place: niche and designer houses, Arabian oud, oil perfumes, body mists, incense, miniatures, gift sets and home fragrance.',
           'perfume', null, $2, null, 0, false, false, now(), now())
   on conflict (slug) do nothing`,
  [randomUUID(), [...COLLECTIONS_MENU, "perfumes"]]
);
await client.query(
  `update "Category" set "groupSlugs" = $1, "updatedAt" = now() where slug = 'collections'`,
  [[...COLLECTIONS_MENU, "perfumes"]]
);

for (const [slug, name] of RENAMES) {
  await client.query(`update "Category" set name = $2, "updatedAt" = now() where slug = $1`, [
    slug,
    name,
  ]);
}

for (const c of NEW_CATEGORIES) {
  await client.query(
    `update "Category" set "sortOrder" = $2, "updatedAt" = now() where slug = $1`,
    [c.slug, c.sortOrder]
  );
}

// Clear every menu assignment first so a re-run can't leave a category on a
// dropdown it's since been taken off.
await client.query(`update "Category" set "navGroup" = null where "navGroup" is not null`);

for (const [group, slugs] of [
  ["collections", COLLECTIONS_MENU],
  ["accessories", ACCESSORIES_MENU],
]) {
  await client.query(
    `update "Category"
        set "navGroup" = $1, "showOnHome" = true, assignable = true, "updatedAt" = now()
      where slug = any($2)`,
    [group, slugs]
  );
}

// Umbrellas and the standalone Beauty & Skincare link are reachable from
// the bar itself, so they stay off the homepage grid.
await client.query(
  `update "Category"
      set "showOnHome" = false, "updatedAt" = now()
    where slug = any($1)`,
  [["collections", "accessories", "perfumes", "beauty-skincare", "makeup", "hair-care", "jewelry"]]
);

// Accessories now gathers the six on its dropdown plus Jewelry, so the
// earrings that don't fit Bracelets or Necklaces stay browsable.
await client.query(
  `update "Category" set "groupSlugs" = $1, "updatedAt" = now() where slug = 'accessories'`,
  [[...ACCESSORIES_MENU, "jewelry"]]
);

let moved = 0;
for (const [productName, slug] of PRODUCT_MOVES) {
  const res = await client.query(
    `update "Product"
        set "categorySlug" = $2, category = (select name from "Category" where slug = $2),
            "updatedAt" = now()
      where name = $1 and "categorySlug" <> $2`,
    [productName, slug]
  );
  moved += res.rowCount;
}

// Any new category still without a tile photo borrows one from its own
// products; the genuinely empty ones fall back to their stock icon.
await client.query(
  `update "Category" c
      set image = p.image, "updatedAt" = now()
     from (
       select distinct on ("categorySlug") "categorySlug", image
         from "Product" where image is not null
        order by "categorySlug", name asc
     ) p
    where c.image is null and c.slug = p."categorySlug"`
);

const { rows } = await client.query(
  `select c."navGroup", c.slug, c.name, c."showOnHome",
          (select count(*)::int from "Product" p where p."categorySlug" = c.slug) as products
     from "Category" c
    order by c."navGroup" nulls last, c.name asc`
);

console.log(`Created ${created} category(ies), refiled ${moved} product(s).\n`);
console.table(rows);

await client.end();
