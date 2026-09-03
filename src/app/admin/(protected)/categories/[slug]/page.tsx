import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  getAllCategoriesFresh,
  getCategoryFresh,
  countProductsInCategory,
} from "@/lib/categories";
import { CategoryEditForm } from "@/components/admin/category-edit-form";

export async function generateMetadata(
  props: PageProps<"/admin/categories/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await getCategoryFresh(slug);
  return {
    title: category ? `Edit ${category.name} | HEIDIZ Admin` : "Category Not Found | HEIDIZ Admin",
  };
}

export default async function AdminCategoryEditPage(
  props: PageProps<"/admin/categories/[slug]">
) {
  const { slug } = await props.params;
  const [category, all, productCount] = await Promise.all([
    getCategoryFresh(slug),
    getAllCategoriesFresh(),
    countProductsInCategory(slug),
  ]);

  if (!category) notFound();

  return (
    <div className="p-8 md:p-10">
      <Link
        href="/admin/categories"
        className="inline-flex items-center gap-1 text-sm text-charcoal/80 hover:text-burnt-orange"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        Back to Categories
      </Link>

      <h1 className="mt-4 font-display text-2xl text-brand-black">{category.name}</h1>
      <p className="mt-1 text-sm text-charcoal/70">/category/{category.slug}</p>

      <div className="mt-8 max-w-3xl rounded-[4px] border border-brand-black/10 bg-white p-6 md:p-8">
        <CategoryEditForm
          category={category}
          siblings={all.filter((c) => c.slug !== category.slug)}
          productCount={productCount}
        />
      </div>
    </div>
  );
}
