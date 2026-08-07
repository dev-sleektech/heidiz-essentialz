import { Hero } from "@/components/home/hero";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { ProductSection } from "@/components/home/product-section";
import { BrandStory } from "@/components/home/brand-story";
import { Testimonials } from "@/components/home/testimonials";
import { InstagramGallery } from "@/components/home/instagram-gallery";
import { Newsletter } from "@/components/home/newsletter";
import { getBestSellers, getNewArrivals } from "@/lib/products";

export const revalidate = 60;

export default async function Home() {
  const [bestSellers, newArrivals] = await Promise.all([getBestSellers(), getNewArrivals()]);
  return (
    <>
      <Hero />
      <FeaturedCollections />
      <ProductSection
        eyebrow="Best Sellers"
        title="Loved by Our Community"
        subtitle="The signature pieces our clients return for again and again."
        products={bestSellers}
        viewAllHref="/best-sellers"
        tinted
      />
      <ProductSection
        eyebrow="Just In"
        title="New Arrivals"
        subtitle="Fresh from the atelier: the latest additions to the HEIDIZ Essentialz collection."
        products={newArrivals}
        viewAllHref="/new-arrivals"
      />
      <BrandStory />
      <Testimonials />
      <InstagramGallery />
      <Newsletter />
    </>
  );
}
