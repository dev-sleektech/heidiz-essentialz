// One-off rename (2026-09-03): "Designer Perfumes" becomes "Luxury
// Perfumes", and the collection is taken out of every browsing surface.
//
// Follows move-luxury-perfumes-to-arabian.mjs, which emptied the original
// Luxury Perfumes collection (slug `perfumes`, since renamed to "Perfumes"
// by staff) into Arabian Perfumes. The client is reusing the name here on
// what was the Designer collection.
//
// The rename is in place: the `designer-perfumes` slug stays, so
// /category/designer-perfumes keeps resolving and no existing link, share
// or search result breaks. Only the display name changes.
//
// It is also removed from all three places it was listed:
//   - navGroup    -> null   (out of the Collections dropdown and footer)
//   - showOnHome  -> false  (out of the homepage "Shop by Collection" grid)
//   - groupSlugs  -> dropped from the `collections` and `perfumes` umbrellas
//
// Its products keep their category assignment and stay reachable through
// /shop, search and the direct URL - they are not orphaned, just no longer
// surfaced as their own collection.
//
// Product.category (the display label on cards and product pages) moves
// with the name, the same way it did in the Arabian migration: an admin
// save would rewrite it to the category's name anyway, so leaving it would
// only guarantee drift.
//
// Idempotent: every statement is a no-op once applied.
// Run with `node scripts/migrations/rename-designer-to-luxury-perfumes.mjs`

import pg from "pg";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — expected on CI/Vercel, real env vars are already set
}

const SLUG = "designer-perfumes";
const NEW_NAME = "Luxury Perfumes";
const UMBRELLAS = ["collections", "perfumes"];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const { rows: existing } = await client.query(`select name from "Category" where slug = $1`, [SLUG]);
  if (existing.length === 0) {
    throw new Error(`Category "${SLUG}" not found — nothing to rename.`);
  }

  // Guard against ending up with two categories wearing the same name.
  const { rows: clash } = await client.query(
    `select slug from "Category" where name = $1 and slug <> $2`,
    [NEW_NAME, SLUG]
  );
  if (clash.length > 0) {
    throw new Error(
      `"${NEW_NAME}" is already the name of ${clash.map((c) => c.slug).join(", ")}. ` +
        `Rename or remove that first so the storefront doesn't show two identical collections.`
    );
  }

  await client.query("begin");

  const cat = await client.query(
    `update "Category"
        set name = $1, "navGroup" = null, "showOnHome" = false, "updatedAt" = now()
      where slug = $2
        and (name <> $1 or "navGroup" is not null or "showOnHome" = true)`,
    [NEW_NAME, SLUG]
  );

  const products = await client.query(
    `update "Product" set category = $1, "updatedAt" = now()
      where "categorySlug" = $2 and category <> $1`,
    [NEW_NAME, SLUG]
  );

  const umbrellas = await client.query(
    `update "Category"
        set "groupSlugs" = array_remove("groupSlugs", $1), "updatedAt" = now()
      where slug = any($2::text[]) and $1 = any("groupSlugs")`,
    [SLUG, UMBRELLAS]
  );

  await client.query("commit");

  console.log(`Renamed "${existing[0].name}" to "${NEW_NAME}" (slug ${SLUG} unchanged).`);
  console.log(`  category row updated:      ${cat.rowCount}`);
  console.log(`  product labels updated:    ${products.rowCount}`);
  console.log(`  umbrellas it left:         ${umbrellas.rowCount}`);

  const { rows: after } = await client.query(
    `select slug, name, "navGroup", "showOnHome" from "Category" where slug = $1`,
    [SLUG]
  );
  console.log("\nNow:", after[0]);
  const { rows: still } = await client.query(
    `select slug from "Category" where $1 = any("groupSlugs")`,
    [SLUG]
  );
  console.log(
    still.length === 0
      ? "Listed in no umbrella page."
      : `Still listed in: ${still.map((r) => r.slug).join(", ")}`
  );
} catch (err) {
  await client.query("rollback").catch(() => {});
  throw err;
} finally {
  await client.end();
}
