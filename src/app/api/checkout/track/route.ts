import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  let body: TrackBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ tracked: false }, { status: 400 });
  }

  if (!body.email || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ tracked: false }, { status: 400 });
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.abandonedCheckout.findFirst({
      where: { email: body.email, converted: false, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      await prisma.abandonedCheckout.update({
        where: { id: existing.id },
        data: {
          customerName: body.customerName,
          items: body.items,
          subtotal: body.subtotal,
          reminded: false, // cart changed — worth a fresh reminder window
        },
      });
    } else {
      await prisma.abandonedCheckout.create({
        data: {
          email: body.email,
          customerName: body.customerName,
          items: body.items,
          subtotal: body.subtotal,
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
