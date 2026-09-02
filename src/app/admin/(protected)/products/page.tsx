import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Plus, Tags } from "lucide-react";
import { getAllCategoriesFresh } from "@/lib/categories";
import { getAllProducts } from "@/lib/products";
import { formatNaira } from "@/lib/format";
import { DeleteButton } from "@/components/admin/delete-button";

export const metadata: Metadata = { title: "Products | HEIDIZ Admin" };

export default async function AdminProductsPage(props: PageProps<"/admin/products">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim().toLowerCase() : "";
  const categorySlug = typeof searchParams.category === "string" ? searchParams.category : "";

  const [allProducts, categories] = await Promise.all([getAllProducts(), getAllCategoriesFresh()]);
  const products = allProducts.filter((p) => {
    if (categorySlug && p.categorySlug !== categorySlug) return false;
    if (q && !p.name.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="p-8 md:p-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-brand-black">Products ({products.length})</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-1.5 rounded-button border border-brand-black/15 px-4 py-2.5 text-sm font-medium text-charcoal transition-colors hover:border-burnt-orange hover:text-burnt-orange"
          >
            <Tags className="h-4 w-4" strokeWidth={1.5} />
            Categories
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 rounded-button bg-burnt-orange px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            New Product
          </Link>
        </div>
      </div>

      <form method="GET" className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search product name"
          className="w-full max-w-sm rounded-button border border-brand-black/15 bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-burnt-orange"
        />
        <select
          name="category"
          defaultValue={categorySlug}
          className="rounded-button border border-brand-black/15 bg-white px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-burnt-orange"
        >
          <option value="">All Categories</option>
          {categories
            .filter((c) => c.assignable)
            .map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
        </select>
        <button
          type="submit"
          className="rounded-button bg-burnt-orange px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Filter
        </button>
        {(q || categorySlug) && (
          <Link href="/admin/products" className="text-sm text-charcoal/50 hover:text-burnt-orange">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-6 overflow-x-auto rounded-[4px] border border-brand-black/10 bg-white">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-brand-black/10 text-left text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Compare At</th>
              <th className="px-5 py-3">Badge</th>
              <th className="px-5 py-3">Stock</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.slug} className="border-b border-brand-black/5 last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-[4px] object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-[4px] bg-ivory" />
                    )}
                    <span className="font-medium text-brand-black">{product.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-charcoal/70">{product.category}</td>
                <td className="px-5 py-3 text-charcoal/70">{formatNaira(product.price)}</td>
                <td className="px-5 py-3 text-charcoal/70">
                  {product.compareAtPrice ? formatNaira(product.compareAtPrice) : "—"}
                </td>
                <td className="px-5 py-3 text-charcoal/70">{product.badge ?? "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={
                      product.inStock
                        ? "rounded-full bg-champagne/40 px-2.5 py-1 text-xs text-brand-black"
                        : "rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-700"
                    }
                  >
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      href={`/admin/products/${product.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm text-burnt-orange hover:underline"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Edit
                    </Link>
                    <DeleteButton
                      endpoint={`/api/admin/products/${product.slug}`}
                      confirmLabel={`Delete ${product.name}?`}
                      compact
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="py-10 text-center text-sm text-charcoal/50">No products match this search.</p>
        )}
      </div>
    </div>
  );
}
