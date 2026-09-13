import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/format";

// Daily AI sales summary (2026-08-16): a real Claude call, not a mock —
// scoped down from a vague "fully automated AI site" ask via AskUserQuestion
// to specifically this: a plain-language daily digest of the previous day's
// orders emailed to staff. Model choice (Haiku 4.5, not Opus) was also the
// user's explicit call — this is simple structured-data summarization, not
// a task that needs frontier-model capability.

// The store is an FCT-Abuja business; "yesterday" means the West Africa
// Time (UTC+1, no DST) calendar day, not the UTC day the cron job actually
// runs in.
const WAT_OFFSET_MS = 60 * 60 * 1000;

function watDayBounds(daysAgo: number) {
  const nowWat = new Date(Date.now() + WAT_OFFSET_MS);
  const y = nowWat.getUTCFullYear();
  const m = nowWat.getUTCMonth();
  const d = nowWat.getUTCDate() - daysAgo;
  const startWatUtcMs = Date.UTC(y, m, d, 0, 0, 0) - WAT_OFFSET_MS;
  const endWatUtcMs = Date.UTC(y, m, d + 1, 0, 0, 0) - WAT_OFFSET_MS;
  return { start: new Date(startWatUtcMs), end: new Date(endWatUtcMs) };
}

export function isAnthropicConfigured() {
  const key = process.env.ANTHROPIC_API_KEY;
  return Boolean(key && !key.includes("replace_me"));
}

export type DailyStats = {
  dateLabel: string;
  orderCount: number;
  revenue: number;
  cancelledCount: number;
  needsAttentionCount: number;
  bestSeller: { name: string; quantity: number } | null;
  statusBreakdown: Record<string, number>;
};

async function computeDailyStats(): Promise<DailyStats> {
  const { start, end } = watDayBounds(1); // yesterday, WAT calendar day
  const dateLabel = new Date(start.getTime() + WAT_OFFSET_MS).toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: { items: true },
  });

  const statusBreakdown: Record<string, number> = {};
  let revenue = 0;
  let cancelledCount = 0;
  let needsAttentionCount = 0;
  const quantityBySlug = new Map<string, { name: string; quantity: number }>();

  for (const order of orders) {
    statusBreakdown[order.status] = (statusBreakdown[order.status] ?? 0) + 1;
    if (order.status === "CANCELLED") {
      cancelledCount++;
      continue;
    }
    revenue += order.total;
    // Same definition as the admin dashboard home's "needs attention" stat
    // (src/app/admin/page.tsx PENDING_STATUSES) — keep these in sync.
    if (order.status === "PLACED" || order.status === "PAYMENT_CONFIRMED" || order.status === "PROCESSING") {
      needsAttentionCount++;
    }
    for (const item of order.items) {
      const existing = quantityBySlug.get(item.productSlug);
      quantityBySlug.set(item.productSlug, {
        name: item.productName,
        quantity: (existing?.quantity ?? 0) + item.quantity,
      });
    }
  }

  let bestSeller: DailyStats["bestSeller"] = null;
  for (const entry of quantityBySlug.values()) {
    if (!bestSeller || entry.quantity > bestSeller.quantity) bestSeller = entry;
  }

  return {
    dateLabel,
    orderCount: orders.length,
    revenue,
    cancelledCount,
    needsAttentionCount,
    bestSeller,
    statusBreakdown,
  };
}

function buildDigestPrompt(stats: DailyStats): string {
  const statusLines = Object.entries(stats.statusBreakdown)
    .map(([status, count]) => `${status}: ${count}`)
    .join(", ");

  return `Here is yesterday's (${stats.dateLabel}) raw order data for HEIDIZ Essentialz, a luxury beauty e-commerce store in Abuja, Nigeria:

- Total orders: ${stats.orderCount}
- Revenue (excluding cancelled orders): ${formatNaira(stats.revenue)}
- Cancelled orders: ${stats.cancelledCount}
- Orders still awaiting payment/processing (need staff attention): ${stats.needsAttentionCount}
- Status breakdown: ${statusLines || "no orders"}
- Best-selling product by quantity: ${stats.bestSeller ? `${stats.bestSeller.name} (${stats.bestSeller.quantity} units)` : "none"}

Write a short, plain-language daily summary for the store owner, 2-4 sentences. Mention the headline numbers (orders, revenue), call out the best seller if there is one, and flag if there are orders needing attention. If there were zero orders, say so plainly and don't invent activity. No markdown formatting, no headers — just the paragraph, ready to drop into an email.`;
}

export async function generateDailySummary(): Promise<{ text: string; stats: DailyStats } | null> {
  const stats = await computeDailyStats();

  if (!isAnthropicConfigured()) {
    return null;
  }

  // A real Anthropic error (no billing/credits, rate limit, bad key) used
  // to propagate straight out of this function, which turned the cron
  // route's response into an uncaught 500. That went unnoticed for weeks
  // because ANTHROPIC_API_KEY was a placeholder the whole time, so this
  // never actually ran. Caught and logged here instead, the same
  // "degrade to nothing, never crash the route" contract as an unset key.
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 400,
      messages: [{ role: "user", content: buildDigestPrompt(stats) }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return { text: textBlock?.text ?? "", stats };
  } catch (err) {
    console.error("[ai-summary] Claude call failed", err instanceof Error ? err.message : err);
    return null;
  }
}
