import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductActions } from "@/components/shop/product-actions";
import { ProductReviews } from "@/components/shop/product-reviews";
import { ProductSection } from "@/components/home/product-section";
import { Accordion, type AccordionItem } from "@/components/ui/accordion";
import { StarRating } from "@/components/ui/star-rating";
import { getCategory } from "@/lib/placeholder-data";
import { getAllProducts, getProduct, getRelatedProducts } from "@/lib/products";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  return {
    title: `${product.name} | HEIDIZ Essentialz`,
    description: product.description,
  };
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const category = getCategory(product.categorySlug);
  const related = await getRelatedProducts(product);

  const accordionItems: AccordionItem[] = [
    { title: "Description", content: <p>{product.description}</p> },
  ];

  if (product.fragranceNotes) {
    const { top, heart, base } = product.fragranceNotes;
    accordionItems.push({
      title: "Fragrance Notes",
      content: (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-burnt-orange">Top</dt>
            <dd>{top.join(", ")}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-burnt-orange">Heart</dt>
            <dd>{heart.join(", ")}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-burnt-orange">Base</dt>
            <dd>{base.join(", ")}</dd>
          </div>
        </dl>
      ),
    });
  }

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

  return (
    <>
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
            <span className="text-xs uppercase tracking-wide text-charcoal/50">
              {product.category}
            </span>
            <h1 className="font-display text-3xl text-brand-black md:text-4xl">{product.name}</h1>

            <div className="flex items-center gap-2 pt-1">
              <StarRating rating={product.rating} starClassName="h-4 w-4" />
              <span className="text-xs text-charcoal/50">
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-display text-2xl text-burnt-orange">
              {formatNaira(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-base text-charcoal/40 line-through">
                {formatNaira(product.compareAtPrice)}
              </span>
            )}
            {product.badge && (
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-[0.65rem] tracking-wide text-white",
                  product.badge === "Sale" ? "bg-burnt-orange" : "bg-brand-black"
                )}
              >
                {product.badge}
              </span>
            )}
          </div>

          <p className="text-sm leading-relaxed text-charcoal/70">{product.description}</p>

          <span
            className={
              product.inStock
                ? "text-xs font-medium text-burnt-orange"
                : "text-xs font-medium text-charcoal/50"
            }
          >
            {product.inStock ? "In stock, ready to ship from Abuja" : "Currently out of stock"}
          </span>

          <ProductActions
            slug={product.slug}
            inStock={product.inStock}
            sizes={product.sizes}
            colors={product.colors}
          />

          <Accordion items={accordionItems} className="mt-4" />
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
