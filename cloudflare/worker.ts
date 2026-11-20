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
  fetch: handler.fetch,

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
