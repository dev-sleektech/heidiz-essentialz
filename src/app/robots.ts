import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://heidiz-essentialz.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/*",
        "/account",
        "/account/*",
        "/cart",
        "/checkout",
        "/staff",
        "/staff/*",
        "/sign-in",
        "/sign-in/*",
        "/sign-up",
        "/sign-up/*",
        "/api/*",
        "/search",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
