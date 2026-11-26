import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Plus, ChevronLeft } from "lucide-react";
import { getAllCategoriesFresh, getProductCountsByCategory } from "@/lib/categories";
import { NAV_GROUP_LABELS } from "@/lib/category-types";
import { DeleteButton } from "@/components/admin/delete-button";

import { requireStaffPage } from "@/lib/require-staff-page";
export const metadata: Metadata = { title: "Categories | HEIDIZ Admin" };

export default async function AdminCategoriesPage() {
  await requireStaffPage(); // must be first: the layout's check can be skipped (see lib/require-staff-page.ts)
  const [categories, counts] = await Promise.all([
    getAllCategoriesFresh(),
    getProductCountsByCategory(),
  ]);

  return (
    <div className="p-8 md:p-10">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-charcoal/80 hover:text-burnt-orange"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        Back to Products
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-brand-black">Categories ({categories.length})</h1>
          <p className="mt-1 text-sm text-charcoal/80">
            The collections shoppers browse by. Each one has its own /category page and appears in
            the header, footer and homepage grid.
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-button bg-burnt-orange px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          New Category
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[4px] border border-brand-black/10 bg-white">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-brand-black/10 text-left text-xs uppercase tracking-wide text-charcoal/70">
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">URL</th>
              <th className="px-5 py-3">Products</th>
              <th className="px-5 py-3">Header Menu</th>
              <th className="px-5 py-3">Gathers</th>
              <th className="px-5 py-3">Placement</th>
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const count = counts[category.slug] ?? 0;
              return (
                <tr key={category.slug} className="border-b border-brand-black/5 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {category.image ? (
                        <Image
                          src={category.image}
                          alt={category.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-[4px] object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-[4px] bg-ivory" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-brand-black">{category.name}</span>
                        <span className="text-xs text-charcoal/70">{category.tagline}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-charcoal/70">
                    <Link
                      href={`/category/${category.slug}`}
                      className="hover:text-burnt-orange hover:underline"
                    >
                      /category/{category.slug}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-charcoal/70">
                    {count > 0 ? (
                      <Link
                        href={`/admin/products?category=${category.slug}`}
                        className="hover:text-burnt-orange hover:underline"
                      >
                        {count}
                      </Link>
                    ) : (
                      "0"
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {category.navGroup ? (
                      <span className="rounded-full bg-brand-black/5 px-2.5 py-1 text-xs text-brand-black">
                        {NAV_GROUP_LABELS[category.navGroup]}
                      </span>
                    ) : (
                      <span className="text-xs text-charcoal/70">Not on menu</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-charcoal/80">
                    {category.groupSlugs.length > 0 ? category.groupSlugs.join(", ") : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {category.showOnHome && (
                        <span className="rounded-full bg-champagne/40 px-2.5 py-1 text-xs text-brand-black">
                          Homepage
                        </span>
                      )}
                      {!category.assignable && (
                        <span className="rounded-full bg-ivory px-2.5 py-1 text-xs text-charcoal/80">
                          Grouping only
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-charcoal/70">{category.sortOrder}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/admin/categories/${category.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm text-burnt-orange hover:underline"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Edit
                      </Link>
                      <DeleteButton
                        endpoint={`/api/admin/categories/${category.slug}`}
                        confirmLabel={`Delete ${category.name}?`}
                        compact
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {categories.length === 0 && (
          <p className="py-10 text-center text-sm text-charcoal/70">
            No categories yet. Create one to start filing products.
          </p>
        )}
      </div>
    </div>
  );
}
