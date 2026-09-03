import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionHeader } from "@/components/shop/collection-header";
import { Container } from "@/components/ui/container";
import { ProductGrid } from "@/components/shop/product-grid";
import { getAllCategories, getCategory } from "@/lib/categories";
import { getProductsByCategory } from "@/lib/products";
import { jsonLdScript } from "@/lib/json-ld";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://heidiz-essentialz.vercel.app";

export const revalidate = 60;

// Accessories used to be hard-coded here; it's an ordinary Category row now
// (a pure umbrella, see Category.groupSlugs) so it comes out of the DB with
// the rest. dynamicParams stays on by default, so a category added in
// /admin/categories after a build still renders on first request.
export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(
  props: PageProps<"/category/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await getCategory(slug);
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
  const category = await getCategory(slug);

  if (!category) notFound();

  const products = await getProductsByCategory(slug);
  // Umbrella categories say so, rather than leaving a shopper wondering why
  // a "Watches" product turned up under Accessories.
  const groupedCount = category.groupSlugs.length;

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
         
        dangerouslySetInnerHTML={jsonLdScript(breadcrumbJsonLd)}
      />
      <CollectionHeader
        eyebrow="Shop"
        title={category.name}
        description={category.description}
        crumbs={[{ label: category.name }]}
      />
      <Container className="py-12 md:py-16">
        <ProductGrid products={products} />
        {groupedCount > 0 && (
          <p className="mt-10 text-center text-xs text-charcoal/70">
            Browsing {category.assignable ? groupedCount + 1 : groupedCount} combined collections.
            Prefer one at a time? Use the menu above.
          </p>
        )}
      </Container>
    </>
  );
}
