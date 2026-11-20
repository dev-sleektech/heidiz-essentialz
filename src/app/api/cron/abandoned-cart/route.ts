import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAbandonedCartEmail } from "@/lib/email";

// Triggered by a Cloudflare Cron Trigger (see wrangler.jsonc + cloudflare/worker.ts), which
// sends `Authorization: Bearer ${CRON_SECRET}` on cron-triggered requests
// once that env var is set on the project — verified below so this can't
// be hit by anyone else to spam customers.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3300";
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const pending = await prisma.abandonedCheckout.findMany({
    where: { reminded: false, converted: false, createdAt: { lte: oneHourAgo } },
    take: 50, // one cron tick shouldn't try to send an unbounded batch
  });

  let sent = 0;
  let failed = 0;

  for (const checkout of pending) {
    const items = checkout.items as { slug: string; name: string; price: number; quantity: number }[];
    const restoreParam = items.map((i) => `${i.slug}:${i.quantity}`).join(",");
    const restoreUrl = `${siteUrl}/cart?restore=${encodeURIComponent(restoreParam)}`;

    const result = await sendAbandonedCartEmail(checkout.email, checkout.customerName, items, restoreUrl);
    if (result.sent) {
      await prisma.abandonedCheckout.update({ where: { id: checkout.id }, data: { reminded: true } });
      sent++;
    } else {
      // Leave reminded=false so a transient failure retries next hour
      // rather than silently dropping the reminder forever.
      failed++;
    }
  }

  return NextResponse.json({ checked: pending.length, sent, failed });
}
