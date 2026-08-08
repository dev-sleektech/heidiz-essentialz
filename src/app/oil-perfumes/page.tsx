import type { Metadata } from "next";
import { CollectionHeader } from "@/components/shop/collection-header";
import { Container } from "@/components/ui/container";
import { ProductGrid } from "@/components/shop/product-grid";
import { getOilPerfumes } from "@/lib/products";

const OIL_PERFUME_SIZES = ["10ml", "20ml", "30ml", "50ml", "100ml"];

export const metadata: Metadata = {
  title: "Oil Perfumes | HEIDIZ Essentialz",
  description: "Alcohol-free oil perfumes and attars from HEIDIZ Essentialz, available in 10ml, 20ml, 30ml, 50ml, and 100ml.",
};

export const revalidate = 60;

export default async function OilPerfumesPage() {
  const products = await getOilPerfumes();

  return (
    <>
      <CollectionHeader
        eyebrow="Shop"
        title="Oil Perfumes"
        description="Concentrated, alcohol-free oil perfumes and attars, long-lasting on skin without the sting of a spray."
        crumbs={[{ label: "Oil Perfumes" }]}
      />
      <Container className="py-12 md:py-16">
        <div className="mb-10 flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-charcoal/50">Available sizes</span>
          <div className="flex flex-wrap gap-2">
            {OIL_PERFUME_SIZES.map((size) => (
              <span
                key={size}
                className="rounded-button border border-brand-black/15 px-3 py-1.5 text-xs text-charcoal/70"
              >
                {size}
              </span>
            ))}
          </div>
        </div>

        <ProductGrid products={products} />

        {products.length > 0 && (
          <p className="mt-10 text-center text-xs text-charcoal/40">
            Pick a size on any product page. Price updates to match, ready to add to cart.
          </p>
        )}
      </Container>
    </>
  );
}
