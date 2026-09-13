import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/format";
import { isAnthropicConfigured } from "@/lib/ai-summary";

// Three scheduled roles that extend the daily sales digest in
// src/lib/ai-summary.ts (2026-08-16, the first real Claude integration
// here) into the rest of day-to-day operations: watching for orders and
// stock that need a human, a weekly financial rollup, and draft marketing
// copy. Each one is a single Claude call over real Prisma data, not an
// agentic tool-use loop. None of these tasks need Claude to decide what
// to look at next, the query is already known, so the simpler single-call
// tier is the right one (see the "Which Surface Should I Use?" guidance in
// Anthropic's own API docs). None of them take an autonomous action on
// their own: the ops and finance roles only ever send a digest email, and
// the content role only ever writes a draft for a human to approve.
//
// isAnthropicConfigured (from ai-summary.ts) still gates all of them,
// see the note on ANTHROPIC_API_KEY in .env.example and Vercel.

export { isAnthropicConfigured };

// Same WAT-day math as ai-summary.ts's watDayBounds, duplicated rather than
// imported: that function is private to a file scoped to one daily digest,
// and a shared "date math" module for two call sites would be more
// indirection than the ten lines it replaces.
const WAT_OFFSET_MS = 60 * 60 * 1000;

function watDaysAgo(daysAgo: number): Date {
  const nowWat = new Date(Date.now() + WAT_OFFSET_MS);
  const y = nowWat.getUTCFullYear();
  const m = nowWat.getUTCMonth();
  const d = nowWat.getUTCDate() - daysAgo;
  return new Date(Date.UTC(y, m, d, 0, 0, 0) - WAT_OFFSET_MS);
}

// Returns null on a real API error (no billing/credits, rate limit, bad
// key) rather than letting it propagate: a cron route that crashes with an
// uncaught 500 is worse than one that reports a clean failure, since
// Vercel doesn't retry or alert on a bad cron run by itself. This is
// distinct from isAnthropicConfigured() (no key at all) but ends up
// meaning the same thing to a caller, "nothing to send", so it's worth a
// server log to actually notice and fix.
async function callClaudeText(model: string, maxTokens: number, prompt: string): Promise<string | null> {
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });
    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock?.text ?? "";
  } catch (err) {
    console.error("[ai-agents] Claude call failed", err instanceof Error ? err.message : err);
    return null;
  }
}

// --- Ops digest: what needs a human's attention today ------------------
//
// Two real signals, both from fields that already exist. Nothing here is
// invented. "Stale" orders are PLACED/PAYMENT_CONFIRMED/PROCESSING orders
// old enough that a customer is plausibly waiting on a reply, using
// createdAt (order age) rather than updatedAt, since updatedAt moves on
// any field change and would overstate how recently an order was actually
// worked. "Flagged" out-of-stock products are ones carrying a Best Seller
// or New badge, a lost sale that matters more than an ordinary
// out-of-stock item, which already gets its own one-time alert the moment
// it happens (sendOutOfStockAlertEmail) but nothing recurring if it stays
// unresolved.
const STALE_ORDER_HOURS = 48;

export type OpsDigestData = {
  staleOrders: { orderNumber: string; customerName: string; status: string; ageHours: number }[];
  flaggedOutOfStock: { name: string; slug: string; badge: string }[];
};

async function computeOpsDigestData(): Promise<OpsDigestData> {
  const staleCutoff = new Date(Date.now() - STALE_ORDER_HOURS * 60 * 60 * 1000);

  const [staleOrders, flaggedProducts] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: { in: ["PLACED", "PAYMENT_CONFIRMED", "PROCESSING"] },
        createdAt: { lt: staleCutoff },
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
    prisma.product.findMany({
      where: { inStock: false, badge: { in: ["Best Seller", "New"] } },
      take: 20,
    }),
  ]);

  return {
    staleOrders: staleOrders.map((o) => ({
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      status: o.status,
      ageHours: Math.round((Date.now() - o.createdAt.getTime()) / (60 * 60 * 1000)),
    })),
    flaggedOutOfStock: flaggedProducts.map((p) => ({ name: p.name, slug: p.slug, badge: p.badge ?? "" })),
  };
}

function buildOpsDigestPrompt(data: OpsDigestData): string {
  const staleLines = data.staleOrders.length
    ? data.staleOrders
        .map((o) => `- ${o.orderNumber} (${o.customerName}): ${o.status}, placed ${o.ageHours}h ago`)
        .join("\n")
    : "None.";
  const stockLines = data.flaggedOutOfStock.length
    ? data.flaggedOutOfStock.map((p) => `- ${p.name} (${p.badge}, out of stock)`).join("\n")
    : "None.";

  return `You're writing a short daily operations note for the owner of HEIDIZ Essentialz, a luxury beauty e-commerce store in Abuja, Nigeria.

Orders still unresolved after ${STALE_ORDER_HOURS} hours (placed, payment confirmed, or processing but not yet shipped):
${staleLines}

Best-selling or new-arrival products currently out of stock (likely losing sales):
${stockLines}

Write 2-4 plain-language sentences prioritizing what to do today. If both lists are empty, say plainly that nothing needs attention right now. Don't invent a problem. Don't just restate the lists; say what matters most. No markdown, no headers, just the paragraph, ready to drop into an email.`;
}

export async function generateOpsDigest(): Promise<{ text: string; data: OpsDigestData } | null> {
  const data = await computeOpsDigestData();
  if (!isAnthropicConfigured()) return null;

  // Same model as the daily sales digest: this is the same kind of job
  // (turn structured rows into a short prioritized paragraph), so it gets
  // the same user-approved choice, see src/lib/ai-summary.ts.
  const text = await callClaudeText("claude-haiku-4-5", 400, buildOpsDigestPrompt(data));
  if (text === null) return null;
  return { text, data };
}

// --- Weekly finance digest: this week vs last week, with anomaly flags -
//
// The daily sales digest already covers yesterday in isolation. This adds
// the dimension that digest can't: trend. Percentages are computed here in
// plain arithmetic, not asked of Claude. Claude only writes the narrative
// sentence around numbers that are already correct, exactly like the daily
// digest's own split between computeDailyStats and the prompt.
export type WeeklyFinanceStats = {
  weekLabel: string;
  thisWeek: { revenue: number; orderCount: number; cancelledCount: number };
  lastWeek: { revenue: number; orderCount: number; cancelledCount: number };
  revenueDeltaPct: number | null;
};

async function weekTotals(startDaysAgo: number, endDaysAgo: number) {
  const start = watDaysAgo(startDaysAgo);
  const end = watDaysAgo(endDaysAgo);
  const orders = await prisma.order.findMany({ where: { createdAt: { gte: start, lt: end } } });
  const cancelledCount = orders.filter((o) => o.status === "CANCELLED").length;
  const revenue = orders.filter((o) => o.status !== "CANCELLED").reduce((sum, o) => sum + o.total, 0);
  return { revenue, orderCount: orders.length, cancelledCount };
}

async function computeWeeklyFinanceStats(): Promise<WeeklyFinanceStats> {
  // Both windows are full WAT calendar weeks ending yesterday, so a
  // Monday-morning run compares two complete 7-day periods rather than a
  // partial current week against a full prior one.
  const [thisWeek, lastWeek] = await Promise.all([weekTotals(7, 0), weekTotals(14, 7)]);

  // Same display trick as ai-summary.ts's dateLabel: adding the WAT offset
  // back turns a WAT-midnight UTC instant into a Date whose fields read as
  // the right WAT calendar date under toLocaleDateString.
  const fmt = (daysAgo: number) =>
    new Date(watDaysAgo(daysAgo).getTime() + WAT_OFFSET_MS).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
    });
  const weekLabel = `${fmt(7)} to ${fmt(1)}`; // yesterday, and the 6 days before that

  const revenueDeltaPct =
    lastWeek.revenue > 0 ? Math.round(((thisWeek.revenue - lastWeek.revenue) / lastWeek.revenue) * 100) : null;

  return { weekLabel, thisWeek, lastWeek, revenueDeltaPct };
}

function buildFinanceDigestPrompt(stats: WeeklyFinanceStats): string {
  const deltaLine =
    stats.revenueDeltaPct === null
      ? "No revenue the prior week, so no meaningful comparison."
      : `Revenue is ${stats.revenueDeltaPct >= 0 ? "up" : "down"} ${Math.abs(stats.revenueDeltaPct)}% vs the prior week.`;

  return `Here is HEIDIZ Essentialz's weekly performance for ${stats.weekLabel}, a luxury beauty e-commerce store in Abuja, Nigeria:

This week: ${stats.thisWeek.orderCount} orders, ${formatNaira(stats.thisWeek.revenue)} revenue (cancelled orders excluded), ${stats.thisWeek.cancelledCount} cancelled.
Prior week: ${stats.lastWeek.orderCount} orders, ${formatNaira(stats.lastWeek.revenue)} revenue, ${stats.lastWeek.cancelledCount} cancelled.
${deltaLine}

Write a short plain-language weekly summary for the store owner, 3-5 sentences. Lead with the trend (up, down, or flat), mention the headline numbers, and flag it clearly if cancellations or a revenue drop look like they need a closer look, but only flag what the numbers actually show. Don't speculate about causes you have no data for. No markdown, no headers, just the paragraph, ready to drop into an email.`;
}

export async function generateWeeklyFinanceDigest(): Promise<{ text: string; stats: WeeklyFinanceStats } | null> {
  const stats = await computeWeeklyFinanceStats();
  if (!isAnthropicConfigured()) return null;

  const text = await callClaudeText("claude-haiku-4-5", 500, buildFinanceDigestPrompt(stats));
  if (text === null) return null;
  return { text, stats };
}

// --- Weekly content drafts: real catalog data in, draft copy out -------
//
// A genuinely different task shape from the two digests above: those turn
// a handful of numbers into one summary paragraph, this writes brand-voice
// marketing copy, so it uses Opus 5 rather than Haiku (Anthropic's own
// default model unless a task specifically calls for a cheaper one. A
// structured summary does, creative copy doesn't).
//
// Structured output (Zod + messages.parse) rather than asking for JSON in
// prose and regexing it out: this needs a reliable array of distinct
// drafts, not one free-text block.
const ContentDraftsSchema = z.object({
  drafts: z
    .array(
      z.object({
        type: z.enum(["SOCIAL_POST", "PROMO_EMAIL", "BLOG_IDEA"]),
        title: z.string().describe("A short internal label for this draft, not shown to customers."),
        body: z.string().describe("The actual draft copy, ready for a human to review and adapt."),
      })
    )
    .min(3)
    .max(6),
});

export type GeneratedContentDraft = z.infer<typeof ContentDraftsSchema>["drafts"][number];

async function computeCatalogSnapshot() {
  const [bestSellers, newArrivals, categories] = await Promise.all([
    prisma.product.findMany({ where: { badge: "Best Seller" }, take: 8, select: { name: true, category: true } }),
    prisma.product.findMany({ where: { badge: "New" }, take: 8, select: { name: true, category: true } }),
    prisma.category.findMany({ where: { showOnHome: true }, select: { name: true } }),
  ]);
  return { bestSellers, newArrivals, categories };
}

function buildContentDraftsPrompt(snapshot: Awaited<ReturnType<typeof computeCatalogSnapshot>>): string {
  const list = (items: { name: string; category?: string }[]) =>
    items.length ? items.map((i) => `${i.name}${i.category ? ` (${i.category})` : ""}`).join(", ") : "none currently";

  return `You're the marketing voice of HEIDIZ Essentialz, a luxury beauty and lifestyle e-commerce store in FCT-Abuja, Nigeria, selling perfumes, beauty, and fine accessories. The tone is elegant and confident, never pushy or full of exclamation points.

Real current catalog data to draw from. Use only these products and categories, don't invent products that aren't listed:
Best sellers: ${list(snapshot.bestSellers)}
New arrivals: ${list(snapshot.newArrivals)}
Storefront collections: ${snapshot.categories.map((c) => c.name).join(", ") || "none"}

Write 4 draft pieces of content for staff to review before posting or sending anywhere: at least one SOCIAL_POST (short, for Instagram/Facebook), one PROMO_EMAIL (a short promotional email body, no subject line needed), and one BLOG_IDEA (a title and a one-paragraph outline, not the full post). Ground every draft in the real catalog data above. Don't invent a promotion, discount, or delivery offer that isn't given to you here. If there's too little real data to justify a strong angle, write a lower-key draft rather than fabricating one.`;
}

export async function generateContentDrafts(): Promise<GeneratedContentDraft[] | null> {
  if (!isAnthropicConfigured()) return null;

  const snapshot = await computeCatalogSnapshot();

  // Same "log and return null, never throw" contract as callClaudeText
  // above, used directly here since messages.parse isn't a plain-text call.
  try {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 4000,
      messages: [{ role: "user", content: buildContentDraftsPrompt(snapshot) }],
      output_config: { format: zodOutputFormat(ContentDraftsSchema) },
    });
    return response.parsed_output?.drafts ?? null;
  } catch (err) {
    console.error("[ai-agents] Claude call failed", err instanceof Error ? err.message : err);
    return null;
  }
}
