import type { Metadata } from "next";
import { CollectionHeader } from "@/components/shop/collection-header";
import { Container } from "@/components/ui/container";
import { ProductGrid } from "@/components/shop/product-grid";
import { getNewArrivals } from "@/lib/products";

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "Fresh from the atelier: the latest additions to the HEIDIZ Essentialz collection.",
};

export const revalidate = 60;

export default async function NewArrivalsPage() {
  const newArrivals = await getNewArrivals();
  return (
    <>
      <CollectionHeader
        eyebrow="Just In"
        title="New Arrivals"
        description="Fresh from the atelier: the latest additions to the HEIDIZ Essentialz collection."
        crumbs={[{ label: "New Arrivals" }]}
      />
      <Container className="py-12 md:py-16">
        <ProductGrid products={newArrivals} />
      </Container>
    </>
  );
}
