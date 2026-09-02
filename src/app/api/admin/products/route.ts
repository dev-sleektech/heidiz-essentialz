import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { isStaffEmail } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";
import { getCategoryFresh } from "@/lib/categories";

type CreateBody = {
  slug: string;
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

// Creates a new product. Editing existing ones is PATCH
// /api/admin/products/[slug] (src/app/api/admin/products/[slug]/route.ts).
export async function POST(request: Request) {
  const user = await currentUser();
  if (!isStaffEmail(user?.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ created: false, message: "Not authorized." }, { status: 403 });
  }

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ created: false, message: "Invalid request body." }, { status: 400 });
  }

  if (!body.slug || !body.name || !body.categorySlug || typeof body.price !== "number") {
    return NextResponse.json({ created: false, message: "Missing required fields." }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { slug: body.slug } });
  if (existing) {
    return NextResponse.json(
      { created: false, message: `A product with slug "${body.slug}" already exists.` },
      { status: 409 }
    );
  }

  try {
    const created = await prisma.product.create({
      data: {
        slug: body.slug,
        name: body.name,
        category: body.category,
        categorySlug: body.categorySlug,
        price: body.price,
        compareAtPrice: body.compareAtPrice,
        badge: body.badge,
        // Falls back to the category's own stock icon when no product image
        // is set (see ProductVisual) — same convention every seeded product
        // already follows.
        icon: (await getCategoryFresh(body.categorySlug))?.icon ?? "perfume",
        image: body.image,
        images: body.images ?? [],
        description: body.description,
        benefits: body.benefits,
        directions: body.directions,
        ingredients: body.ingredients,
        fragranceNotes: body.fragranceNotes ?? undefined,
        sizes: body.sizes ?? [],
        colors: body.colors ?? [],
        sizePricing: body.sizePricing ?? undefined,
        rating: body.rating,
        reviewCount: body.reviewCount,
        inStock: body.inStock,
      },
    });

    revalidatePath("/", "layout");

    return NextResponse.json({ created: true, slug: created.slug });
  } catch (err) {
    console.error("Failed to create product:", err);
    return NextResponse.json({ created: false, message: "Could not create product." }, { status: 500 });
  }
}
