// Cloudflare entry point. Wraps the Worker that OpenNext generates so the
// same deployment can also run the scheduled jobs that used to live in
// vercel.json. Each cron calls the existing /api/cron/* route with the same
// `Authorization: Bearer ${CRON_SECRET}` header Vercel used to send, so the
// routes themselves are unchanged.
//
// @ts-expect-error: generated at build time by `opennextjs-cloudflare build`
import { default as handler } from "../.open-next/worker.js";

// Durable Object classes the generated Worker relies on must be re-exported
// from the entry module (ISR revalidation queue + tag cache).
// @ts-expect-error: generated at build time
export { DOQueueHandler, DOShardedTagCache } from "../.open-next/worker.js";

/**
 * Exact, shared rate-limit counter: one instance per (route + visitor IP) key, so every
 * Cloudflare machine sees the same count (src/lib/rate-limit.ts). Workers' built-in
 * rate-limit binding counts per machine and let fast bursts through in production
 * (1 of 54 rapid requests limited on 2026-11-26), which this replaces. Counts live in
 * memory: if the instance is evicted while idle the window simply restarts, which is
 * fine for short anti-abuse windows.
 */
export class RateLimiterDO {
  private count = 0;
  private resetAt = 0;

  async fetch(request: Request): Promise<Response> {
    const { limit, windowMs } = (await request.json()) as { limit: number; windowMs: number };
    const now = Date.now();
    if (now >= this.resetAt) {
      this.count = 0;
      this.resetAt = now + windowMs;
    }
    this.count += 1;
    return Response.json({
      allowed: this.count <= limit,
      retryAfterSeconds: Math.max(1, Math.ceil((this.resetAt - now) / 1000)),
    });
  }
}

// Keep in sync with "triggers.crons" in wrangler.jsonc (times are UTC).
const CRON_ROUTES: Record<string, string> = {
  "0 7 * * *": "/api/cron/sales-summary",
  "0 8 * * *": "/api/cron/payment-reconciliation",
  "0 9 * * *": "/api/cron/abandoned-cart",
  "0 10 * * *": "/api/cron/ops-digest",
  "30 10 * * 1": "/api/cron/finance-digest",
  "0 11 * * 3": "/api/cron/content-drafts",
};

type Env = { CRON_SECRET?: string; NEXT_PUBLIC_SITE_URL?: string } & Record<string, unknown>;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // One canonical host: www.heidizstores.com -> heidizstores.com (the
    // address Clerk's production instance, the sitemap and canonical tags use).
    const url = new URL(request.url);
    if (url.hostname === "www.heidizstores.com") {
      url.hostname = "heidizstores.com";
      return Response.redirect(url.toString(), 301);
    }
    return handler.fetch(request, env, ctx);
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const path = CRON_ROUTES[controller.cron];
    if (!path) {
      console.error(`No route mapped for cron "${controller.cron}"`);
      return;
    }
    const origin = env.NEXT_PUBLIC_SITE_URL || "https://heidizstores.com";
    const request = new Request(new URL(path, origin), {
      headers: { authorization: `Bearer ${env.CRON_SECRET ?? ""}` },
    });
    const response: Response = await handler.fetch(request, env, ctx);
    const body = await response.text();
    if (!response.ok) {
      // Throwing marks the cron run as failed in the Cloudflare dashboard.
      throw new Error(`${path} returned ${response.status}: ${body.slice(0, 500)}`);
    }
    console.log(`${path} -> ${response.status}`);
  },
} satisfies ExportedHandler<Env>;
