import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";
import { ProductVisual } from "@/components/ui/product-visual";
import { blogPosts } from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "Beauty Journal",
  description: "Perfume guides, skincare tips, and beauty advice from HEIDIZ Essentialz.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <>
      <CollectionHeader
        eyebrow="Beauty Journal"
        title="Notes on Fragrance & Beauty"
        description="Guides, tips, and product education from the HEIDIZ Essentialz team."
        crumbs={[{ label: "Beauty Journal" }]}
      />

      <Container className="py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col gap-4">
              <ProductVisual
                icon={post.icon}
                className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wide text-burnt-orange">
                  {post.category} &middot; {post.readTime}
                </span>
                <h2 className="font-display text-xl text-brand-black group-hover:text-burnt-orange">
                  {post.title}
                </h2>
                <p className="text-sm text-charcoal/70">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
