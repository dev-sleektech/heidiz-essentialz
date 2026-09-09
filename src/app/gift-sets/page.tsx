import type { Metadata } from "next";
import { CollectionHeader } from "@/components/shop/collection-header";
import { Container } from "@/components/ui/container";
import { ProductGrid } from "@/components/shop/product-grid";
import { getGiftSets } from "@/lib/products";

export const metadata: Metadata = {
  title: "Gift Sets",
  description: "Curated gift sets from HEIDIZ Essentialz, ready to give.",
  alternates: { canonical: "/gift-sets" },
};

export const revalidate = 60;

export default async function GiftSetsPage() {
  const giftSets = await getGiftSets();

  return (
    <>
      <CollectionHeader
        eyebrow="Shop"
        title="Gift Sets"
        description="Thoughtfully packaged sets, ready to give exactly as they arrive."
        crumbs={[{ label: "Gift Sets" }]}
      />
      <Container className="py-12 md:py-16">
        <ProductGrid products={giftSets} />
      </Container>
    </>
  );
}
