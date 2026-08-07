// Catalog data for HEIDIZ Essentialz: categories, testimonials, Instagram
// posts, and (below) the original static product array — kept only as the
// one-time seed source for the Product table (see
// src/app/api/admin/seed-products) now that the live catalog lives in
// Postgres via src/lib/products.ts. Swap categories/testimonials for real
// client copy as it comes in; see project memory for status.

import type { IconKey, FragranceNotes, Product } from "@/lib/product-types";

export type { IconKey, FragranceNotes, Product };

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

export type Category = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: IconKey;
  /** Real photo (public path) shown on the category tile, if available. */
  image?: string;
};

export const categories: Category[] = [
  {
    slug: "perfumes",
    name: "Luxury Perfumes",
    tagline: "Signature scents & oud",
    description:
      "Fragrances layered from rare oud, warm amber, and bright florals, each bottle designed to be worn like a signature.",
    icon: "perfume",
    image: "/products/perfumes/amouroud-dark-orchid.jpg",
  },
  {
    slug: "beauty-skincare",
    name: "Beauty & Skincare",
    tagline: "Rituals for radiant skin",
    description:
      "Face and body formulations built around proven actives, made for skin that has to handle Abuja heat and harmattan dust in the same week.",
    icon: "skincare",
    image: "/products/skincare/cerave-moisturizing-cream.jpg",
  },
  {
    slug: "makeup",
    name: "Makeup Collection",
    tagline: "Editorial-ready color",
    description:
      "Pigment-rich color cosmetics built for melanin-rich skin tones, from soft everyday looks to full editorial glam.",
    icon: "makeup",
    image: "/products/makeup/fenty-beauty-pro-filtr-foundation.jpg",
  },
  {
    slug: "hair-care",
    name: "Hair Care",
    tagline: "Salon-grade nourishment",
    description:
      "Treatments and stylers formulated for textured hair, delivering salon-level results between appointments.",
    icon: "hair",
    image: "/products/hair-care/mielle-rosemary-mint-oil.jpg",
  },
  {
    slug: "watches",
    name: "Watches",
    tagline: "Timeless precision",
    description:
      "Timepieces that carry their own gravity, built from precision movements and finished by hand.",
    icon: "watch",
    image: "/products/watches/fossil-grant-chronograph.jpg",
  },
  {
    slug: "handbags",
    name: "Handbags",
    tagline: "Crafted to carry",
    description:
      "Full-grain leather silhouettes structured to hold their shape from the boardroom to the airport lounge.",
    icon: "bag",
    image: "/products/handbags/coach-tabby-shoulder-bag.jpg",
  },
  {
    slug: "jewelry",
    name: "Jewelry",
    tagline: "Fine finishing touches",
    description:
      "Fine pieces in gold, silver, and precious stones, made for everyday wear as much as the occasion.",
    icon: "jewelry",
    image: "/products/jewelry/swarovski-stud-earrings.jpg",
  },
  {
    slug: "sunglasses",
    name: "Sunglasses",
    tagline: "Statement optics",
    description:
      "Statement frames with UV-rated lenses, cut for a silhouette that holds up outdoors and on camera.",
    icon: "sunglasses",
    image: "/products/sunglasses/rayban-aviator-classic.jpg",
  },
  {
    slug: "shoes",
    name: "Shoes",
    tagline: "Corporate, sneakers & slippers",
    description:
      "Footwear for every register: boardroom loafers, everyday sneakers, and easy slides, for men and women alike.",
    icon: "shoes",
    image: "/products/shoes/premium-leather-loafers.jpg",
  },
  {
    slug: "home-fragrance",
    name: "Diffusers & Candles",
    tagline: "Scent your space",
    description:
      "Reed diffusers and hand-poured candles that carry the same signature-scent philosophy from the bottle to the home.",
    icon: "candle",
    image: "/products/home-fragrance/heidiz-signature-candle-trio.jpg",
  },
];

// "Accessories" bundles watches, handbags, jewelry, and sunglasses under one
// umbrella for the header's "Accessories" link, since those four each also
// have their own dedicated category page.
export const accessoryCategorySlugs = ["watches", "handbags", "jewelry", "sunglasses"];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

// Real HEIDIZ Essentialz perfume inventory (2026-08-04), sourced from the
// client's own product photos (C:\Users\HP\Downloads\Perfumes\, copied into
// public/products/perfumes/). Prices are current FCT-Abuja/Lagos market
// prices researched from Nigerian retailers (Jumia, fragrances.com.ng,
// lattafang.com, Mkhasa, TOS Nigeria, etc.) as of 2026-08-04; where no exact
// Nigerian listing existed, price was set against the closest comparable
// product (flagged "approx" below) — swap in the client's real cost/margin
// whenever they have it. Fragrance notes are from Fragrantica/brand listings for
// the named release, not lab-verified for this specific bottle.
// Not consumed by any page anymore (products come from the DB via
// src/lib/products.ts) — kept as the original source record for the real
// inventory it documents. Typed without images/sizes/colors since those
// fields didn't exist when this was written and nothing here needs them.
export const products: Omit<Product, "images" | "sizes" | "colors">[] = [
  {
    slug: "amouroud-dark-orchid",
    name: "Amouroud Dark Orchid",
    category: "Niche Perfumes",
    categorySlug: "perfumes",
    price: 199999, // fragrances.com.ng
    badge: "Limited",
    icon: "perfume",
    image: "/products/perfumes/amouroud-dark-orchid.jpg",
    description:
      "A niche unisex eau de parfum built on citrus and black orchid, deepening into sandalwood, patchouli, and incense. A quiet, editorial signature.",
    benefits: ["Niche import, limited allocation", "Long, sandalwood-driven dry-down", "Unisex composition"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Mandarin orange", "Citruses", "Black gardenia", "Sicilian bergamot"],
      heart: ["Jasmine", "Ylang-ylang", "Lotus", "Black orchid"],
      base: ["Sandalwood", "Indonesian patchouli leaf", "Incense", "Vanilla"],
    },
    rating: 4.7,
    reviewCount: 21,
    inStock: true,
  },
  {
    slug: "lattafa-qaaed",
    name: "Lattafa Qaa'ed",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 28000, // approx — exact Lattafa NG listing not found, priced against comparable 100ml Lattafa EDPs
    icon: "perfume",
    image: "/products/perfumes/lattafa-qaaed.jpg",
    description:
      "An oriental eau de parfum layering cinnamon and cardamom over saffron and sandalwood, settling into oud, leather, and amber.",
    benefits: ["100ml eau de parfum", "Oriental woody-spicy profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Cinnamon", "Cardamom", "Bergamot"],
      heart: ["Saffron", "Sandalwood", "Cedar", "Carnation"],
      base: ["Agarwood (oud)", "Leather", "Vanilla", "Amber"],
    },
    rating: 4.6,
    reviewCount: 34,
    inStock: true,
  },
  {
    slug: "lattafa-tamima",
    name: "Lattafa Tamima",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 32000, // approx — Nigerian listings ranged ₦24,000–₦43,000
    icon: "perfume",
    image: "/products/perfumes/lattafa-tamima.jpg",
    description:
      "A fruity eau de parfum built for lightness: strawberry, pineapple, and rhubarb over melon and rose, resting on caramel and sandalwood.",
    benefits: ["100ml eau de parfum", "Fruity, summer-forward profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Strawberry", "Pineapple", "Raspberry", "Black currant", "Rhubarb", "Orange", "Lemon"],
      heart: ["Melon", "Peach", "Violet", "Orange blossom", "Rose"],
      base: ["Caramel", "Vanilla", "Musk", "Sandalwood"],
    },
    rating: 4.5,
    reviewCount: 19,
    inStock: true,
  },
  {
    slug: "lattafa-yara",
    name: "Lattafa Yara",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 30000, // approx — no exact Nigerian listing found, priced against comparable Lattafa 100ml EDPs
    badge: "Best Seller",
    icon: "perfume",
    image: "/products/perfumes/lattafa-yara.jpg",
    description:
      "One of Lattafa's most recognized women's fragrances: orchid and tangerine over a gourmand, tropical-fruit heart, on vanilla, musk, and sandalwood.",
    benefits: ["100ml eau de parfum", "Sweet, powdery gourmand profile", "For women"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Orchid", "Heliotrope", "Tangerine"],
      heart: ["Gourmand accord", "Tropical fruits"],
      base: ["Vanilla", "Musk", "Sandalwood"],
    },
    rating: 4.8,
    reviewCount: 88,
    inStock: true,
  },
  {
    slug: "lattafa-asad-zanzibar",
    name: "Lattafa Asad Zanzibar",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 35000, // approx — no exact Nigerian listing found
    icon: "perfume",
    image: "/products/perfumes/lattafa-asad-zanzibar.jpg",
    description:
      "A fresh, spicy men's eau de parfum from the Asad line: lavender and black pepper over coconut water and iris, closing on vanilla and incense.",
    benefits: ["100ml eau de parfum", "Fresh, coconut-forward profile", "For men"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Lavender", "Black pepper"],
      heart: ["Coconut water", "Iris", "Salt"],
      base: ["Vanilla", "Incense"],
    },
    rating: 4.6,
    reviewCount: 27,
    inStock: true,
  },
  {
    slug: "vs-bombshell-trio",
    name: "Victoria's Secret Bombshell Mini Trio",
    category: "Gift Sets",
    categorySlug: "perfumes",
    price: 55000, // estimate — exact NGN price not confirmed, see product notes
    icon: "perfume",
    image: "/products/perfumes/vs-bombshell-trio.jpg",
    description:
      "A 3-piece Victoria's Secret Bombshell miniature set (3 x 30ml eau de parfum), sealed in its original gift packaging.",
    benefits: ["3 x 30ml eau de parfum", "Sealed, original Victoria's Secret packaging", "Gift-ready"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Passionfruit", "Citruses"],
      heart: ["Vanilla orchid", "Peony"],
      base: ["Pine tree"],
    },
    rating: 4.7,
    reviewCount: 12,
    inStock: true,
  },
  {
    slug: "lattafa-asad-bourbon",
    name: "Lattafa Asad Bourbon",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 38000, // approx — no exact Nigerian listing found
    badge: "New",
    icon: "perfume",
    image: "/products/perfumes/lattafa-asad-bourbon.jpg",
    description:
      "A 2025 oriental-spicy release from the Asad line: lavender and pink pepper over cacao and nutmeg, resting on bourbon vanilla and vetiver.",
    benefits: ["100ml eau de parfum", "Warm, gourmand-spicy profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Lavender", "Mirabelle", "Pink pepper"],
      heart: ["Cacao", "Nutmeg", "Davana"],
      base: ["Bourbon vanilla", "Amber", "Vetiver"],
    },
    rating: 4.6,
    reviewCount: 9,
    inStock: true,
  },
  {
    slug: "khadlaj-oud-noir",
    name: "Khadlaj Oud Noir",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 39699, // Jumia
    icon: "perfume",
    image: "/products/perfumes/khadlaj-oud-noir.jpg",
    description:
      "An oriental woody eau de parfum: raspberry and saffron over rose and incense, deepening into oud, amber, and patchouli.",
    benefits: ["100ml eau de parfum", "Oriental woody profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Raspberry", "Saffron"],
      heart: ["Rose", "Incense", "Cypriol"],
      base: ["Oud", "Amber", "Patchouli"],
    },
    rating: 4.7,
    reviewCount: 31,
    inStock: true,
  },
  {
    slug: "lattafa-khamrah-dukhan",
    name: "Lattafa Khamrah Dukhan",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 43000, // approx — reseller-listed reference, confirm current price
    badge: "New",
    icon: "perfume",
    image: "/products/perfumes/lattafa-khamrah-dukhan.jpg",
    description:
      "A 2025 addition to the Khamrah line, named for smoke: spice and pimento over incense and orange blossom, closing on praline, tobacco, and amber.",
    benefits: ["100ml eau de parfum", "Smoky, gourmand-oriental profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Spices", "Pimento", "Mandarin"],
      heart: ["Incense", "Labdanum", "Orange blossom", "Patchouli"],
      base: ["Praline", "Tobacco", "Amber", "Tonka bean", "Benzoin"],
    },
    rating: 4.8,
    reviewCount: 15,
    inStock: true,
  },
  {
    slug: "afnan-9pm",
    name: "Afnan 9pm",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 68900, // Jumia
    icon: "perfume",
    image: "/products/perfumes/afnan-9pm.jpg",
    description:
      "A best-selling men's oriental vanilla: apple and cinnamon over orange blossom, resting on vanilla, tonka bean, and amber for evening wear.",
    benefits: ["100ml eau de parfum", "Oriental vanilla profile", "For men"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Apple", "Cinnamon", "Wild lavender", "Bergamot"],
      heart: ["Orange blossom", "Lily-of-the-valley"],
      base: ["Vanilla", "Tonka bean", "Amber", "Patchouli"],
    },
    rating: 4.7,
    reviewCount: 76,
    inStock: true,
  },
  {
    slug: "lattafa-oud-mood",
    name: "Lattafa Oud Mood",
    category: "Oud Collection",
    categorySlug: "perfumes",
    price: 30000, // approx — no exact Nigerian listing found
    icon: "perfume",
    image: "/products/perfumes/lattafa-oud-mood.jpg",
    description:
      "An oriental-sweet oud: rose and saffron over agarwood, caramel, and patchouli, settling into resins, incense, and musk.",
    benefits: ["Eau de parfum", "Oud-forward, gourmand profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Rose", "Saffron", "Pimento"],
      heart: ["Agarwood (oud)", "Caramel", "Floral notes", "Patchouli"],
      base: ["Woody notes", "Amber", "Resins", "Incense", "Musk"],
    },
    rating: 4.6,
    reviewCount: 22,
    inStock: true,
  },
  {
    slug: "lattafa-hayaati-women",
    name: "Lattafa Hayaati",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 30000, // lattafang.com
    icon: "perfume",
    image: "/products/perfumes/lattafa-hayaati-women.jpg",
    description:
      "The original 2020 Hayaati: apple and bergamot over cinnamon and woodsy notes, resting on musk and vanilla.",
    benefits: ["100ml eau de parfum", "Warm, woody-fruity profile", "For women"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Apple", "Bergamot"],
      heart: ["Cinnamon", "Woodsy notes"],
      base: ["Musk", "Vanilla"],
    },
    rating: 4.6,
    reviewCount: 41,
    inStock: true,
  },
  {
    slug: "lattafa-badee-al-oud-sublime",
    name: "Lattafa Badee Al Oud Sublime",
    category: "Oud Collection",
    categorySlug: "perfumes",
    price: 45000, // lattafang.com
    icon: "perfume",
    image: "/products/perfumes/lattafa-badee-al-oud-sublime.jpg",
    description:
      "A woody aromatic from the Badee Al Oud line: apple, litchi, and rose over plum and jasmine, resting on moss, vanilla, and patchouli.",
    benefits: ["100ml eau de parfum", "Fruity woody-aromatic profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Apple", "Litchi", "Rose"],
      heart: ["Plum", "Jasmine"],
      base: ["Moss", "Vanilla", "Patchouli"],
    },
    rating: 4.7,
    reviewCount: 29,
    inStock: true,
  },
  {
    slug: "lattafa-ana-abiyedh",
    name: "Lattafa Ana Abiyedh",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 29000, // lattafang.com, 60ml
    icon: "perfume",
    image: "/products/perfumes/lattafa-ana-abiyedh.jpg",
    description:
      "\"I Am White\": bergamot and orange over vanilla and pear, settling into musk and amber. Clean, soft, and easy to wear daily.",
    benefits: ["60ml eau de parfum", "Clean, musky-sweet profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Bergamot", "Orange"],
      heart: ["Vanilla", "Pear"],
      base: ["Musk", "Amber"],
    },
    rating: 4.5,
    reviewCount: 24,
    inStock: true,
  },
  {
    slug: "lattafa-qaed-al-fursan-untamed",
    name: "Lattafa Qaed Al Fursan Untamed",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 27999, // fragrances.com.ng, 90ml
    icon: "perfume",
    image: "/products/perfumes/lattafa-qaed-al-fursan-untamed.jpg",
    description:
      "A 2025 woody spicy release: cinnamon and cardamom over caramel and lavender, closing on amber, cedarwood, and vetiver.",
    benefits: ["90ml eau de parfum", "Woody spicy profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Cinnamon", "Cardamom", "Mandarin", "Nutmeg"],
      heart: ["Caramel", "Lavender", "Clary sage", "Geranium", "Cypress"],
      base: ["Amber", "Cedarwood", "Olibanum", "Labdanum", "Vetiver"],
    },
    rating: 4.7,
    reviewCount: 18,
    inStock: true,
  },
  {
    slug: "fragrance-world-hayaati-beau",
    name: "Fragrance World Hayaati Beau",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 24999, // fragrances.com.ng
    icon: "perfume",
    image: "/products/perfumes/fragrance-world-hayaati-beau.jpg",
    description:
      "A woody aromatic for men: orange and bergamot over coconut and lavender, resting on tonka bean, cedarwood, vetiver, and guaiac wood.",
    benefits: ["100ml eau de parfum", "Woody aromatic profile", "For men"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Orange", "Bergamot"],
      heart: ["Coconut", "Lavender"],
      base: ["Tonka bean", "Cedarwood", "Vetiver", "Guaiac wood"],
    },
    rating: 4.5,
    reviewCount: 13,
    inStock: true,
  },
  {
    slug: "emporio-armani-in-love-with-you",
    name: "Emporio Armani In Love With You",
    category: "Designer Perfumes",
    categorySlug: "perfumes",
    price: 200000, // thescentsstore.com
    badge: "Best Seller",
    icon: "perfume",
    image: "/products/perfumes/emporio-armani-in-love-with-you.jpg",
    description:
      "A floral fruity eau de parfum for women: raspberry and black currant over wormwood, rose, and jasmine, grounded on patchouli.",
    benefits: ["100ml eau de parfum", "Floral fruity profile", "For women", "Authentic designer import"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Raspberry", "Sour cherry", "Black currant"],
      heart: ["Wormwood", "Rose", "Jasmine"],
      base: ["Patchouli"],
    },
    rating: 4.8,
    reviewCount: 40,
    inStock: true,
  },
  {
    slug: "lattafa-teriaq-intense",
    name: "Lattafa Teriaq Intense",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 50000, // reseller-listed reference, confirm current price
    badge: "New",
    icon: "perfume",
    image: "/products/perfumes/lattafa-teriaq-intense.jpg",
    description:
      "A 2024 release by perfumer Quentin Bisch: saffron and bergamot over plum liquor and cinnamon, resting on amber, tonka bean, and benzoin.",
    benefits: ["100ml eau de parfum", "Oriental spicy profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Saffron", "Bergamot"],
      heart: ["Plum liquor", "Cinnamon"],
      base: ["Amber", "Tonka bean", "Benzoin"],
    },
    rating: 4.8,
    reviewCount: 11,
    inStock: true,
  },
  {
    slug: "lattafa-qaed-al-fursan",
    name: "Lattafa Qaed Al Fursan",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 32000, // lattafang.com
    badge: "Best Seller",
    icon: "perfume",
    image: "/products/perfumes/lattafa-qaed-al-fursan.jpg",
    description:
      "The original 2016 Qaed Al Fursan: pineapple and saffron over balsam fir and jasmine, closing on cedar, amber, and oud.",
    benefits: ["100ml eau de parfum", "Oriental woody profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Pineapple", "Saffron"],
      heart: ["Balsam fir", "Jasmine"],
      base: ["Cedar", "Amber", "Agarwood (oud)"],
    },
    rating: 4.8,
    reviewCount: 67,
    inStock: true,
  },
  {
    slug: "rave-now-women",
    name: "Rave Now Women",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 30999, // fragrances.com.ng
    icon: "perfume",
    image: "/products/perfumes/rave-now-women.jpg",
    description:
      "A fruity floral for women: red fruits and orange over marshmallow, jasmine, and lily of the valley, resting on vanilla, musk, and moss.",
    benefits: ["100ml eau de parfum", "Sweet, floral-fruity profile", "For women"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Red fruits", "Orange"],
      heart: ["Marshmallow", "Jasmine", "Lily of the valley"],
      base: ["Vanilla", "Musk", "Moss"],
    },
    rating: 4.5,
    reviewCount: 16,
    inStock: true,
  },
  {
    slug: "lattafa-ramz-black",
    name: "Lattafa Ramz (Black)",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 28000, // Jumia, general Ramz reference
    icon: "perfume",
    image: "/products/perfumes/lattafa-ramz-black.jpg",
    description:
      "A herbaceous, aromatic Ramz edition: pear and lavender over cardamom and sage, resting on vanilla, amber, musk, and patchouli.",
    benefits: ["Eau de parfum", "Fresh, aromatic profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Pear", "Lavender", "Mint", "Bergamot"],
      heart: ["Cardamom", "Sage"],
      base: ["Vanilla", "Amber", "Musk", "Patchouli"],
    },
    rating: 4.4,
    reviewCount: 8,
    inStock: true,
  },
  {
    slug: "fragrance-world-hayaati-belle",
    name: "Fragrance World Hayaati Belle",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 26999, // fragrances.com.ng
    icon: "perfume",
    image: "/products/perfumes/fragrance-world-hayaati-belle.jpg",
    description:
      "A 2024 floral fruity fragrance for women from the Hayaati line, part of Fragrance World's editorial-leaning collection.",
    benefits: ["100ml eau de parfum", "Floral fruity profile", "For women"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    rating: 4.5,
    reviewCount: 10,
    inStock: true,
  },
  {
    slug: "lattafa-qaed-al-fursan-unlimited",
    name: "Lattafa Qaed Al Fursan Unlimited",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 26000, // lattafang.com
    icon: "perfume",
    image: "/products/perfumes/lattafa-qaed-al-fursan-unlimited.jpg",
    description:
      "A 2022 tropical-gourmand Qaed Al Fursan edition: coconut and pineapple over ylang-ylang and jasmine, resting on vanilla, musk, and sandalwood.",
    benefits: ["100ml eau de parfum", "Tropical gourmand profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Coconut", "Pineapple", "Citruses"],
      heart: ["Ylang-ylang", "Frangipani", "Jasmine"],
      base: ["Vanilla", "Musk", "Sandalwood", "Sweet notes"],
    },
    rating: 4.6,
    reviewCount: 33,
    inStock: true,
  },
  {
    slug: "afnan-supremacy-collectors-edition",
    name: "Afnan Supremacy Collector's Edition",
    category: "Designer-Inspired Perfumes",
    categorySlug: "perfumes",
    price: 84550, // TOS Nigeria; other NG retailers ranged ₦80,000–₦90,500
    badge: "New",
    icon: "perfume",
    image: "/products/perfumes/afnan-supremacy-collectors-edition.jpg",
    description:
      "A 2024 chypre fruity from Afnan's Supremacy line, in the speckled Collector's Edition bottle: pineapple and bergamot over orange blossom and amber, closing on oakmoss and ambergris.",
    benefits: ["100ml eau de parfum", "Chypre fruity profile", "For men", "Collector's Edition bottle"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Pineapple", "Bergamot", "White flowers", "Apple"],
      heart: ["Orange blossom", "Birch", "Amber"],
      base: ["Oakmoss", "Musk", "Ambergris"],
    },
    rating: 4.7,
    reviewCount: 14,
    inStock: true,
  },
  {
    slug: "lattafa-ishq-al-shuyukh-gold",
    name: "Lattafa Pride Ishq Al Shuyukh Gold",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 38000, // Muna Cosmetics
    icon: "perfume",
    image: "/products/perfumes/lattafa-ishq-al-shuyukh-gold.jpg",
    description:
      "A woody leathery fragrance from Lattafa Pride: caramel and saffron over suede, leather, and tonka bean, resting on vanilla, amber, and musk.",
    benefits: ["100ml eau de parfum", "Woody leathery profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Caramel", "Saffron"],
      heart: ["Suede", "Leather", "Tonka bean"],
      base: ["Vanilla", "Amber", "Musk"],
    },
    rating: 4.7,
    reviewCount: 20,
    inStock: true,
  },
  {
    slug: "arabiyat-prestige-ramad-oriental",
    name: "Arabiyat Prestige Ramad Oriental",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 37500, // Mkhasa Fragrance Store
    icon: "perfume",
    image: "/products/perfumes/arabiyat-prestige-ramad-oriental.jpg",
    description:
      "A 2025 oriental woody by perfumer Veysel Akyol: cardamom, elemi, and bergamot over patchouli, cumin, and saffron, resting on opoponax, olibanum, and vanilla.",
    benefits: ["100ml eau de parfum", "Oriental woody profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Cardamom", "Elemi", "Pepper", "Lemon", "Bergamot"],
      heart: ["Patchouli", "Cumin", "Saffron", "Geranium", "Jasmine"],
      base: ["Opoponax", "Olibanum", "Vanilla", "Benzoin", "Amber"],
    },
    rating: 4.6,
    reviewCount: 17,
    inStock: true,
  },
  {
    slug: "lattafa-badee-al-oud-honor-glory",
    name: "Lattafa Badee Al Oud Honor & Glory",
    category: "Oud Collection",
    categorySlug: "perfumes",
    price: 45000, // lattafang.com
    icon: "perfume",
    image: "/products/perfumes/lattafa-badee-al-oud-honor-glory.jpg",
    description:
      "A warm, spicy-woody Badee Al Oud edition: pineapple and creme brulee over cinnamon, turmeric, and black pepper, resting on vanilla, sandalwood, and cashmeran.",
    benefits: ["100ml eau de parfum", "Warm spicy-woody profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Pineapple", "Creme brulee"],
      heart: ["Cinnamon", "Turmeric", "Black pepper", "Benzoin"],
      base: ["Vanilla", "Sandalwood", "Cashmeran", "Moss"],
    },
    rating: 4.7,
    reviewCount: 23,
    inStock: true,
  },
  {
    slug: "michael-kors-pour-homme-absolu-set",
    name: "Michael Kors Pour Homme Absolu Gift Set",
    category: "Gift Sets",
    categorySlug: "perfumes",
    price: 180000, // estimate — exact NGN price not confirmed, see product notes
    icon: "perfume",
    image: "/products/perfumes/michael-kors-pour-homme-absolu-set.jpg",
    description:
      "A 3-piece Michael Kors Pour Homme Absolu set: eau de parfum, after-shave balm, and shower gel in original marble-print packaging.",
    benefits: ["Eau de parfum + after-shave balm + shower gel", "Original gift packaging", "For men"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Lemon", "Cardamom", "Pink pepper", "Peppermint"],
      heart: ["Lavender", "Rosyfolia", "Mahonial", "Incense"],
      base: ["Cedarwood", "Akigalawood", "Vetiver"],
    },
    rating: 4.8,
    reviewCount: 7,
    inStock: true,
  },
  {
    slug: "paris-corner-taskeen-caramel-cascade",
    name: "Paris Corner Taskeen Caramel Cascade",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 29999, // fragrances.com.ng
    icon: "perfume",
    image: "/products/perfumes/paris-corner-taskeen-caramel-cascade.jpg",
    description:
      "A 2024 floral fruity gourmand: caramel and milk over tonka bean and honey, resting on vanilla and white musk.",
    benefits: ["100ml eau de parfum", "Gourmand profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Caramel", "Milk"],
      heart: ["Tonka bean", "Honey"],
      base: ["Vanilla", "White musk"],
    },
    rating: 4.5,
    reviewCount: 12,
    inStock: true,
  },
  {
    slug: "lattafa-ramz-red",
    name: "Lattafa Ramz (Red)",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 28000, // Jumia, general Ramz reference
    icon: "perfume",
    image: "/products/perfumes/lattafa-ramz-red.jpg",
    description:
      "A fruity, floral Ramz edition: apple, pear, and black currant over jasmine sambac and rose, resting on sandalwood, musk, and vanilla.",
    benefits: ["Eau de parfum", "Fruity floral profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Apple", "Pear", "Peach", "Sweet orange", "Black currant"],
      heart: ["Jasmine sambac", "Rose", "Orange blossom"],
      base: ["Sandalwood", "White musk", "Patchouli", "Vanilla"],
    },
    rating: 4.4,
    reviewCount: 6,
    inStock: true,
  },
  {
    slug: "lattafa-angham",
    name: "Lattafa Angham",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 45000, // reseller-listed reference, ranged ₦45,000–₦50,000
    icon: "perfume",
    image: "/products/perfumes/lattafa-angham.jpg",
    description:
      "A 2024 oriental vanilla: ginger and mandarin over lavender, praline, and cacao, settling into vanilla, amber, and musk.",
    benefits: ["100ml eau de parfum", "Oriental vanilla profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Ginger", "Mandarin", "Pink pepper"],
      heart: ["Lavender", "Praline", "Cacao", "Jasmine"],
      base: ["Vanilla", "Amber", "Musk"],
    },
    rating: 4.6,
    reviewCount: 19,
    inStock: true,
  },
  {
    slug: "lattafa-hayaati-gold-elixir",
    name: "Lattafa Hayaati Gold Elixir",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 21500, // Mkhasa Fragrance Store
    icon: "perfume",
    image: "/products/perfumes/lattafa-hayaati-gold-elixir.jpg",
    description:
      "A Hayaati line edition: bergamot, grapefruit, and cassis over leather, peach, and saffron, resting on vanilla, amber, musk, and vetiver.",
    benefits: ["100ml eau de parfum", "Fruity leather profile", "Unisex"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Bergamot", "Grapefruit", "Cassis"],
      heart: ["Leather", "Peach", "Saffron"],
      base: ["Vanilla", "Amber", "Musk", "Vetiver"],
    },
    rating: 4.6,
    reviewCount: 25,
    inStock: true,
  },
  {
    slug: "lattafa-rave-now-black",
    name: "Rave Now Black",
    category: "Luxury Perfumes",
    categorySlug: "perfumes",
    price: 30999, // approx, matched to Rave Now Women's confirmed fragrances.com.ng price
    icon: "perfume",
    image: "/products/perfumes/lattafa-rave-now-black.jpg",
    description:
      "The men's Rave Now edition in its sleek black geometric bottle: pineapple and black currant over Moroccan jasmine and patchouli, closing on musk, vanilla, and oakmoss.",
    benefits: ["100ml eau de parfum", "Fruity woody profile", "For men"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Pineapple", "Bergamot", "Apple", "Black currant"],
      heart: ["Patchouli", "Birch", "Moroccan jasmine", "Rose"],
      base: ["Musk", "Vanilla", "Oakmoss", "Ambergris"],
    },
    rating: 4.5,
    reviewCount: 10,
    inStock: true,
  },
  {
    slug: "bvlgari-le-gemme-tygar",
    name: "Bvlgari Le Gemme Tygar",
    category: "Designer Perfumes",
    categorySlug: "perfumes",
    price: 280000, // set against Le Gemme's ~$200-250 international pricing plus standard NG import premium
    badge: "Limited",
    icon: "perfume",
    image: "/products/perfumes/bvlgari-le-gemme-tygar.jpg",
    description:
      "A 2016 citrus aromatic from Bvlgari's gemstone-themed Le Gemme line, in a matte black flacon crowned with a tiger's-eye cap: bright grapefruit over ginger and ambrette seed, resting on ambrox, musk, and vetiver.",
    benefits: ["100ml eau de parfum", "Citrus aromatic profile", "For men", "Le Gemme collection, tiger's-eye cap"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Grapefruit essence"],
      heart: ["Ginger", "Ambrette seeds"],
      base: ["Ambrox", "Musks", "Patchouli", "Vetiver"],
    },
    rating: 4.8,
    reviewCount: 6,
    inStock: true,
  },
  {
    slug: "parfums-de-marly-godolphin",
    name: "Parfums de Marly Godolphin",
    category: "Designer Perfumes",
    categorySlug: "perfumes",
    price: 320000, // set against ~$330/125ml international pricing plus standard NG import premium
    badge: "Limited",
    icon: "perfume",
    image: "/products/perfumes/parfums-de-marly-godolphin.jpg",
    description:
      "A 2010 leather amber woody from the house of Parfums de Marly, in their signature metal-cast gold flacon: thyme and saffron over rose, iris, and jasmine, resting on amber, vanilla, and white cedarwood.",
    benefits: ["Eau de parfum", "Leather amber woody profile", "For men", "Signature gold flacon"],
    directions: "Spray onto pulse points after showering, when skin is slightly damp for the longest wear.",
    fragranceNotes: {
      top: ["Thyme", "Saffron", "Cypress"],
      heart: ["Roses", "Iris", "Jasmine"],
      base: ["Amber", "Vanilla", "Vetiver", "White cedarwood", "Musk"],
    },
    rating: 4.9,
    reviewCount: 8,
    inStock: true,
  },
  // Real, recognizable brands actually sold in Nigerian retail (Jumia,
  // authorized distributors, etc.), same treatment as the perfume catalog:
  // real Nigerian market prices researched 2026-08-06 (marked "approx" where
  // an exact current listing wasn't found), licensed free Unsplash stock
  // photography per product (see comments) standing in until the client
  // supplies their own photography for these categories.
  {
    slug: "cerave-moisturizing-cream",
    name: "CeraVe Moisturizing Cream",
    category: "Face & Body Care",
    categorySlug: "beauty-skincare",
    price: 5999, // Jumia
    badge: "Best Seller",
    icon: "skincare",
    // photo-1585945037805-5fd82c2e60b1 — cream texture
    image: "/products/skincare/cerave-moisturizing-cream.jpg",
    description:
      "A rich, ceramide-based moisturizer developed with dermatologists, for normal to dry skin. Fragrance-free and non-comedogenic.",
    benefits: [
      "Restores the skin barrier with 3 essential ceramides",
      "24-hour hydration, fragrance-free",
      "Non-comedogenic, safe for sensitive skin",
    ],
    directions: "Apply liberally to face and body as often as needed, especially after washing or bathing.",
    ingredients: "Ceramides 1, 3, 6-II, Hyaluronic Acid, MVE Technology",
    rating: 4.8,
    reviewCount: 96,
    inStock: true,
  },
  {
    slug: "the-ordinary-niacinamide",
    name: "The Ordinary Niacinamide 10% + Zinc 1%",
    category: "Face Care",
    categorySlug: "beauty-skincare",
    price: 9500, // approx, Nigerian retailer range ₦9,000-₦10,000
    badge: "Best Seller",
    icon: "skincare",
    // photo-1608068811588-3a67006b7489 — cream/serum product shot
    image: "/products/skincare/the-ordinary-niacinamide.jpg",
    description:
      "A high-strength vitamin and mineral blemish serum that visibly balances oil activity and evens skin tone.",
    benefits: [
      "Reduces the look of blemishes and congestion",
      "Balances visible sebum activity",
      "Lightweight, layers well under moisturizer and SPF",
    ],
    directions: "Apply a few drops to face morning and night before heavier creams. Avoid combining with pure Vitamin C.",
    ingredients: "Niacinamide 10%, Zinc PCA 1%",
    rating: 4.6,
    reviewCount: 142,
    inStock: true,
  },
  {
    slug: "cetaphil-gentle-skin-cleanser",
    name: "Cetaphil Gentle Skin Cleanser",
    category: "Face Care",
    categorySlug: "beauty-skincare",
    price: 12000, // approx
    icon: "skincare",
    // photo-1623143445418-40c192fa3d11 — pump bottle product shot (swapped
    // from an earlier pick that visibly showed a NARS-branded product)
    image: "/products/skincare/cetaphil-gentle-skin-cleanser.jpg",
    description:
      "A soap-free, non-irritating daily cleanser for normal to dry, sensitive skin, recommended by dermatologists.",
    benefits: ["Soap-free and fragrance-free", "Won't clog pores", "Rinses clean, no residue"],
    directions: "Massage onto damp skin, rinse with water, or wipe off without water for very sensitive skin.",
    ingredients: "Water, Cetyl Alcohol, Propylene Glycol, Sodium Lauryl Sulfate",
    rating: 4.7,
    reviewCount: 88,
    inStock: true,
  },
  {
    slug: "fenty-beauty-pro-filtr-foundation",
    name: "Fenty Beauty Pro Filt'r Soft Matte Foundation",
    category: "Cosmetics",
    categorySlug: "makeup",
    price: 68000, // approx
    badge: "Best Seller",
    icon: "makeup",
    // photo-1596462502278-27bfdc403348 — makeup product shot
    image: "/products/makeup/fenty-beauty-pro-filtr-foundation.jpg",
    description:
      "A soft matte, longwear foundation available across 50 shades, built to properly serve deep and melanin-rich skin tones.",
    benefits: ["50-shade range, true depth and undertone matching", "Soft matte, buildable coverage", "12-hour wear"],
    directions: "Apply with a damp sponge or brush, building from the center of the face outward.",
    ingredients: "Contains SPF-free formula, Mattifying Powders, Skin-Loving Ingredients",
    rating: 4.8,
    reviewCount: 74,
    inStock: true,
  },
  {
    slug: "mac-ruby-woo-lipstick",
    name: "MAC Ruby Woo Lipstick",
    category: "Cosmetics",
    categorySlug: "makeup",
    price: 28000, // approx
    icon: "makeup",
    // photo-1631214524049-0ebbbe6d81aa — lip color trio flat lay (swapped
    // from an earlier pick that turned out to show a Laura Mercier box)
    image: "/products/makeup/mac-ruby-woo-lipstick.jpg",
    description:
      "MAC's iconic blue-red retro matte lipstick, one of the most recognized lip shades in beauty, with intense, long-wearing pigment.",
    benefits: ["Iconic vivid blue-red shade", "Retro matte, long-wearing finish", "Universally flattering undertone"],
    directions: "Apply directly from the bullet, or with a lip brush for precision. Line lips first for longer wear.",
    rating: 4.7,
    reviewCount: 51,
    inStock: true,
  },
  {
    slug: "maybelline-fit-me-concealer",
    name: "Maybelline Fit Me Concealer",
    category: "Cosmetics",
    categorySlug: "makeup",
    price: 6500, // approx
    badge: "New",
    icon: "makeup",
    // photo-1643185450492-6ba77dea00f6 — concealer/compact product shot
    image: "/products/makeup/maybelline-fit-me-concealer.jpg",
    description:
      "A lightweight, natural-finish concealer that matches skin tone and texture, available across a wide shade range.",
    benefits: ["Natural, skin-like finish", "Covers dark circles and blemishes without caking", "Wide, inclusive shade range"],
    directions: "Dab onto areas needing coverage and blend with a sponge or fingertip. Set with powder for longer wear.",
    rating: 4.5,
    reviewCount: 63,
    inStock: true,
  },
  {
    slug: "cantu-shea-butter-leave-in",
    name: "Cantu Shea Butter Leave-In Conditioning Repair Cream",
    category: "Hair Care",
    categorySlug: "hair-care",
    price: 8500, // approx
    badge: "Best Seller",
    icon: "hair",
    // photo-1608571424266-edeb9bbefdec — amber dropper bottle (swapped from
    // an earlier pick that was a "Bottle Mockup" template image, not a photo)
    image: "/products/hair-care/cantu-shea-butter-leave-in.jpg",
    description:
      "A shea butter-based leave-in conditioner formulated for natural, textured hair, detangling and moisturizing without buildup.",
    benefits: ["Detangles and softens natural hair", "No parabens, no mineral oil, no phthalates", "Seals in moisture"],
    directions: "Apply to clean, damp hair from mid-length to ends. Style as usual, no rinsing required.",
    ingredients: "Shea Butter, Silk Protein",
    rating: 4.6,
    reviewCount: 47,
    inStock: true,
  },
  {
    slug: "ors-olive-oil-shampoo",
    name: "ORS Olive Oil Creamy Aloe Shampoo",
    category: "Hair Care",
    categorySlug: "hair-care",
    price: 5999, // approx
    icon: "hair",
    // photo-1597931752949-98c74b5b159f — pump bottle on linen (swapped from
    // an earlier pick that was a "Bottle Mockup" template image, not a photo)
    image: "/products/hair-care/ors-olive-oil-shampoo.jpg",
    description:
      "A gentle, moisturizing shampoo with olive oil and aloe, formulated to cleanse without stripping natural oils from textured hair.",
    benefits: ["Cleanses without stripping moisture", "Aloe soothes the scalp", "Safe for color-treated hair"],
    directions: "Wet hair thoroughly, apply, and massage into a lather. Rinse well and follow with conditioner.",
    ingredients: "Olive Oil, Aloe Vera",
    rating: 4.5,
    reviewCount: 39,
    inStock: true,
  },
  {
    slug: "mielle-rosemary-mint-oil",
    name: "Mielle Organics Rosemary Mint Scalp & Hair Strengthening Oil",
    category: "Hair Care",
    categorySlug: "hair-care",
    price: 12000, // approx
    badge: "New",
    icon: "hair",
    // photo-1597317628840-d3472f7aa7fc — frosted flask bottle (swapped from
    // an earlier pick that was a "Bottle Mockup" template image, not a photo)
    image: "/products/hair-care/mielle-rosemary-mint-oil.jpg",
    description:
      "A biotin-infused scalp oil with rosemary and mint, formulated to nourish the scalp and strengthen hair from root to end.",
    benefits: ["Nourishes and soothes the scalp", "Strengthens hair, reduces breakage", "Biotin-infused"],
    directions: "Apply directly to the scalp and massage in. Use 2 to 3 times per week.",
    ingredients: "Rosemary Leaf Oil, Peppermint Oil, Biotin",
    rating: 4.7,
    reviewCount: 55,
    inStock: true,
  },
  {
    slug: "casio-edifice",
    name: "Casio Edifice",
    category: "Watches",
    categorySlug: "watches",
    price: 35000, // Jumia range ₦29,225-₦40,018
    badge: "Best Seller",
    icon: "watch",
    // photo-1774299398828-8dc74e92e53c — black chronograph on rocks (swapped
    // from an earlier pick that turned out to show a Fossil-branded watch)
    image: "/products/watches/casio-edifice.jpg",
    description:
      "A stainless steel chronograph with a sapphire-coated mineral crystal, built with Casio's precision quartz movement.",
    benefits: ["Chronograph with 1/20-second stopwatch", "Water-resistant to 100m", "Stainless steel case and bracelet"],
    directions: "Set time and date via the side crown. Avoid operating pushers underwater.",
    rating: 4.7,
    reviewCount: 61,
    inStock: true,
  },
  {
    slug: "fossil-grant-chronograph",
    name: "Fossil Grant Chronograph",
    category: "Watches",
    categorySlug: "watches",
    price: 118000, // approx, Nigerian retailer range ₦115,000-₦120,000
    icon: "watch",
    // photo-1542496658-e33a6d0d50f6 — Fossil chronograph watch with leather band
    image: "/products/watches/fossil-grant-chronograph.jpg",
    description:
      "A classic round-face chronograph with a genuine leather strap and a wood-inspired dial, from Fossil's signature Grant collection.",
    benefits: ["Chronograph movement", "Genuine leather strap", "Mineral crystal face"],
    directions: "Set time via the crown. Adjust strap at an authorized fitter for the best fit.",
    rating: 4.6,
    reviewCount: 34,
    inStock: true,
  },
  {
    slug: "michael-kors-runway-watch",
    name: "Michael Kors Runway Watch",
    category: "Watches",
    categorySlug: "watches",
    price: 285000, // approx, authorized Nigerian retailer range ₦240,800-₦722,300
    badge: "Limited",
    icon: "watch",
    // photo-1541778480-fc1752bbc2a9 — gold bracelet watch (swapped from an
    // earlier pick that turned out to show a Festina-branded watch face)
    image: "/products/watches/michael-kors-runway-watch.jpg",
    description:
      "An oversized stainless steel runway watch with a polished bracelet, Michael Kors' signature statement timepiece.",
    benefits: ["Oversized case, statement sizing", "Stainless steel bracelet", "Water-resistant to 50m"],
    directions: "Set time and date via the side crown. Store away from magnets and extreme heat.",
    rating: 4.7,
    reviewCount: 29,
    inStock: true,
  },
  {
    slug: "michael-kors-jet-set-tote",
    name: "Michael Kors Jet Set Tote",
    category: "Handbags",
    categorySlug: "handbags",
    price: 180000, // approx
    badge: "Best Seller",
    icon: "bag",
    // photo-1624687943971-e86af76d57de — brown leather handbag
    image: "/products/handbags/michael-kors-jet-set-tote.jpg",
    description:
      "A structured saffiano leather tote with the signature MK logo hardware, sized to carry daily essentials and a laptop.",
    benefits: ["Saffiano leather, scratch-resistant", "Fits a 13-inch laptop", "Zip-top closure, interior pockets"],
    directions: "Wipe clean with a dry cloth. Avoid prolonged exposure to direct sunlight and moisture.",
    rating: 4.6,
    reviewCount: 31,
    inStock: true,
  },
  {
    slug: "coach-tabby-shoulder-bag",
    name: "Coach Tabby Shoulder Bag",
    category: "Handbags",
    categorySlug: "handbags",
    price: 190000, // approx
    icon: "bag",
    // photo-1657603719375-8ffdacaac790 — brown leather shoulder bag (swapped
    // from an earlier pick that was an unusable extreme leather-texture crop)
    image: "/products/handbags/coach-tabby-shoulder-bag.jpg",
    description:
      "A compact structured shoulder bag in pebbled leather with a signature turn-lock closure and detachable chain strap.",
    benefits: ["Pebbled leather construction", "Detachable chain strap", "Turn-lock closure"],
    directions: "Store stuffed with tissue paper to hold shape. Condition leather periodically.",
    rating: 4.8,
    reviewCount: 22,
    inStock: true,
  },
  {
    slug: "aldo-structured-tote",
    name: "Aldo Structured Tote",
    category: "Handbags",
    categorySlug: "handbags",
    price: 55000, // approx
    badge: "New",
    icon: "bag",
    // photo-1732963947955-858ad7d5e540 — structured tote bag
    image: "/products/handbags/aldo-structured-tote.jpg",
    description:
      "A clean-lined structured tote in vegan leather, sized for everyday carry with an accessible, everyday price point.",
    benefits: ["Vegan leather", "Structured silhouette holds its shape", "Interior zip pocket"],
    directions: "Wipe clean with a damp cloth. Store upright to maintain shape.",
    rating: 4.4,
    reviewCount: 18,
    inStock: true,
  },
  {
    slug: "pandora-moments-bracelet",
    name: "Pandora Moments Charm Bracelet",
    category: "Jewelry",
    categorySlug: "jewelry",
    price: 138800, // confirmed reference price
    badge: "Best Seller",
    icon: "jewelry",
    // photo-1676301086281-e65f219c7f22 — silver heart-charm bracelet (swapped
    // from an earlier pick that was actually an ornate necklace/earring set)
    image: "/products/jewelry/pandora-moments-bracelet.jpg",
    description:
      "A sterling silver charm bracelet with a barrel clasp, designed to hold and display Pandora's charm collection.",
    benefits: ["Sterling silver (S925)", "Barrel clasp for secure, easy charm changes", "Comes in a keepsake box"],
    directions: "Remove before swimming, showering, or applying lotion. Store in the box away from direct sunlight.",
    rating: 4.7,
    reviewCount: 44,
    inStock: true,
  },
  {
    slug: "swarovski-pearl-necklace",
    name: "Swarovski Pearl Necklace",
    category: "Jewelry",
    categorySlug: "jewelry",
    price: 95000, // approx
    icon: "jewelry",
    // photo-1515562141207-7a88fb7ce338 — pearl necklace with box
    image: "/products/jewelry/swarovski-pearl-necklace.jpg",
    description:
      "A crystal pearl necklace on a rhodium-plated chain, finished with Swarovski's signature faceted crystal clasp.",
    benefits: ["Rhodium-plated, tarnish-resistant", "Swarovski crystal pearls", "Adjustable chain length"],
    directions: "Remove before swimming or showering. Store flat in the provided pouch.",
    rating: 4.6,
    reviewCount: 19,
    inStock: true,
  },
  {
    slug: "swarovski-stud-earrings",
    name: "Swarovski Stud Earrings",
    category: "Jewelry",
    categorySlug: "jewelry",
    price: 45000, // approx
    badge: "New",
    icon: "jewelry",
    // photo-1693213085235-ea6deadf8cee — earrings on dark background
    image: "/products/jewelry/swarovski-stud-earrings.jpg",
    description:
      "Round-cut crystal studs on a rhodium-plated setting, sized for everyday wear with evening-ready sparkle.",
    benefits: ["Rhodium-plated, tarnish-resistant", "Hypoallergenic posts", "Round-cut Swarovski crystal"],
    directions: "Remove before swimming or showering. Store in the provided box away from direct sunlight.",
    rating: 4.5,
    reviewCount: 27,
    inStock: true,
  },
  {
    slug: "rayban-aviator-classic",
    name: "Ray-Ban Aviator Classic",
    category: "Sunglasses",
    categorySlug: "sunglasses",
    price: 55000, // approx
    badge: "Best Seller",
    icon: "sunglasses",
    // photo-1567473810954-507d59716c25 — gold-framed aviator sunglasses
    image: "/products/sunglasses/rayban-aviator-classic.jpg",
    description:
      "The original Ray-Ban Aviator, in a gold metal frame with green G-15 lenses, developed originally for US Air Force pilots.",
    benefits: ["Gold-plated metal frame", "G-15 lenses, 100% UV protection", "Adjustable nose pads"],
    directions: "Clean lenses only with a microfiber cloth. Store in a hard case when not worn.",
    rating: 4.8,
    reviewCount: 68,
    inStock: true,
  },
  {
    slug: "rayban-wayfarer",
    name: "Ray-Ban Wayfarer",
    category: "Sunglasses",
    categorySlug: "sunglasses",
    price: 58000, // approx
    icon: "sunglasses",
    // photo-1773474763124-9ac0727669ce — black Ray-Ban style sunglasses
    image: "/products/sunglasses/rayban-wayfarer.jpg",
    description:
      "The iconic Ray-Ban Wayfarer silhouette in glossy black acetate, a design constant since 1956.",
    benefits: ["Acetate frame construction", "100% UV protection", "Iconic, versatile silhouette"],
    directions: "Clean lenses only with a microfiber cloth. Avoid leaving in high heat, which can warp acetate.",
    rating: 4.7,
    reviewCount: 52,
    inStock: true,
  },
  {
    slug: "prada-sunglasses",
    name: "Prada Sunglasses",
    category: "Sunglasses",
    categorySlug: "sunglasses",
    price: 560000, // House of Lunettes, authorized Nigerian retailer
    badge: "Limited",
    icon: "sunglasses",
    // photo-1589642380614-4a8c2147b857 — silver-framed sunglasses
    image: "/products/sunglasses/prada-sunglasses.jpg",
    description:
      "A refined silver-framed silhouette from Prada's eyewear collection, finished with the house's signature triangle logo.",
    benefits: ["Italian-made acetate and metal construction", "100% UV protection", "Signature Prada hardware"],
    directions: "Clean lenses only with the provided microfiber cloth. Store in the hard case when not worn.",
    rating: 4.8,
    reviewCount: 14,
    inStock: true,
  },
];

// getProduct/getProductsByCategory/getRelatedProducts/bestSellers/
// newArrivals used to live here — superseded by the DB-backed equivalents
// in src/lib/products.ts. `products` itself stays only as the one-time
// seed source (see src/app/api/admin/seed-products).

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

export const instagramPosts = Array.from({ length: 6 }).map((_, i) => ({
  id: i,
  icon: categories[i % categories.length].icon,
}));
