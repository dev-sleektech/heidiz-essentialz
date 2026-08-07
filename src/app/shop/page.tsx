import type { Metadata } from "next";
import { CollectionHeader } from "@/components/shop/collection-header";
import { Container } from "@/components/ui/container";
import { ProductGrid } from "@/components/shop/product-grid";
import { getAllProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop All | HEIDIZ Essentialz",
  description: "The full HEIDIZ Essentialz collection: perfumes, beauty, hair care, and fine accessories.",
};

export const revalidate = 60;

export default async function ShopPage() {
  const products = await getAllProducts();
  return (
    <>
      <CollectionHeader
        eyebrow="Shop"
        title="The Full Collection"
        description="Every piece currently in the HEIDIZ Essentialz edit, from signature fragrance to fine accessories."
        crumbs={[{ label: "Shop" }]}
      />
      <Container className="py-12 md:py-16">
        <ProductGrid products={products} />
      </Container>
    </>
  );
}
