import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ProductVisual } from "@/components/ui/product-visual";
import { ButtonLink } from "@/components/ui/button";
import { blogPosts, getBlogPost } from "@/lib/blog-data";
import { jsonLdScript } from "@/lib/json-ld";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://heidiz-essentialz.vercel.app";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = getBlogPost(slug);

  if (!post) notFound();

  const postUrl = `${siteUrl}/blog/${post.slug}`;

  // BlogPosting rich-result eligibility. Deliberately no `image`: these
  // posts illustrate with the same stock IconKey artwork used for
  // products without real photography (see ProductVisual below), not an
  // actual photo, and claiming one here would be the same kind of
  // structured-data overstatement the product page's Offer schema already
  // avoids for reviews. dateModified is omitted too, for the same reason
  // the sitemap doesn't fake it: publishedAt is the one true timestamp
  // this content has until it's actually revised.
  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: "HEIDIZ Essentialz" },
    publisher: {
      "@type": "Organization",
      name: "HEIDIZ Essentialz",
      logo: { "@type": "ImageObject", url: `${siteUrl}/brand/logo-mark.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Beauty Journal", item: `${siteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
    ],
  };

  return (
    <Container className="py-10 md:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(blogPostingJsonLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumbJsonLd)} />
      <Breadcrumbs items={[{ label: "Beauty Journal", href: "/blog" }, { label: post.title }]} />

      <div className="mx-auto mt-6 max-w-2xl">
        <span className="text-xs uppercase tracking-wide text-burnt-orange">
          {post.category} &middot; {post.readTime}
        </span>
        <h1 className="mt-2 font-display text-3xl text-brand-black md:text-4xl">{post.title}</h1>
      </div>

      <ProductVisual icon={post.icon} className="mx-auto mt-8 aspect-[16/9] w-full max-w-3xl" />

      <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-5 text-sm leading-relaxed text-charcoal/70 md:text-base">
        {post.paragraphs.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-4 border-t border-brand-black/10 pt-8 text-center">
        <p className="text-sm text-charcoal/80">Have a question about this topic?</p>
        <ButtonLink href="/blog" variant="outline" size="md">
          Back to Beauty Journal
        </ButtonLink>
      </div>
    </Container>
  );
}
