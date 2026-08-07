import type { Metadata } from "next";
import { Sparkles, Heart, Globe } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";
import { ProductVisual } from "@/components/ui/product-visual";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Our Story | HEIDIZ Essentialz",
  description: "How HEIDIZ Essentialz became FCT-Abuja's destination for luxury perfumes, beauty, and accessories.",
};

const VALUES = [
  {
    icon: Sparkles,
    title: "Curated, Not Mass-Produced",
    description:
      "Every fragrance and accessory earns its place in the collection. We'd rather stock fewer pieces we believe in than everything on the market.",
  },
  {
    icon: Heart,
    title: "African Luxury, Global Standard",
    description:
      "We hold every piece to the same rigor as the world's storied maisons, then curate through a distinctly Nigerian lens of warmth and confidence.",
  },
  {
    icon: Globe,
    title: "Rooted in Abuja",
    description:
      "From our store in Mabushi to delivery across the country, we're building a luxury destination that belongs to FCT-Abuja first.",
  },
];

export default function AboutPage() {
  return (
    <>
      <CollectionHeader
        eyebrow="Our Story"
        title="Born in Abuja, Crafted for the World"
        crumbs={[{ label: "Brand Story" }]}
      />

      <Container className="grid grid-cols-1 items-center gap-12 py-12 md:py-16 lg:grid-cols-2 lg:gap-20">
        <div className="grid grid-cols-2 gap-4">
          <ProductVisual icon="perfume" className="aspect-[3/4] w-full translate-y-6" />
          <ProductVisual icon="jewelry" className="aspect-[3/4] w-full" />
        </div>

        <div className="flex flex-col items-start gap-5">
          <p className="text-base text-charcoal/70">
            HEIDIZ Essentialz began in the heart of FCT-Abuja with a singular belief: that
            African luxury deserves a global stage. What started as a single storefront in
            Mabushi Ultra Modern Market has grown into a curated destination for fragrance,
            beauty, and fine accessories, serving clients across Abuja, Lagos, and beyond.
          </p>
          <p className="text-base text-charcoal/70">
            We built our name on a simple standard: every fragrance, formulation, and
            accessory in our collection is chosen with the same rigor as the world&apos;s
            most storied maisons, then reimagined through a distinctly HEIDIZ lens of
            confidence, warmth, and modern elegance.
          </p>
          <p className="text-base text-charcoal/70">
            From our signature Oud collection to fine jewelry and timepieces, we curate
            essentials for those who move through life with intention, discovering pieces
            that feel as personal as they do prestigious.
          </p>
        </div>
      </Container>

      <div className="bg-white">
        <Container className="py-12 md:py-16">
          <h2 className="text-center font-display text-2xl text-brand-black md:text-3xl">
            What We Stand For
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
            {VALUES.map((value) => (
              <div key={value.title} className="flex flex-col items-center gap-3 text-center">
                <value.icon className="h-8 w-8 text-burnt-orange" strokeWidth={1.5} />
                <h3 className="font-display text-lg text-brand-black">{value.title}</h3>
                <p className="text-sm text-charcoal/70">{value.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      <Container className="flex flex-col items-center gap-4 py-16 text-center">
        <h2 className="font-display text-2xl text-brand-black md:text-3xl">
          Visit Us in Mabushi
        </h2>
        <p className="max-w-xl text-sm text-charcoal/70">
          Shop GF-31, Block C, Mabushi Ultra Modern Market, Jahi, FCT-Abuja. Open Monday to
          Saturday, 9am to 6pm.
        </p>
        <ButtonLink href="/contact" variant="outline" size="md" className="mt-2">
          Get in Touch
        </ButtonLink>
      </Container>
    </>
  );
}
