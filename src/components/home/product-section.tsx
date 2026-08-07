import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductCard } from "@/components/ui/product-card";
import type { Product } from "@/lib/product-types";

export function ProductSection({
  eyebrow,
  title,
  subtitle,
  products,
  viewAllHref,
  tinted = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllHref: string;
  tinted?: boolean;
}) {
  return (
    <section className={tinted ? "bg-white" : undefined}>
      <Container className="py-20 md:py-28">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            subtitle={subtitle}
            align="left"
          />
          <Link
            href={viewAllHref}
            className="hidden shrink-0 items-center gap-1 text-sm text-burnt-orange hover:underline md:inline-flex"
          >
            View All <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>

        <Link
          href={viewAllHref}
          className="mt-10 flex items-center justify-center gap-1 text-sm text-burnt-orange hover:underline md:hidden"
        >
          View All <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
        </Link>
      </Container>
    </section>
  );
}
