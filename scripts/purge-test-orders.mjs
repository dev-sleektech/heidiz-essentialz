// Clears demo/test purchases out of the backend so the order list only
// holds real customer orders. Kept as a reusable tool rather than a dated
// one-off (scripts/migrations/) because test orders accumulate again every
// time payment or checkout is worked on — first run was 2026-09-02, which
// emptied the 8 orders placed while the store was being built.
//
// There is deliberately no admin UI for this: deleting an order is
// irreversible and destroys the record of a sale, so it stays a
// deliberate, off-site action.
//
// Usage:
//   node scripts/purge-test-orders.mjs --all                 # every order
//   node scripts/purge-test-orders.mjs a@b.com c@d.com       # by email
//
// Prints what it would delete and stops there. Add --yes to actually
// delete. OrderItem rows go with their order (onDelete: Cascade).
//
// Abandoned checkouts (the reminder-email cron's table) for the same
// emails go too, unless --keep-carts is passed — leaving them behind means
// the cron can still email someone about a cart whose order no longer
// exists. Carts belonging to emails you aren't purging are never touched.

import pg from "pg";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — expected on CI/Vercel, real env vars are already set
}

const args = process.argv.slice(2);
const all = args.includes("--all");
const confirmed = args.includes("--yes");
const keepCarts = args.includes("--keep-carts");
const emails = args.filter((a) => !a.startsWith("--"));

if (!all && emails.length === 0) {
  console.error("Nothing selected. Pass --all, or one or more customer emails.");
  process.exit(1);
}

const naira = (kobo) => "NGN " + kobo.toLocaleString("en-NG");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const where = all ? "true" : `lower(email) = any($1::text[])`;
  const params = all ? [] : [emails.map((e) => e.toLowerCase())];

  const { rows: doomed } = await client.query(
    `select "orderNumber", "customerName", email, status, total,
            to_char("createdAt", 'YYYY-MM-DD') as created
       from "Order" where ${where} order by "createdAt"`,
    params,
  );

  if (doomed.length === 0) {
    console.log("No matching orders — nothing to delete.");
    process.exit(0);
  }

  console.log(`${doomed.length} order(s) matched:`);
  for (const o of doomed) {
    console.log(`  ${o.created}  ${o.orderNumber}  ${o.customerName} <${o.email}>  ${naira(o.total)}  ${o.status}`);
  }

  // Only carts belonging to an email we're actually purging.
  const cartWhere = all ? "true" : `lower(email) = any($1::text[])`;
  const { rows: carts } = keepCarts
    ? [[], { rows: [] }][1]
    : await client.query(`select email, subtotal from "AbandonedCheckout" where ${cartWhere}`, params);
  if (!keepCarts) {
    console.log(`${carts.length} abandoned checkout(s) matched.`);
  }

  if (!confirmed) {
    console.log("\nDry run. Re-run with --yes to delete.");
    process.exit(0);
  }

  await client.query("begin");
  const del = await client.query(`delete from "Order" where ${where}`, params);
  const delCarts = keepCarts
    ? { rowCount: 0 }
    : await client.query(`delete from "AbandonedCheckout" where ${cartWhere}`, params);
  await client.query("commit");

  const { rows: left } = await client.query(`select count(*)::int as orders from "Order"`);
  const { rows: leftCarts } = await client.query(`select count(*)::int as carts from "AbandonedCheckout"`);
  console.log(`\nDeleted ${del.rowCount} order(s) and ${delCarts.rowCount} abandoned checkout(s).`);
  console.log(`Remaining: ${left[0].orders} order(s), ${leftCarts[0].carts} abandoned checkout(s).`);
} catch (err) {
  await client.query("rollback").catch(() => {});
  throw err;
} finally {
  await client.end();
}
