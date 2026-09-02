// One-off restructure (2026-09-02) to the nine collections the client
// named, replacing the general-lifestyle set the site launched with:
//
//   Perfume Oils, Designer Perfumes, Arabian Perfumes, Home Fragrances,
//   Body Mist, Gift Sets, Sunglasses, Watches, Jewelry
//
// Three of those (Perfume Oils, Body Mist, Gift Sets) existed only as
// free-text Product.category labels behind hand-written pages, so they
// couldn't be browsed or managed like a real collection — and any admin
// save of one of those products silently relabelled it to its parent's
// name and dropped it off its page. This promotes them to real categories
// and refiles the products whose existing label maps unambiguously.
//
// Nothing is deleted. The five collections the client's list drops
// (Beauty & Skincare, Makeup, Hair Care, Handbags, Shoes) keep all 15 of
// their products and stay editable at /admin/categories — they're just
// taken off the homepage grid, footer and mobile menu (showOnHome=false).
// The same goes for the general Perfumes collection, which stays as the
// umbrella gathering every fragrance sub-collection so the 31 perfumes
// still awaiting a Designer/Arabian assignment are never stranded.
//
// Idempotent: safe to re-run. `node scripts/restructure-categories.mjs`

import { randomUUID } from "node:crypto";
import pg from "pg";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — expected on CI/Vercel, real env vars are already set
}

// The client's nine, in the order they gave them.
const VISIBLE = [
  { slug: "oil-perfumes", name: "Perfume Oils", sortOrder: 10 },
  { slug: "designer-perfumes", name: "Designer Perfumes", sortOrder: 20 },
  { slug: "arabian-perfumes", name: "Arabian Perfumes", sortOrder: 30 },
  { slug: "home-fragrance", name: "Home Fragrances", sortOrder: 40 },
  { slug: "body-mist", name: "Body Mist", sortOrder: 50 },
  { slug: "gift-sets", name: "Gift Sets", sortOrder: 60 },
  { slug: "sunglasses", name: "Sunglasses", sortOrder: 70 },
  { slug: "watches", name: "Watches", sortOrder: 80 },
  { slug: "jewelry", name: "Jewelry", sortOrder: 90 },
];

// Kept, with every product intact, but off the storefront's browse lists.
const HIDDEN = [
  "perfumes",
  "beauty-skincare",
  "makeup",
  "hair-care",
  "handbags",
  "shoes",
  "accessories",
];

// New rows this restructure introduces. Existing slugs are left alone here
// and only renamed/reordered below, so staff edits to copy survive.
const NEW_CATEGORIES = [
  {
    slug: "designer-perfumes",
    name: "Designer Perfumes",
    tagline: "House signatures & niche imports",
    description:
      "Fragrances from the international design houses and niche perfumers, from everyday signatures to collector bottles.",
    icon: "perfume",
    sortOrder: 20,
  },
  {
    slug: "arabian-perfumes",
    name: "Arabian Perfumes",
    tagline: "Oud, amber & attar",
    description:
      "Rich oriental compositions built on oud, amber, saffron and musk, from the Middle Eastern houses that define the style.",
    icon: "perfume",
    sortOrder: 30,
  },
  {
    slug: "body-mist",
    name: "Body Mist",
    tagline: "Light, everyday freshness",
    description:
      "Light body sprays, mists and roll-ons for an easy refresh through the day, made to layer under a fuller fragrance.",
    icon: "perfume",
    sortOrder: 50,
  },
  {
    slug: "gift-sets",
    name: "Gift Sets",
    tagline: "Ready to give",
    description:
      "Curated multi-piece sets, boxed and ready to hand over, for anyone shopping for someone else.",
    icon: "perfume",
    sortOrder: 60,
  },
];

// Products whose existing free-text label maps to exactly one of the new
// collections. Everything else — the 28 general "Luxury Perfumes" and the
// 3 "Oud Collection" bottles — is deliberately left under Perfumes for
// staff to file into Designer or Arabian by hand.
const LABEL_TO_CATEGORY = [
  ["Oil Perfumes", "oil-perfumes"],
  ["Designer Perfumes", "designer-perfumes"],
  ["Body Mist & Roll-Ons", "body-mist"],
  ["Gift Sets", "gift-sets"],
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

let created = 0;
for (const c of NEW_CATEGORIES) {
  const res = await client.query(
    `insert into "Category"
       (id, slug, name, tagline, description, icon, image, "groupSlugs",
        "sortOrder", assignable, "showOnHome", "createdAt", "updatedAt")
     values ($1,$2,$3,$4,$5,$6,null,'{}',$7,true,true, now(), now())
     on conflict (slug) do nothing`,
    [randomUUID(), c.slug, c.name, c.tagline, c.description, c.icon, c.sortOrder]
  );
  created += res.rowCount;
}

// Refile products by their existing label.
let moved = 0;
for (const [label, slug] of LABEL_TO_CATEGORY) {
  const res = await client.query(
    `update "Product"
        set "categorySlug" = $1, "updatedAt" = now()
      where category = $2 and "categorySlug" <> $1`,
    [slug, label]
  );
  moved += res.rowCount;
}

// Name and order the nine, and put them on the storefront.
for (const c of VISIBLE) {
  await client.query(
    `update "Category"
        set name = $2, "sortOrder" = $3, "showOnHome" = true, assignable = true,
            "updatedAt" = now()
      where slug = $1`,
    [c.slug, c.name, c.sortOrder]
  );
}

// Take the rest off the browse lists without touching their products.
// Accessories stays a pure grouping page, so it keeps assignable = false.
await client.query(
  `update "Category"
      set "showOnHome" = false, "updatedAt" = now()
    where slug = any($1)`,
  [HIDDEN]
);

// Perfumes becomes the umbrella over every fragrance sub-collection, so
// /category/perfumes still lists all of them and nothing awaiting a manual
// Designer/Arabian assignment falls out of the storefront.
await client.query(
  `update "Category"
      set "groupSlugs" = $1, "updatedAt" = now()
    where slug = 'perfumes'`,
  [["oil-perfumes", "designer-perfumes", "arabian-perfumes", "body-mist", "gift-sets"]]
);

// Handbags is hidden but its three products stay reachable through the
// Accessories page, so it stays in that umbrella.
await client.query(
  `update "Category"
      set "groupSlugs" = $1, "updatedAt" = now()
    where slug = 'accessories'`,
  [["watches", "handbags", "jewelry", "sunglasses"]]
);

// Give any category still without a tile photo one from its own products.
await client.query(
  `update "Category" c
      set image = p.image, "updatedAt" = now()
     from (
       select distinct on ("categorySlug") "categorySlug", image
         from "Product"
        where image is not null
        order by "categorySlug", name asc
     ) p
    where c.image is null and c.slug = p."categorySlug"`
);

const { rows } = await client.query(
  `select c.slug, c.name, c."sortOrder", c."showOnHome",
          (select count(*)::int from "Product" p where p."categorySlug" = c.slug) as products
     from "Category" c
    order by c."showOnHome" desc, c."sortOrder" asc`
);

console.log(`Created ${created} category(ies), refiled ${moved} product(s).\n`);
console.table(rows);

await client.end();
