import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { blogPosts } from "@/lib/blog-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://heidizstores.com";

// Dynamic — regenerated per request (product catalog and blog posts can
// change), listing every real, publicly-indexable page. Private/functional
// routes (cart, checkout, account, admin, staff, search, auth) are
// deliberately left out here and blocked in robots.ts.
//
// lastModified is only ever set from a real timestamp, a product/category
// row's own `updatedAt`, or a blog post's own `publishedAt`. It used to be
// `new Date()` on every single entry, which is worse than useless: Google
// explicitly discounts a lastModified value once it notices every URL on a
// site reports "just changed" on every crawl, since a signal that's always
// true carries no information. The hand-authored static pages below
// (about, terms, and the rest) have no real edit timestamp behind them at
// all, so they omit the field entirely rather than fake one. An honest
// gap is more useful to Google than a dishonest date.
//
// Selects `{ slug, updatedAt }` directly via Prisma rather than going
// through getAllProducts()/getAllCategories(): the sitemap doesn't need
// the rest of either row, and updatedAt isn't part of the shared
// Product/Category types (kept lean since they're used far more broadly,
// including in client-persisted cart/wishlist state).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ select: { slug: true, updatedAt: true, assignable: true } }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/new-arrivals`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/best-sellers`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/gift-sets`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/oil-perfumes`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/fragrance-finder`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/order-tracking`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/shipping-returns`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/sustainability`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/careers`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/gift-cards`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/blog`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Accessories is a real Category row now (a pure umbrella), so it comes
  // out of the same list rather than being appended by hand.
  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${siteUrl}/category/${cat.slug}`,
    lastModified: cat.updatedAt,
    changeFrequency: "daily" as const,
    priority: cat.assignable ? 0.8 : 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.publishedAt,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/product/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...blogPages, ...productPages];
}
