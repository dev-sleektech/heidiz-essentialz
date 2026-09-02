import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { isStaffEmail } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { sendOutOfStockAlertEmail } from "@/lib/email";

type UpdateBody = {
  name: string;
  /** Free-text collection label under the category ("Oil Perfumes",
   *  "Gift Sets", "Niche Perfumes") — /oil-perfumes and /gift-sets query
   *  this directly, so it is NOT a copy of the category's name. */
  category: string;
  categorySlug: string;
  price: number;
  compareAtPrice: number | null;
  badge: string | null;
  image: string | null;
  images: string[];
  description: string;
  benefits: string[];
  directions: string;
  ingredients: string | null;
  fragranceNotes: { top: string[]; heart: string[]; base: string[] } | null;
  sizes: string[];
  colors: string[];
  sizePricing: Record<string, number> | null;
  rating: number;
  reviewCount: number;
  inStock: boolean;
};

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await currentUser();
  if (!isStaffEmail(user?.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ updated: false, message: "Not authorized." }, { status: 403 });
  }

  const { slug } = await params;

  let body: UpdateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ updated: false, message: "Invalid request body." }, { status: 400 });
  }

  if (!body.name || !body.categorySlug || typeof body.price !== "number") {
    return NextResponse.json({ updated: false, message: "Missing required fields." }, { status: 400 });
  }

  try {
    // Read the prior stock state first so we can detect a true→false
    // transition below — the update itself doesn't tell us what changed.
    const before = await prisma.product.findUnique({ where: { slug }, select: { inStock: true, name: true } });

    await prisma.product.update({
      where: { slug },
      data: {
        name: body.name,
        category: body.category,
        categorySlug: body.categorySlug,
        price: body.price,
        compareAtPrice: body.compareAtPrice,
        badge: body.badge,
        image: body.image,
        images: body.images ?? [],
        description: body.description,
        benefits: body.benefits,
        directions: body.directions,
        ingredients: body.ingredients,
        fragranceNotes: body.fragranceNotes ?? undefined,
        sizes: body.sizes ?? [],
        colors: body.colors ?? [],
        sizePricing: body.sizePricing ?? Prisma.JsonNull,
        rating: body.rating,
        reviewCount: body.reviewCount,
        inStock: body.inStock,
      },
    });

    // Every catalog-rendering page (home, shop, category, product, cart,
    // checkout via /api/products) reads from the DB — bust the whole app's
    // cache so an admin price/stock edit shows up immediately rather than
    // waiting for the 60s ISR window.
    revalidatePath("/", "layout");

    // Only alert on a real transition (was in stock, now isn't) — not on
    // every save of a product that was already out of stock.
    if (before?.inStock && !body.inStock) {
      sendOutOfStockAlertEmail({ name: body.name, slug }).catch(() => {});
    }

    return NextResponse.json({ updated: true });
  } catch (err) {
    console.error("Failed to update product:", err);
    return NextResponse.json({ updated: false, message: "Could not save changes." }, { status: 500 });
  }
}

// Permanently removes a product. Past orders are unaffected: OrderItem
// stores productSlug/productName/unitPrice as its own copy at checkout
// time (see prisma/schema.prisma), precisely so order history survives a
// catalog change. Anything still holding the slug client-side (a cart or
// wishlist in localStorage) already degrades to "product not found" per
// line rather than breaking, same as it did for a mistyped slug.
export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await currentUser();
  if (!isStaffEmail(user?.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ deleted: false, message: "Not authorized." }, { status: 403 });
  }

  const { slug } = await params;

  try {
    const existing = await prisma.product.findUnique({ where: { slug }, select: { slug: true } });
    if (!existing) {
      return NextResponse.json({ deleted: false, message: "Product not found." }, { status: 404 });
    }

    await prisma.product.delete({ where: { slug } });

    revalidatePath("/", "layout");

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("Failed to delete product:", err);
    return NextResponse.json({ deleted: false, message: "Could not delete product." }, { status: 500 });
  }
}
