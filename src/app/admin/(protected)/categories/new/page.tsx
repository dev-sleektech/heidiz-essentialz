import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAllCategoriesFresh } from "@/lib/categories";
import { CategoryEditForm } from "@/components/admin/category-edit-form";

import { requireStaffPage } from "@/lib/require-staff-page";
export const metadata: Metadata = { title: "New Category | HEIDIZ Admin" };

export default async function AdminNewCategoryPage() {
  await requireStaffPage(); // must be first: the layout's check can be skipped (see lib/require-staff-page.ts)
  const siblings = await getAllCategoriesFresh();

  return (
    <div className="p-8 md:p-10">
      <Link
        href="/admin/categories"
        className="inline-flex items-center gap-1 text-sm text-charcoal/80 hover:text-burnt-orange"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        Back to Categories
      </Link>

      <h1 className="mt-4 font-display text-2xl text-brand-black">New Category</h1>

      <div className="mt-8 max-w-3xl rounded-[4px] border border-brand-black/10 bg-white p-6 md:p-8">
        <CategoryEditForm siblings={siblings} />
      </div>
    </div>
  );
}
