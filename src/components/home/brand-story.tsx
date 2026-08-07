import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ProductVisual } from "@/components/ui/product-visual";

export function BrandStory() {
  return (
    <section className="bg-white">
      <Container className="grid grid-cols-1 items-center gap-12 py-20 md:py-28 lg:grid-cols-2 lg:gap-20">
        <div className="grid grid-cols-2 gap-4">
          <ProductVisual icon="perfume" className="aspect-[3/4] w-full translate-y-6" />
          <ProductVisual icon="jewelry" className="aspect-[3/4] w-full" />
        </div>

        <div className="flex flex-col items-start gap-6">
          <span className="text-xs tracking-luxury uppercase text-burnt-orange">
            Our Story
          </span>
          <h2 className="font-display text-3xl leading-tight text-brand-black md:text-4xl">
            Born in Abuja, Crafted for the World
          </h2>
          <p className="text-base text-charcoal/70">
            HEIDIZ Essentialz began in the heart of FCT-Abuja with a singular
            belief: that African luxury deserves a global stage. Every
            fragrance, formulation, and accessory in our collection is
            chosen with the same rigor as the world&apos;s most storied
            maisons, then reimagined through a distinctly HEIDIZ lens of
            confidence, warmth, and modern elegance.
          </p>
          <p className="text-base text-charcoal/70">
            From our signature Oud collection to fine jewelry and timepieces,
            we curate essentials for those who move through life with
            intention, discovering pieces that feel as personal as they do
            prestigious.
          </p>
          <ButtonLink href="/about" variant="outline" size="md">
            Discover Our Story
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
