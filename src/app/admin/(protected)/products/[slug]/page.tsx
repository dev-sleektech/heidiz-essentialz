import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getProduct } from "@/lib/products";
import { getAssignableCategories } from "@/lib/categories";
import { ProductEditForm } from "@/components/admin/product-edit-form";

export async function generateMetadata(
  props: PageProps<"/admin/products/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  return { title: product ? `Edit ${product.name} | HEIDIZ Admin` : "Product Not Found | HEIDIZ Admin" };
}

export default async function AdminProductEditPage(props: PageProps<"/admin/products/[slug]">) {
  const { slug } = await props.params;
  const [product, categories] = await Promise.all([getProduct(slug), getAssignableCategories()]);

  if (!product) notFound();

  return (
    <div className="p-8 md:p-10">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-burnt-orange"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        Back to Products
      </Link>

      <h1 className="mt-4 font-display text-2xl text-brand-black">{product.name}</h1>
      <p className="mt-1 text-sm text-charcoal/50">/product/{product.slug}</p>

      <div className="mt-8 max-w-3xl rounded-[4px] border border-brand-black/10 bg-white p-6 md:p-8">
        <ProductEditForm product={product} categories={categories} />
      </div>
    </div>
  );
}
