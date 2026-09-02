// Stand-in content for HEIDIZ Essentialz: stock imagery, testimonials and
// Instagram posts. Everything here is placeholder material waiting on the
// client's own photography, reviews and social feed — nothing in this file
// is real business data.
//
// The real data moved out to Postgres and is read through src/lib:
//   products    -> src/lib/products.ts   (migrated 2026-08-07)
//   categories  -> src/lib/categories.ts (migrated 2026-09-02, managed at
//                  /admin/categories; the seed lives in
//                  scripts/seed-categories.mjs)
//
// The static product array that used to sit here was deleted on 2026-09-02:
// nothing imported it once the seed route went away, and it had drifted into
// contradicting the live catalog. `git log -- src/lib/placeholder-data.ts`
// still has it if that 2026-08-04 snapshot is ever needed.

import type { IconKey } from "@/lib/product-types";

// Freely-licensed Unsplash stock photos standing in for real product/store
// photography, one representative image per category. Every URL is a plain
// images.unsplash.com link (Unsplash's free license, not a paid Unsplash+
// photo) — verified free-to-use for commercial sites without attribution.
// Swap each for the client's own product photography as it comes in; the
// photo id is kept in the comment so a given stock image can be traced back
// and re-licensed/credited if the client ever wants to.
export const stockImages: Record<IconKey, string> = {
  // photo-1615160460367-dcccd27e11ad — perfume bottle
  perfume:
    "https://images.unsplash.com/photo-1615160460367-dcccd27e11ad?auto=format&fit=crop&w=800&q=80",
  // photo-1580870069867-74c57ee1bb07 — skincare bottles
  skincare:
    "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?auto=format&fit=crop&w=800&q=80",
  // photo-1512496015851-a90fb38ba796 — cosmetics close-up
  makeup:
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80",
  // photo-1747858989102-cca0f4dc4a11 — shampoo bottle
  hair: "https://images.unsplash.com/photo-1747858989102-cca0f4dc4a11?auto=format&fit=crop&w=800&q=80",
  // photo-1758071348980-d1eed770f34f — luxury watch face
  watch:
    "https://images.unsplash.com/photo-1758071348980-d1eed770f34f?auto=format&fit=crop&w=800&q=80",
  // photo-1589363358751-ab05797e5629 — leather handbag
  bag: "https://images.unsplash.com/photo-1589363358751-ab05797e5629?auto=format&fit=crop&w=800&q=80",
  // photo-1605100804763-247f67b3557e — diamond ring
  jewelry:
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
  // photo-1511499767150-a48a237f0083 — gold-framed sunglasses
  sunglasses:
    "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
  // photo-1616406432452-07bc5938759d — leather loafers
  shoes:
    "https://images.unsplash.com/photo-1616406432452-07bc5938759d?auto=format&fit=crop&w=800&q=80",
  // photo-1643122966676-29e8597257f7 — amber jar candles
  candle:
    "https://images.unsplash.com/photo-1643122966676-29e8597257f7?auto=format&fit=crop&w=800&q=80",
};

export type Testimonial = {
  name: string;
  location: string;
  quote: string;
  rating: number;
};

export const testimonials: Testimonial[] = [
  {
    name: "Amaka O.",
    location: "Abuja, Nigeria",
    quote:
      "HEIDIZ Essentialz feels like walking into a Parisian boutique, except it's ours. My bottle of Yara is unforgettable.",
    rating: 5,
  },
  {
    name: "Tunde A.",
    location: "Lagos, Nigeria",
    quote:
      "The packaging alone feels like a gift. Fast delivery and the Fossil watch is even better in person.",
    rating: 5,
  },
  {
    name: "Ifeoma N.",
    location: "Port Harcourt, Nigeria",
    quote:
      "Finally a luxury beauty destination that understands African skin and taste. The skincare ritual changed my routine.",
    rating: 5,
  },
];

// Generic per-product review copy, cycled across products on the detail
// page until real customer reviews start coming in.
export const productReviewPool: Testimonial[] = [
  ...testimonials,
  {
    name: "Chiamaka E.",
    location: "Abuja, Nigeria",
    quote: "Exactly as described, and it arrived faster than I expected for Abuja delivery.",
    rating: 5,
  },
  {
    name: "David O.",
    location: "Abuja, Nigeria",
    quote: "Quality feels genuinely premium. Already planning my next order.",
    rating: 4,
  },
];

export const instagramHandle = "@heidizessentialz";

// Placeholder tiles until the real Instagram feed is wired up — the icons
// just need to look varied, so they cycle a fixed spread of stock keys
// rather than following the (now DB-backed, editable) category list.
const INSTAGRAM_PLACEHOLDER_ICONS: IconKey[] = [
  "perfume",
  "skincare",
  "makeup",
  "watch",
  "bag",
  "candle",
];

export const instagramPosts = Array.from({ length: 6 }).map((_, i) => ({
  id: i,
  icon: INSTAGRAM_PLACEHOLDER_ICONS[i % INSTAGRAM_PLACEHOLDER_ICONS.length],
}));
