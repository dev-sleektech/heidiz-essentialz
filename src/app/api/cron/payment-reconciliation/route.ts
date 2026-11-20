import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPaymentMismatchAlertEmail } from "@/lib/email";

// Daily check that every successful Paystack charge became an order.
//
// Added 2026-09-03, after a bug rejected every card payment for eight days
// *after* the customer had been charged (fixed in dab48c6). No order was
// ever written, and nobody noticed until a customer complained. The webhook
// now recovers a lost order on its own, but a recovery path nobody watches
// is how you get another silent eight days — so this is the watch.
//
// Deliberately independent of the app's own payment code: it asks Paystack
// what it collected and asks the database what it recorded, then compares.
// A bug in the verify or create routes cannot hide from it, because it
// shares no logic with them.
//
// Triggered by a Cloudflare Cron Trigger (cloudflare/worker.ts), which sends
// `Authorization: Bearer ${CRON_SECRET}` once that env var is set.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || key.includes("replace_me")) {
    return NextResponse.json({ checked: false, message: "Paystack secret key is not configured." });
  }

  // Two days, not one: a charge just before midnight would otherwise fall
  // between runs, and re-reporting yesterday's costs nothing.
  const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const sinceLabel = since.toISOString().slice(0, 10);

  let charges: { reference: string; amount: number; requested_amount?: number }[] = [];
  try {
    const res = await fetch(
      `https://api.paystack.co/transaction?status=success&perPage=100&from=${sinceLabel}`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) {
      return NextResponse.json({ checked: false, message: `Paystack responded with ${res.status}.` });
    }
    charges = (await res.json())?.data ?? [];
  } catch {
    return NextResponse.json({ checked: false, message: "Could not reach Paystack." });
  }

  if (charges.length === 0) {
    return NextResponse.json({ checked: true, orphans: 0, message: "No successful charges in the window." });
  }

  const references = charges.map((c) => c.reference);
  const orders = await prisma.order.findMany({
    where: { OR: [{ orderNumber: { in: references } }, { paymentReference: { in: references } }] },
    select: { orderNumber: true, paymentReference: true },
  });

  const recorded = new Set<string>();
  for (const o of orders) {
    recorded.add(o.orderNumber);
    if (o.paymentReference) recorded.add(o.paymentReference);
  }

  const orphans = charges.filter((c) => !recorded.has(c.reference));
  if (orphans.length === 0) {
    return NextResponse.json({
      checked: true,
      charges: charges.length,
      orphans: 0,
      message: "Every successful charge has an order.",
    });
  }

  // Report the order amount, not the gross debit: with the fee passed to
  // the customer those differ, and the order value is the meaningful figure.
  const totalNaira = orphans.reduce((sum, c) => sum + (c.requested_amount ?? c.amount) / 100, 0);

  const alert = await sendPaymentMismatchAlertEmail({
    orphanCount: orphans.length,
    totalNaira,
    references: orphans.map((c) => c.reference),
    sinceLabel,
  });

  // Logged as well as emailed: ADMIN_EMAILS or Resend may not be
  // configured, and this must never be the kind of alert that fails quietly.
  console.error("[payment reconciliation] charges with no order", {
    count: orphans.length,
    totalNaira,
    references: orphans.map((c) => c.reference),
    alerted: alert.sent,
  });

  return NextResponse.json({
    checked: true,
    charges: charges.length,
    orphans: orphans.length,
    totalNaira,
    alerted: alert.sent,
    alertMessage: alert.message,
  });
}
