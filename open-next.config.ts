import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

// Storefront pages use ISR (`revalidate = 60`) and the admin clears them with
// revalidatePath/revalidateTag. On Cloudflare that needs three pieces:
//  - R2 stores the rendered pages (incremental cache),
//  - a Durable Object records when a tag/path was revalidated (tag cache),
//  - a Durable Object queue re-renders stale pages in the background.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: doShardedTagCache({ baseShardSize: 4 }),
  queue: doQueue,
});
