import type { MetadataRoute } from "next";
import { categories } from "@/lib/placeholder-data";
import { blogPosts } from "@/lib/blog-data";
import { getAllProducts } from "@/lib/products";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://heidiz-essentialz.vercel.app";

// Dynamic — regenerated per request (product catalog and blog posts can
// change), listing every real, publicly-indexable page. Private/functional
// routes (cart, checkout, account, admin, staff, search, auth) are
// deliberately left out here and blocked in robots.ts.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/new-arrivals`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/best-sellers`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/gift-sets`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/oil-perfumes`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/fragrance-finder`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/order-tracking`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/shipping-returns`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/sustainability`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/careers`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/gift-cards`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryPages: MetadataRoute.Sitemap = [
    ...categories.map((cat) => ({
      url: `${siteUrl}/category/${cat.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    { url: `${siteUrl}/category/accessories`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/product/${product.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...blogPages, ...productPages];
}
