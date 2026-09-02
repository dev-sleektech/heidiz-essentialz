// One-off (2026-09-02): adds the "Combo Deals" collection the client asked
// for beside New Arrivals in the header.
//
// A real category rather than a badge, so staff file bundle products into
// it the same way they do Gift Sets, and it gets its own /category page.
// navGroup stays null: the client wants it as a top-level link next to New
// Arrivals, not inside either dropdown, so the header declares it
// alongside the other page links (see STATIC_LINKS_BEFORE in
// src/components/site/header.tsx).
//
// Idempotent: safe to re-run. `node scripts/add-combo-deals.mjs`

import { randomUUID } from "node:crypto";
import pg from "pg";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — expected on CI/Vercel, real env vars are already set
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const res = await client.query(
  `insert into "Category"
     (id, slug, name, tagline, description, icon, image, "groupSlugs",
      "navGroup", "sortOrder", assignable, "showOnHome", "createdAt", "updatedAt")
   values ($1,'combo-deals','Combo Deals','Bundled, better value',
           'Multi-piece bundles priced below the sum of their parts: pair a signature scent with its body mist, or build a set across houses.',
           'perfume', null, '{}', null, 1, true, false, now(), now())
   on conflict (slug) do nothing`,
  [randomUUID()]
);

const { rows } = await client.query(
  `select slug, name, "navGroup", assignable, "showOnHome",
          (select count(*)::int from "Product" p where p."categorySlug" = 'combo-deals') as products
     from "Category" where slug = 'combo-deals'`
);

console.log(res.rowCount > 0 ? "Created Combo Deals." : "Combo Deals already existed.");
console.table(rows);

await client.end();
