// Seed for the Category table (added 2026-09-02): every collection the
// storefront ships with, including which header dropdown each one belongs
// under (`navGroup`).
//
// The header is:
//   New Arrivals | Combo Deals | Collections v | Beauty & Skincare |
//   Accessories v | Contact | Refund Policy
//
// Both dropdowns are rendered alphabetically by name, so `sortOrder` here
// only affects the homepage grid. "Collections" and "Accessories" are pure
// umbrella pages that the menu labels themselves point at.
//
// scripts/restructure-categories.mjs and scripts/restructure-nav.mjs are
// the dated one-offs that brought the already-populated production
// database to this shape; this file is what a fresh database gets.
//
// Idempotent: re-running it only fills in categories that are missing, it
// never overwrites edits staff have since made in /admin/categories. Run
// with `node scripts/seed-categories.mjs`.
//
// Plain `pg` rather than Prisma because the generated client is TypeScript
// (see prisma/schema.prisma's `output`), so it isn't directly importable
// from a standalone node script.

import { randomUUID } from "node:crypto";
import pg from "pg";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — expected on CI/Vercel, real env vars are already set
}

// groupSlugs holds only the *extra* slugs folded into a category page; the
// category's own slug is always included implicitly (see src/lib/categories.ts).
// navGroup is the header dropdown it appears under, or null for neither.
const CATEGORIES = [
  // --- The Collections dropdown, alphabetical in the menu ---
  {
    slug: "arabian-perfumes",
    name: "Arabian Perfumes",
    tagline: "Oud, amber & attar",
    description:
      "Rich oriental compositions built on oud, amber, saffron and musk, from the Middle Eastern houses that define the style.",
    icon: "perfume",
    image: null,
    groupSlugs: [],
    navGroup: "collections",
    sortOrder: 30,
    assignable: true,
    showOnHome: true,
  },
  {
    slug: "body-mist",
    name: "Body Mist",
    tagline: "Light, everyday freshness",
    description:
      "Light body sprays, mists and roll-ons for an easy refresh through the day, made to layer under a fuller fragrance.",
    icon: "perfume",
    image: null,
    groupSlugs: [],
    navGroup: "collections",
    sortOrder: 50,
    assignable: true,
    showOnHome: true,
  },
  {
    // Renamed from "Designer Perfumes" on 2026-09-03 (see scripts/
    // migrations/rename-designer-to-luxury-perfumes.mjs). The slug is
    // deliberately still `designer-perfumes`: renaming in place keeps
    // /category/designer-perfumes resolving for existing links and search
    // results.
    slug: "designer-perfumes",
    name: "Luxury Perfumes",
    tagline: "House signatures & niche imports",
    description:
      "Fragrances from the international design houses and niche perfumers, from everyday signatures to collector bottles.",
    icon: "perfume",
    image: null,
    groupSlugs: [],
    navGroup: "collections",
    sortOrder: 20,
    assignable: true,
    showOnHome: true,
  },
  {
    slug: "gift-sets",
    name: "Gift Sets",
    tagline: "Ready to give",
    description:
      "Curated multi-piece sets, boxed and ready to hand over, for anyone shopping for someone else.",
    icon: "perfume",
    image: null,
    groupSlugs: [],
    navGroup: "collections",
    sortOrder: 60,
    assignable: true,
    showOnHome: true,
  },
  {
    slug: "home-fragrance",
    name: "Home Fragrances",
    tagline: "Scent your space",
    description:
      "Reed diffusers and hand-poured candles that carry the same signature-scent philosophy from the bottle to the home.",
    icon: "candle",
    image: "/products/home-fragrance/heidiz-signature-candle-trio.jpg",
    groupSlugs: [],
    navGroup: "collections",
    sortOrder: 40,
    assignable: true,
    showOnHome: true,
  },
  {
    slug: "incense",
    name: "Incense",
    tagline: "Bakhoor & oud chips",
    description:
      "Bakhoor, oud chips and incense blends for scenting a room, a wardrobe, or fabric the traditional way.",
    icon: "candle",
    image: null,
    groupSlugs: [],
    navGroup: "collections",
    sortOrder: 45,
    assignable: true,
    showOnHome: true,
  },
  {
    slug: "miniatures",
    name: "Miniatures",
    tagline: "Travel sizes & discovery",
    description:
      "Small-format bottles and discovery sizes, made to travel or to try a house before committing to a full bottle.",
    icon: "perfume",
    image: null,
    groupSlugs: [],
    navGroup: "collections",
    sortOrder: 55,
    assignable: true,
    showOnHome: true,
  },
  {
    slug: "oil-perfumes",
    name: "Oil Perfumes",
    tagline: "Alcohol-free attars & roll-ons",
    description:
      "Concentrated alcohol-free oils and attars that sit close to the skin and last through a full Abuja day, in roll-ons made to carry.",
    icon: "perfume",
    image: null,
    groupSlugs: [],
    navGroup: "collections",
    sortOrder: 10,
    assignable: true,
    showOnHome: true,
  },
  {
    slug: "the-niche-collections",
    name: "The NICHE Collections",
    tagline: "Rare houses, small batches",
    description:
      "Limited-allocation bottles from niche perfumers, the pieces that aren't on every counter.",
    icon: "perfume",
    image: null,
    groupSlugs: [],
    navGroup: "collections",
    sortOrder: 5,
    assignable: true,
    showOnHome: true,
  },

  // --- The Accessories dropdown, alphabetical in the menu ---
  {
    slug: "bracelets",
    name: "Bracelets",
    tagline: "Wrist finishing pieces",
    description:
      "Charm bracelets, bangles and cuffs in gold, silver and precious stones, made for everyday wear as much as the occasion.",
    icon: "jewelry",
    image: null,
    groupSlugs: [],
    navGroup: "accessories",
    sortOrder: 100,
    assignable: true,
    showOnHome: true,
  },
  {
    slug: "handbags",
    name: "Hand Bags",
    tagline: "Crafted to carry",
    description:
      "Full-grain leather silhouettes structured to hold their shape from the boardroom to the airport lounge.",
    icon: "bag",
    image: "/products/handbags/coach-tabby-shoulder-bag.jpg",
    groupSlugs: [],
    navGroup: "accessories",
    sortOrder: 60,
    assignable: true,
    showOnHome: true,
  },
  {
    slug: "necklaces",
    name: "Necklaces",
    tagline: "Pendants & pearls",
    description:
      "Pendants, chains and pearl strands that finish a look without competing with it.",
    icon: "jewelry",
    image: null,
    groupSlugs: [],
    navGroup: "accessories",
    sortOrder: 105,
    assignable: true,
    showOnHome: true,
  },
  {
    slug: "shoes",
    name: "Shoes",
    tagline: "Corporate, sneakers & slippers",
    description:
      "Footwear for every register: boardroom loafers, everyday sneakers, and easy slides, for men and women alike.",
    icon: "shoes",
    image: "/products/shoes/premium-leather-loafers.jpg",
    groupSlugs: [],
    navGroup: "accessories",
    sortOrder: 90,
    assignable: true,
    showOnHome: true,
  },
  {
    slug: "sunglasses",
    name: "Sunglasses",
    tagline: "Statement optics",
    description:
      "Statement frames with UV-rated lenses, cut for a silhouette that holds up outdoors and on camera.",
    icon: "sunglasses",
    image: "/products/sunglasses/rayban-aviator-classic.jpg",
    groupSlugs: [],
    navGroup: "accessories",
    sortOrder: 70,
    assignable: true,
    showOnHome: true,
  },
  {
    slug: "watches",
    name: "Wristwatches",
    tagline: "Timeless precision",
    description:
      "Timepieces that carry their own gravity, built from precision movements and finished by hand.",
    icon: "watch",
    image: "/products/watches/fossil-grant-chronograph.jpg",
    groupSlugs: [],
    navGroup: "accessories",
    sortOrder: 80,
    assignable: true,
    showOnHome: true,
  },

  // --- Top-level links that aren't in either dropdown ---
  {
    // Sits beside New Arrivals in the header rather than inside a menu, so
    // it carries no navGroup; the header declares the link itself. Off the
    // homepage grid because it gets its own product row there instead.
    slug: "combo-deals",
    name: "Combo Deals",
    tagline: "Bundled, better value",
    description:
      "Multi-piece bundles priced below the sum of their parts: pair a signature scent with its body mist, or build a set across houses.",
    icon: "perfume",
    image: null,
    groupSlugs: [],
    navGroup: null,
    sortOrder: 1,
    assignable: true,
    showOnHome: false,
  },

  // --- Umbrella pages the two menu labels point at ---
  {
    slug: "collections",
    name: "Collections",
    tagline: "The full HEIDIZ fragrance wardrobe",
    description:
      "Every HEIDIZ collection in one place: niche and designer houses, Arabian oud, oil perfumes, body mists, incense, miniatures, gift sets and home fragrance.",
    icon: "perfume",
    image: null,
    groupSlugs: ["arabian-perfumes", "body-mist", "designer-perfumes", "gift-sets", "home-fragrance", "incense", "miniatures", "oil-perfumes", "the-niche-collections", "perfumes"],
    navGroup: null,
    sortOrder: 0,
    assignable: false,
    showOnHome: false,
  },
  {
    // Also gathers Jewelry, so pieces that are neither a bracelet nor a
    // necklace (earrings) stay browsable even without a menu entry.
    slug: "accessories",
    name: "Accessories",
    tagline: "Shoes, bags, eyewear & fine jewelry",
    description:
      "The finishing pieces: footwear, leather goods, eyewear, timepieces and fine jewelry, gathered in one edit.",
    icon: "bag",
    image: null,
    groupSlugs: ["bracelets", "handbags", "necklaces", "shoes", "sunglasses", "watches", "jewelry"],
    navGroup: null,
    sortOrder: 110,
    assignable: false,
    showOnHome: false,
  },

  // --- Kept and fully editable, but off both menus ---
  {
    // Still holds the bottles not yet filed into Designer or Arabian, so
    // it must not be deleted while those exist.
    slug: "perfumes",
    name: "Luxury Perfumes",
    tagline: "Signature scents & oud",
    description:
      "Fragrances layered from rare oud, warm amber, and bright florals, each bottle designed to be worn like a signature.",
    icon: "perfume",
    image: "/products/perfumes/amouroud-dark-orchid.jpg",
    groupSlugs: [],
    navGroup: null,
    sortOrder: 10,
    assignable: true,
    showOnHome: false,
  },
  {
    // Reached from its own top-level link in the header, not a dropdown.
    slug: "beauty-skincare",
    name: "Beauty & Skincare",
    tagline: "Skincare, makeup & hair care",
    description:
      "Face and body formulations built around proven actives, made for skin that has to handle Abuja heat and harmattan dust in the same week, alongside color cosmetics and hair care.",
    icon: "skincare",
    image: "/products/skincare/cerave-moisturizing-cream.jpg",
    groupSlugs: ["makeup", "hair-care"],
    navGroup: null,
    sortOrder: 20,
    assignable: true,
    showOnHome: false,
  },
  {
    slug: "makeup",
    name: "Makeup Collection",
    tagline: "Editorial-ready color",
    description:
      "Pigment-rich color cosmetics built for melanin-rich skin tones, from soft everyday looks to full editorial glam.",
    icon: "makeup",
    image: "/products/makeup/fenty-beauty-pro-filtr-foundation.jpg",
    groupSlugs: [],
    navGroup: null,
    sortOrder: 30,
    assignable: true,
    showOnHome: false,
  },
  {
    slug: "hair-care",
    name: "Hair Care",
    tagline: "Salon-grade nourishment",
    description:
      "Treatments and stylers formulated for textured hair, delivering salon-level results between appointments.",
    icon: "hair",
    image: "/products/hair-care/mielle-rosemary-mint-oil.jpg",
    groupSlugs: [],
    navGroup: null,
    sortOrder: 40,
    assignable: true,
    showOnHome: false,
  },
  {
    slug: "jewelry",
    name: "Jewelry",
    tagline: "Fine finishing touches",
    description:
      "Fine pieces in gold, silver, and precious stones, made for everyday wear as much as the occasion.",
    icon: "jewelry",
    image: "/products/jewelry/swarovski-stud-earrings.jpg",
    groupSlugs: [],
    navGroup: null,
    sortOrder: 95,
    assignable: true,
    showOnHome: false,
  },
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

let inserted = 0;
for (const c of CATEGORIES) {
  const res = await client.query(
    `insert into "Category"
       (id, slug, name, tagline, description, icon, image, "groupSlugs",
        "navGroup", "sortOrder", assignable, "showOnHome", "createdAt", "updatedAt")
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now(), now())
     on conflict (slug) do nothing`,
    [
      randomUUID(),
      c.slug,
      c.name,
      c.tagline,
      c.description,
      c.icon,
      c.image,
      c.groupSlugs,
      c.navGroup,
      c.sortOrder,
      c.assignable,
      c.showOnHome,
    ]
  );
  if (res.rowCount > 0) inserted += 1;
}

const { rows } = await client.query(`select count(*)::int as n from "Category"`);
console.log(`Seeded ${inserted} new categories. Category table now holds ${rows[0].n}.`);

await client.end();
