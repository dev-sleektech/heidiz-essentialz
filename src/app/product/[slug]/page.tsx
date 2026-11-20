import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductActions } from "@/components/shop/product-actions";
import { FragranceNotes } from "@/components/shop/fragrance-notes";
import { ProductReviews } from "@/components/shop/product-reviews";
import { ProductSection } from "@/components/home/product-section";
import { Accordion, type AccordionItem } from "@/components/ui/accordion";
import { StarRating } from "@/components/ui/star-rating";
import { getCategory } from "@/lib/categories";
import { getAllProducts, getProduct, getRelatedProducts } from "@/lib/products";
import { jsonLdScript } from "@/lib/json-ld";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://heidizstores.com";

export const revalidate = 60;

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/product/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) return {};
  const image = product.image ?? product.images[0];
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description,
      url: `/product/${product.slug}`,
      type: "website",
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const [category, related] = await Promise.all([
    getCategory(product.categorySlug),
    getRelatedProducts(product),
  ]);

  // No "Description" panel: it repeated, verbatim, the copy already
  // rendered at full size in the main column. And no "Fragrance Notes"
  // panel — those now lead the page as <FragranceNotes> rather than
  // hiding behind a plus sign. The accordion is for the reference detail
  // a buyer goes looking for, not the reason they buy.
  const accordionItems: AccordionItem[] = [];

  accordionItems.push({
    title: "Benefits",
    content: (
      <ul className="flex flex-col gap-1.5">
        {product.benefits.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="text-burnt-orange">&bull;</span>
            {b}
          </li>
        ))}
      </ul>
    ),
  });

  accordionItems.push({ title: "Directions for Use", content: <p>{product.directions}</p> });

  if (product.ingredients) {
    accordionItems.push({ title: "Ingredients", content: <p>{product.ingredients}</p> });
  }

  const productUrl = `${siteUrl}/product/${product.slug}`;
  const image = product.image ?? product.images[0];
  // Product photos are already absolute (Cloudinary/Unsplash) or a local
  // /public path — only the local ones need the site origin prefixed.
  const absoluteImage = image ? (image.startsWith("http") ? image : `${siteUrl}${image}`) : undefined;

  // Product rich-result schema — price and availability are what let Google
  // show price and stock directly in search results, not the Open Graph tags
  // above (those are for social share previews).
  //
  // Deliberately no aggregateRating: the `rating`/`reviewCount` columns are
  // seeded catalog numbers, not verified purchase reviews, and there is no
  // Review model behind them. Emitting review markup for reviews that don't
  // exist is a structured-data violation Google can penalise manually, and
  // the star snippet it buys is not worth the listing. Add it back with the
  // real aggregate once reviews exist.
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: absoluteImage ? [absoluteImage] : undefined,
    sku: product.slug,
    brand: { "@type": "Brand", name: "HEIDIZ Essentialz" },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "NGN",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      ...(category
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: category.name,
              item: `${siteUrl}/category/${category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: category ? 3 : 2,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
         
        dangerouslySetInnerHTML={jsonLdScript(productJsonLd)}
      />
      <script
        type="application/ld+json"
         
        dangerouslySetInnerHTML={jsonLdScript(breadcrumbJsonLd)}
      />
      <Container className="py-6">
        <Breadcrumbs
          items={[
            ...(category ? [{ label: category.name, href: `/category/${category.slug}` }] : []),
            { label: product.name },
          ]}
        />
      </Container>

      <Container className="grid grid-cols-1 gap-10 pb-16 lg:grid-cols-2 lg:gap-16">
        <ProductGallery
          icon={product.icon}
          src={product.image}
          images={product.images}
          name={product.name}
        />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-charcoal/70">
              {product.category}
            </span>
            <h1 className="font-display text-3xl text-brand-black md:text-4xl">{product.name}</h1>

            <div className="flex items-center gap-2 pt-1">
              <StarRating rating={product.rating} starClassName="h-4 w-4" />
              <span className="text-xs text-charcoal/70">
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-charcoal/70">{product.description}</p>

          <span
            className={
              product.inStock
                ? "text-xs font-medium text-burnt-orange"
                : "text-xs font-medium text-charcoal/70"
            }
          >
            {product.inStock ? "In stock, ready to ship from Abuja" : "Currently out of stock"}
          </span>

          <ProductActions
            slug={product.slug}
            name={product.name}
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            badge={product.badge}
            inStock={product.inStock}
            sizes={product.sizes}
            colors={product.colors}
            sizePricing={product.sizePricing}
          />

          {/* The scent leads, then the reference detail. This is the one
              thing on the page a customer can't get from a photograph. */}
          {product.fragranceNotes && (
            <div className="mt-6">
              <FragranceNotes notes={product.fragranceNotes} />
            </div>
          )}

          {accordionItems.length > 0 && <Accordion items={accordionItems} className="mt-4" />}
        </div>
      </Container>

      <div className="border-t border-brand-black/10 bg-white">
        <Container className="py-16">
          <h2 className="font-display text-2xl text-brand-black md:text-3xl">Customer Reviews</h2>
          <div className="mt-8">
            <ProductReviews product={product} />
          </div>
        </Container>
      </div>

      {related.length > 0 && (
        <ProductSection
          eyebrow="You May Also Like"
          title="Complete the Edit"
          products={related}
          viewAllHref={category ? `/category/${category.slug}` : "/shop"}
        />
      )}
    </>
  );
}
