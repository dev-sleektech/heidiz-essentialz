import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createClient(max: number) {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    // Bounded pool. The default is 10 connections *per process*, and a
    // production build prerenders across several worker processes at once
    // — enough to exhaust Neon's connection limit and fail a build with
    // "Connection terminated unexpectedly" partway through prerendering.
    max,
    // Fail a hung connect fast instead of holding a request open until the
    // platform's own timeout kills it with no useful error.
    connectionTimeoutMillis: 10_000,
    // Neon closes idle connections on its side; letting ours go first avoids
    // handing a dead socket to the next query.
    idleTimeoutMillis: 30_000,
  });
  return new PrismaClient({ adapter });
}

// On Cloudflare Workers a TCP socket belongs to the request that opened it:
// reusing one pooled connection for the next visitor fails with "Cannot
// perform I/O on behalf of a different request". So in the Worker every
// request gets its own client, keyed by that request's ExecutionContext (a
// fresh object per request, so the WeakMap entry is dropped with it).
//
// The request's context is read from the global key OpenNext's Worker
// installs (backed by AsyncLocalStorage, so it is per request) rather than
// via `getCloudflareContext` from "@opennextjs/cloudflare": importing that
// package here made Next's file tracing pull wrangler, miniflare and the
// Prisma CLI into the server bundle, quadrupling the Worker's size.
const isWorkerd = globalThis.navigator?.userAgent === "Cloudflare-Workers";
const CLOUDFLARE_CONTEXT = Symbol.for("__cloudflare-context__");
const perRequest = new WeakMap<object, PrismaClient>();

function workerClient(): PrismaClient {
  const cfContext = (globalThis as Record<symbol, { ctx?: object } | undefined>)[CLOUDFLARE_CONTEXT];
  const ctx = cfContext?.ctx;
  if (!ctx) {
    throw new Error("No Cloudflare request context; prisma used outside a request");
  }
  let client = perRequest.get(ctx);
  if (!client) {
    client = createClient(3);
    perRequest.set(ctx, client);
  }
  return client;
}

// Node (next dev, next build): standard singleton, reused across hot reloads
// in dev so Neon's connection pool isn't exhausted.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
function nodeClient(): PrismaClient {
  globalForPrisma.prisma ??= createClient(5);
  return globalForPrisma.prisma;
}

// Every caller keeps importing `prisma` as before; this forwards each access
// to the right client for the current runtime/request.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = isWorkerd ? workerClient() : nodeClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
