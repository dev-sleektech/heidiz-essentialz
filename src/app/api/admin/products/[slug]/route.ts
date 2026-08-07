import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { isStaffEmail } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";

type UpdateBody = {
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  compareAtPrice: number | null;
  badge: string | null;
  image: string | null;
  description: string;
  benefits: string[];
  directions: string;
  ingredients: string | null;
  fragranceNotes: { top: string[]; heart: string[]; base: string[] } | null;
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
        description: body.description,
        benefits: body.benefits,
        directions: body.directions,
        ingredients: body.ingredients,
        fragranceNotes: body.fragranceNotes ?? undefined,
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

    return NextResponse.json({ updated: true });
  } catch (err) {
    console.error("Failed to update product:", err);
    return NextResponse.json({ updated: false, message: "Could not save changes." }, { status: 500 });
  }
}
