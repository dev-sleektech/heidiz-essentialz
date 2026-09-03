// One-off refile (2026-09-02): empties the legacy "Luxury Perfumes"
// collection (slug `perfumes`) into Arabian Perfumes.
//
// restructure-categories.mjs kept `perfumes` as a hidden umbrella so the 31
// perfumes that had no Designer/Arabian assignment yet weren't stranded
// while the client decided where each one belonged. They've now decided:
// all of them go to Arabian Perfumes — the catalog is Lattafa, Afnan,
// Khadlaj, Paris Corner, Fragrance World and Arabiyat, i.e. the Middle
// Eastern houses that collection is for. That includes the three carrying
// the free-text "Oud Collection" label, which was never a real category.
//
// Both columns move: `categorySlug` is what the storefront filters on,
// `category` is the display label on cards and the product page, and an
// admin save would rewrite the label to the category's name anyway.
//
// `perfumes` itself is left in place, still hidden, still the umbrella
// listing every fragrance sub-collection (its groupSlugs) — the fragrance
// finder reads through it. It simply has no products of its own now.
//
// Idempotent: safe to re-run, it only touches rows still on `perfumes`.
// Run with `node scripts/migrations/move-luxury-perfumes-to-arabian.mjs`

import pg from "pg";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — expected on CI/Vercel, real env vars are already set
}

const FROM = "perfumes";
const TO = "arabian-perfumes";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const { rows: target } = await client.query(`select name from "Category" where slug = $1`, [TO]);
  if (target.length === 0) {
    throw new Error(`Category "${TO}" is missing — run seed-categories.mjs first.`);
  }
  const targetName = target[0].name;

  const { rows: moved } = await client.query(
    `update "Product"
        set "categorySlug" = $1, category = $2, "updatedAt" = now()
      where "categorySlug" = $3
      returning slug, name`,
    [TO, targetName, FROM],
  );

  if (moved.length === 0) {
    console.log(`Nothing to move — no products left on "${FROM}".`);
  } else {
    console.log(`Moved ${moved.length} product(s) from "${FROM}" to "${TO}" (${targetName}):`);
    for (const p of moved) console.log(`  - ${p.name} (${p.slug})`);
  }

  const { rows: counts } = await client.query(
    `select "categorySlug", count(*)::int as count
       from "Product"
      where "categorySlug" = any($1::text[])
      group by 1`,
    [[FROM, TO]],
  );
  console.log("\nNow holding:");
  for (const slug of [FROM, TO]) {
    console.log(`  ${slug}: ${counts.find((c) => c.categorySlug === slug)?.count ?? 0}`);
  }
} finally {
  await client.end();
}
