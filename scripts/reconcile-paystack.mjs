// Finds payments Paystack accepted that never became an order.
//
// Why this exists: from 2026-08-26 (commit 155f8f7) until the fix in
// dab48c6, the verify route compared the order total against Paystack's
// `amount`, which includes the transaction fee when the account passes it
// to the customer. It never matched, so every card payment was charged and
// then rejected. The order is only written after verification passes, so
// none of them were recorded. The failure message said "please try again",
// which means some customers paid two or three times.
//
// READ ONLY. It queries Paystack and the database and prints a report. It
// creates nothing, refunds nothing and changes nothing.
//
// Your secret key is read from the environment and never printed. Run it on
// a machine that has the live key; it does not need to be shared with
// anyone.
//
//   PAYSTACK_SECRET_KEY=sk_live_xxx node scripts/reconcile-paystack.mjs
//   PAYSTACK_SECRET_KEY=sk_live_xxx node scripts/reconcile-paystack.mjs --from 2026-08-01
//
// DATABASE_URL comes from .env.local as usual. Add --json to get machine
// readable output instead of tables.

import pg from "pg";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — expected on CI, real env vars are already set
}

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const fromIdx = args.indexOf("--from");
// The regression landed on 2026-08-26; default to the day before so a
// boundary case can't hide.
const FROM = fromIdx !== -1 ? args[fromIdx + 1] : "2026-08-25";

const key = process.env.PAYSTACK_SECRET_KEY;
if (!key) {
  console.error("PAYSTACK_SECRET_KEY is not set. Pass the live key in the environment.");
  process.exit(1);
}
if (!asJson) {
  console.log(`Mode: ${key.startsWith("sk_live") ? "LIVE" : "TEST"}   Window: ${FROM} -> today\n`);
}

// --- Paystack: every successful charge in the window, paginated ---
const charges = [];
for (let page = 1; page <= 50; page++) {
  const url = `https://api.paystack.co/transaction?status=success&perPage=100&page=${page}&from=${FROM}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) {
    console.error(`Paystack returned HTTP ${res.status}. Check the key is valid for this account.`);
    process.exit(1);
  }
  const json = await res.json();
  const batch = json.data ?? [];
  charges.push(...batch);
  if (batch.length < 100) break;
}

// --- Database: which references we actually recorded ---
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const { rows: orders } = await client.query(
  `select "orderNumber", "paymentReference", total, email, "customerName", "createdAt" from "Order"`
);
await client.end();

const recorded = new Set();
for (const o of orders) {
  if (o.paymentReference) recorded.add(o.paymentReference);
  if (o.orderNumber) recorded.add(o.orderNumber);
}

const orphans = charges
  .filter((t) => !recorded.has(t.reference))
  .map((t) => ({
    reference: t.reference,
    paidNaira: t.amount / 100,
    orderNaira: (t.requested_amount ?? t.amount) / 100,
    feeNaira: (t.fees ?? 0) / 100,
    email: t.customer?.email ?? "",
    name: [t.customer?.first_name, t.customer?.last_name].filter(Boolean).join(" "),
    paidAt: t.paid_at ?? t.created_at,
  }))
  .sort((a, b) => a.paidAt.localeCompare(b.paidAt));

// Same customer, same order amount, more than once: the "please try again"
// loop. These are the people owed a refund, not just an order.
const byKey = new Map();
for (const o of orphans) {
  const k = `${o.email}|${o.orderNaira}`;
  byKey.set(k, [...(byKey.get(k) ?? []), o]);
}
const duplicates = [...byKey.values()].filter((g) => g.length > 1);

const totalPaid = orphans.reduce((s, o) => s + o.paidNaira, 0);
const overcharged = duplicates.reduce(
  (s, g) => s + g.slice(1).reduce((t, o) => t + o.paidNaira, 0),
  0
);

if (asJson) {
  console.log(JSON.stringify({ orphans, duplicates, totalPaid, overcharged }, null, 2));
} else {
  console.log(`Successful charges since ${FROM} : ${charges.length}`);
  console.log(`Orders in the database           : ${orders.length}`);
  console.log(`PAID BUT NEVER RECORDED          : ${orphans.length}\n`);

  if (orphans.length) {
    console.table(orphans);
    console.log(`\nTotal collected with no order: NGN ${totalPaid.toLocaleString()}`);
  }

  if (duplicates.length) {
    console.log(`\n--- CHARGED MORE THAN ONCE (${duplicates.length} customer/amount pairs) ---`);
    console.log("These people retried after the error and paid again. Refund the extras.\n");
    for (const g of duplicates) {
      console.log(`${g[0].email}  x${g.length}  @ NGN ${g[0].orderNaira.toLocaleString()} each`);
      for (const o of g) console.log(`    ${o.reference}  ${o.paidAt}`);
    }
    console.log(`\nOvercharged (refundable): NGN ${overcharged.toLocaleString()}`);
  }

  if (!orphans.length) console.log("Nothing orphaned. Every successful charge has an order.");
}
