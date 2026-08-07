import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionHeader } from "@/components/shop/collection-header";
import { Container } from "@/components/ui/container";
import { ProductGrid } from "@/components/shop/product-grid";
import { categories, getCategory, accessoryCategorySlugs } from "@/lib/placeholder-data";
import { getProductsByCategory } from "@/lib/products";

const ACCESSORIES = {
  slug: "accessories",
  name: "Accessories",
  tagline: "Watches, handbags, jewelry & sunglasses",
  description:
    "The finishing pieces: timepieces, leather goods, fine jewelry, and eyewear, gathered in one edit.",
};

export const revalidate = 60;

export function generateStaticParams() {
  return [...categories.map((c) => ({ slug: c.slug })), { slug: "accessories" }];
}

export async function generateMetadata(
  props: PageProps<"/category/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const category = slug === "accessories" ? ACCESSORIES : getCategory(slug);
  if (!category) return {};
  return {
    title: `${category.name} | HEIDIZ Essentialz`,
    description: category.description,
  };
}

export default async function CategoryPage(props: PageProps<"/category/[slug]">) {
  const { slug } = await props.params;
  const category = slug === "accessories" ? ACCESSORIES : getCategory(slug);

  if (!category) notFound();

  const products = await getProductsByCategory(slug);
  const noteAccessories = slug === "accessories";

  return (
    <>
      <CollectionHeader
        eyebrow="Shop"
        title={category.name}
        description={category.description}
        crumbs={[{ label: category.name }]}
      />
      <Container className="py-12 md:py-16">
        <ProductGrid products={products} />
        {noteAccessories && (
          <p className="mt-10 text-center text-xs text-charcoal/40">
            Browsing {accessoryCategorySlugs.length} combined collections. Prefer one at a time?
            Use the Accessories menu above.
          </p>
        )}
      </Container>
    </>
  );
}
