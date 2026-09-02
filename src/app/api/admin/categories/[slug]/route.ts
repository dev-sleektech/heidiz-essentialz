import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { isStaffEmail } from "@/lib/staff-auth";
import { prisma } from "@/lib/prisma";
import { parseCategoryInput } from "@/lib/category-input";
import { CATEGORIES_CACHE_TAG } from "@/lib/categories";

async function requireStaff() {
  const user = await currentUser();
  return isStaffEmail(user?.primaryEmailAddress?.emailAddress);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await requireStaff())) {
    return NextResponse.json({ updated: false, message: "Not authorized." }, { status: 403 });
  }

  const { slug } = await params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ updated: false, message: "Invalid request body." }, { status: 400 });
  }

  const parsed = parseCategoryInput(raw);
  if (!parsed.ok) {
    return NextResponse.json({ updated: false, message: parsed.message }, { status: 400 });
  }

  // A category can't fold itself in — the page already includes its own
  // products, and storing it here would double every row.
  const groupSlugs = parsed.value.groupSlugs.filter((s) => s !== slug);

  try {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ updated: false, message: "Category not found." }, { status: 404 });
    }

    await prisma.category.update({ where: { slug }, data: { ...parsed.value, groupSlugs } });

    // Product.category is deliberately left alone on a rename: it's a
    // finer-grained collection label ("Oil Perfumes", "Gift Sets") that
    // lives under the category rather than a copy of the category's name,
    // and /oil-perfumes and /gift-sets query it directly.
    // The tag drops the cross-request category cache; the path drops the
    // rendered pages built from it. Both are needed. "max" = stale-while-revalidate, the shape Next 16 recommends: a
    // shopper mid-visit is served the previous list while the new one
    // builds behind them. /admin reads uncached, so staff never see stale.
    revalidateTag(CATEGORIES_CACHE_TAG, "max");
    revalidatePath("/", "layout");

    return NextResponse.json({ updated: true });
  } catch (err) {
    console.error("Failed to update category:", err);
    return NextResponse.json({ updated: false, message: "Could not save changes." }, { status: 500 });
  }
}

// Removing a category is blocked while products still point at it — those
// products would otherwise be stranded on a 404 category page and lose
// their filter in /admin/products. Staff move or delete the products
// first; the message says how many are in the way.
export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await requireStaff())) {
    return NextResponse.json({ deleted: false, message: "Not authorized." }, { status: 403 });
  }

  const { slug } = await params;

  try {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ deleted: false, message: "Category not found." }, { status: 404 });
    }

    const productCount = await prisma.product.count({ where: { categorySlug: slug } });
    if (productCount > 0) {
      return NextResponse.json(
        {
          deleted: false,
          message: `${productCount} product${productCount === 1 ? " is" : "s are"} still in "${existing.name}". Move or delete ${productCount === 1 ? "it" : "them"} first.`,
        },
        { status: 409 }
      );
    }

    // Also unhook it from any umbrella that folds it in, so no category
    // page is left pointing at a slug that no longer exists.
    const umbrellas = await prisma.category.findMany({
      where: { groupSlugs: { has: slug } },
      select: { slug: true, groupSlugs: true },
    });

    await prisma.$transaction([
      ...umbrellas.map((u) =>
        prisma.category.update({
          where: { slug: u.slug },
          data: { groupSlugs: u.groupSlugs.filter((g) => g !== slug) },
        })
      ),
      prisma.category.delete({ where: { slug } }),
    ]);

    // The tag drops the cross-request category cache; the path drops the
    // rendered pages built from it. Both are needed. "max" = stale-while-revalidate, the shape Next 16 recommends: a
    // shopper mid-visit is served the previous list while the new one
    // builds behind them. /admin reads uncached, so staff never see stale.
    revalidateTag(CATEGORIES_CACHE_TAG, "max");
    revalidatePath("/", "layout");

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("Failed to delete category:", err);
    return NextResponse.json({ deleted: false, message: "Could not delete category." }, { status: 500 });
  }
}
