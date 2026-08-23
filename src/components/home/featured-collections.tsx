import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductVisual } from "@/components/ui/product-visual";
import { categories } from "@/lib/placeholder-data";

export function FeaturedCollections() {
  return (
    <section className="bg-ivory">
      <Container className="py-20 md:py-28">
        <SectionHeading
          eyebrow="Shop by Collection"
          title="Created for Every Moment"
          subtitle="From signature fragrances to fine accessories, explore the world of HEIDIZ Essentialz."
        />

        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group flex flex-col gap-3"
            >
              <ProductVisual
                icon={cat.icon}
                src={cat.image}
                className="aspect-square w-full transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="flex flex-col items-center text-center">
                <span className="font-display text-lg text-brand-black">{cat.name}</span>
                <span className="text-xs text-charcoal/50">{cat.tagline}</span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
