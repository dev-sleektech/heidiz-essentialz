import { NextResponse } from "next/server";

// Best-effort in-memory rate limiter, no new service/account required —
// same "stay on the existing stack" bias as the chat polling design (see
// ChatConversation model comment in prisma/schema.prisma). Vercel reuses a
// warm function instance across nearby requests, so this catches the
// concrete threat this app is actually exposed to: one client hammering an
// endpoint in a tight loop. It's per-instance, not global — a distributed
// attacker spread across many cold starts can still get around it — so if
// this store outgrows it, swap the body of checkRateLimit for
// @upstash/ratelimit (Redis-backed, works across every instance) without
// touching any call site.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Keeps `buckets` from growing forever on a long-lived warm instance.
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

// Vercel's Node runtime doesn't populate NextRequest.ip — the documented
// way to get the caller's address is the x-forwarded-for header Vercel's
// edge network sets on every request.
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
