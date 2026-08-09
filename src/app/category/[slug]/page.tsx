import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionHeader } from "@/components/shop/collection-header";
import { Container } from "@/components/ui/container";
import { ProductGrid } from "@/components/shop/product-grid";
import { categories, getCategory, accessoryCategorySlugs, beautyCategorySlugs } from "@/lib/placeholder-data";
import { getProductsByCategory } from "@/lib/products";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://heidiz-essentialz.vercel.app";

const ACCESSORIES = {
  slug: "accessories",
  name: "Accessories",
  tagline: "Watches, handbags, jewelry & sunglasses",
  description:
    "The finishing pieces: timepieces, leather goods, fine jewelry, and eyewear, gathered in one edit.",
  image: undefined as string | undefined,
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
    title: category.name,
    description: category.description,
    alternates: { canonical: `/category/${slug}` },
    openGraph: {
      title: category.name,
      description: category.description,
      url: `/category/${slug}`,
      images: category.image ? [{ url: category.image, alt: category.name }] : undefined,
    },
  };
}

export default async function CategoryPage(props: PageProps<"/category/[slug]">) {
  const { slug } = await props.params;
  const category = slug === "accessories" ? ACCESSORIES : getCategory(slug);

  if (!category) notFound();

  const products = await getProductsByCategory(slug);
  const noteAccessories = slug === "accessories";
  const noteBeauty = slug === "beauty-skincare";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: category.name, item: `${siteUrl}/category/${slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
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
        {noteBeauty && (
          <p className="mt-10 text-center text-xs text-charcoal/40">
            Browsing {beautyCategorySlugs.length} combined collections, including Makeup and Hair
            Care.
          </p>
        )}
      </Container>
    </>
  );
}
