"use client";

// Custom next/image loader. Vercel's image optimizer (/_next/image) is
// metered, and once the account's allowance runs out every image it serves
// answers 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED, so the whole storefront
// goes blank. Instead each image host does its own resizing:
// - Cloudinary (admin uploads): resize + modern format via URL transforms.
// - Unsplash (placeholder stock): resize via its query params.
// - Our own /public files: served as-is, they are already web-sized.

type LoaderArgs = { src: string; width: number; quality?: number };

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  if (src.startsWith("https://res.cloudinary.com/")) {
    const q = quality ? `q_${quality}` : "q_auto";
    return src.replace("/upload/", `/upload/f_auto,${q},c_limit,w_${width}/`);
  }

  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    url.searchParams.set("auto", "format");
    return url.toString();
  }

  // Local files: the width param keeps srcset entries distinct (next/image
  // warns otherwise); the static host ignores it.
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}
