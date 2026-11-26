import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/rate-limit";
import { EMAIL, LIMITS } from "@/lib/input-limits";

type TrackBody = {
  email: string;
  customerName?: string;
  items: { slug: string; name: string; price: number; quantity: number }[];
  subtotal: number;
};

// Fire-and-forget capture from the checkout form (see checkout/page.tsx),
// called once the customer's email looks valid and there are items in
// cart — this is the earliest point in the funnel where we have both an
// email and cart contents (the cart itself is localStorage-only, no email
// attached, so true pre-checkout "cart abandonment" isn't reachable).
// Upserts by email so repeated edits while filling the form don't create
// duplicate rows — matches/updates any not-yet-converted snapshot from the
// last 24h for the same email instead of piling up new ones.
export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = await checkRateLimit(`checkout-track:${clientIp(request)}`, {
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) return rateLimitResponse(retryAfterSeconds);

  let body: TrackBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ tracked: false }, { status: 400 });
  }

  if (!body.email || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ tracked: false }, { status: 400 });
  }

  // Security: this row later drives a "you left something behind" email to
  // body.email (cron/abandoned-cart). Everything here arrives from the
  // browser, so never store its names or prices: keep only real products
  // (looked up by slug), with their real names and prices, and require a
  // plausible email and sane sizes. Otherwise anyone could make our domain
  // mail arbitrary "products" to any inbox.
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : undefined;
  if (email.length > LIMITS.email || !EMAIL.test(email) || (customerName?.length ?? 0) > LIMITS.name || body.items.length > 50) {
    return NextResponse.json({ tracked: false }, { status: 400 });
  }
  const wanted = body.items
    .filter((i) => i && typeof i.slug === "string" && i.slug.length <= LIMITS.shortText && Number.isInteger(i.quantity) && i.quantity >= 1 && i.quantity <= 99)
    .map((i) => ({ slug: i.slug, quantity: i.quantity }));
  const products = await prisma.product.findMany({
    where: { slug: { in: wanted.map((i) => i.slug) } },
    select: { slug: true, name: true, price: true },
  });
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const items = wanted
    .filter((i) => bySlug.has(i.slug))
    .map((i) => ({ slug: i.slug, name: bySlug.get(i.slug)!.name, price: bySlug.get(i.slug)!.price, quantity: i.quantity }));
  if (items.length === 0) return NextResponse.json({ tracked: false }, { status: 400 });
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.abandonedCheckout.findFirst({
      where: { email, converted: false, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      await prisma.abandonedCheckout.update({
        where: { id: existing.id },
        data: {
          customerName,
          items,
          subtotal,
          reminded: false, // cart changed — worth a fresh reminder window
        },
      });
    } else {
      await prisma.abandonedCheckout.create({
        data: {
          email,
          customerName,
          items,
          subtotal,
        },
      });
    }

    return NextResponse.json({ tracked: true });
  } catch (err) {
    console.error("Failed to track abandoned checkout:", err);
    // Never blocks checkout — same fire-and-forget contract as the order
    // receipt email and WhatsApp handoff.
    return NextResponse.json({ tracked: false });
  }
}
