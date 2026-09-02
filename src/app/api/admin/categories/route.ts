import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { isStaffEmail } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";
import { parseCategoryInput, slugifyCategory } from "@/lib/category-input";
import { CATEGORIES_CACHE_TAG } from "@/lib/categories";

// Creates a category. Editing and removing an existing one is
// PATCH/DELETE /api/admin/categories/[slug].
export async function POST(request: Request) {
  const user = await currentUser();
  if (!isStaffEmail(user?.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ created: false, message: "Not authorized." }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ created: false, message: "Invalid request body." }, { status: 400 });
  }

  const slug = slugifyCategory(String((raw as { slug?: unknown } | null)?.slug ?? ""));
  if (!slug) {
    return NextResponse.json({ created: false, message: "Slug is required." }, { status: 400 });
  }

  const parsed = parseCategoryInput(raw);
  if (!parsed.ok) {
    return NextResponse.json({ created: false, message: parsed.message }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { created: false, message: `A category with slug "${slug}" already exists.` },
      { status: 409 }
    );
  }

  try {
    const created = await prisma.category.create({ data: { slug, ...parsed.value } });

    // Categories appear in the header, footer, homepage grid and sitemap —
    // bust the whole app's cache rather than waiting out the 60s ISR
    // window, same as the product routes do. The tag drops the cross-request category cache; the path drops the
    // rendered pages built from it. Both are needed.
    // "max" = stale-while-revalidate, the shape Next 16 recommends: a
    // shopper mid-visit is served the previous list while the new one
    // builds behind them. /admin reads uncached, so staff never see stale.
    revalidateTag(CATEGORIES_CACHE_TAG, "max");
    revalidatePath("/", "layout");

    return NextResponse.json({ created: true, slug: created.slug });
  } catch (err) {
    console.error("Failed to create category:", err);
    return NextResponse.json({ created: false, message: "Could not create category." }, { status: 500 });
  }
}
