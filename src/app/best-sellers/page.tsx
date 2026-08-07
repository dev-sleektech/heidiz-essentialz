import type { Metadata } from "next";
import { CollectionHeader } from "@/components/shop/collection-header";
import { Container } from "@/components/ui/container";
import { ProductGrid } from "@/components/shop/product-grid";
import { getBestSellers } from "@/lib/products";

export const metadata: Metadata = {
  title: "Best Sellers | HEIDIZ Essentialz",
  description: "The signature pieces our clients return for again and again.",
};

// Prices/badges are admin-editable now — revalidate periodically so a
// change shows up without waiting for a redeploy (admin saves also trigger
// an immediate on-demand revalidation, see src/app/api/admin/products).
export const revalidate = 60;

export default async function BestSellersPage() {
  const bestSellers = await getBestSellers();
  return (
    <>
      <CollectionHeader
        eyebrow="Best Sellers"
        title="Loved by Our Community"
        description="The signature pieces our clients return for again and again."
        crumbs={[{ label: "Best Sellers" }]}
      />
      <Container className="py-12 md:py-16">
        <ProductGrid products={bestSellers} />
      </Container>
    </>
  );
}
