import type { IconKey } from "@/lib/product-types";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  icon: IconKey;
  paragraphs: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-layer-fragrance",
    title: "How to Layer Fragrance Without Overdoing It",
    excerpt:
      "Layering scent is how the same bottle can smell different on you than on anyone else. Here's how to do it with intention.",
    category: "Perfume Guide",
    readTime: "4 min read",
    icon: "perfume",
    paragraphs: [
      "Layering fragrance means applying two or more scented products, a perfume, a body cream, an oil, in a way that builds depth rather than competing noise. Done well, it makes a fragrance feel more personal and lasts longer on skin. Done carelessly, it turns into a headache in a bottle.",
      "Start with the base. An unscented or matching-scented body cream applied right after a shower gives perfume something to hold onto, which is part of why fragrance seems to fade faster on dry skin. If you're wearing one of our oud-forward scents, a plain shea-based body cream underneath will extend wear without changing the scent.",
      "Layer heaviest to lightest. Apply your richest product first, an oil or cream, then your eau de parfum on top, focusing on pulse points: wrists, neck, behind the ears. If you're combining two fragrances intentionally, choose ones that share at least one note family, both woody, both citrus, so they blend rather than clash.",
      "Less is still more. Two sprays of a well-chosen fragrance on damp skin will outperform six sprays applied carelessly. Fragrance is meant to be discovered up close, not announced from across the room.",
      "If you're not sure where to start, message us on WhatsApp with what you currently wear and we'll suggest a layering combination from the collection.",
    ],
  },
  {
    slug: "skincare-for-harmattan-season",
    title: "Skincare for Harmattan Season, Not Just Any Dry Climate",
    excerpt:
      "Abuja's harmattan is specific: dry, dusty, and hard on skin in a way generic advice doesn't cover. Here's what actually helps.",
    category: "Skincare Tips",
    readTime: "5 min read",
    icon: "skincare",
    paragraphs: [
      "Most skincare advice for \"dry climates\" is written for temperate winters, not for the dust-laden, low-humidity air of harmattan season in Abuja. The two aren't the same problem, and they don't have the same solution.",
      "Dust is the first issue nobody mentions. Harmattan air carries fine particulate that settles on skin all day, mixing with oil and sweat to clog pores. A gentle cleanser used morning and night matters more during harmattan than in wetter months, even though your instinct might be to cleanse less because skin feels dry.",
      "Layer hydration, don't just moisturize once. A hyaluronic acid serum on damp skin, sealed with a proper moisturizer, holds water in skin far better than a heavy cream alone on dry skin. If you're using one of our vitamin C or niacinamide serums, this is the season to be consistent with it, dust and dryness both accelerate the dullness these ingredients are built to fight.",
      "Don't skip SPF because it's cooler. Harmattan haze reduces visible sun but not UV exposure. Sunscreen stays a daily step regardless of the dust in the air.",
      "Lips and heels need the most help. These are the areas people forget until they crack. A thick balm at night on lips, and a shea-based cream on heels, prevents the kind of harmattan damage that takes weeks to reverse.",
    ],
  },
  {
    slug: "choosing-a-signature-scent",
    title: "How to Choose a Signature Scent That Actually Fits You",
    excerpt:
      "A signature scent isn't the one you like on paper. It's the one that still feels right after eight hours on your skin.",
    category: "Perfume Guide",
    readTime: "4 min read",
    icon: "perfume",
    paragraphs: [
      "A signature scent works because it becomes associated with you specifically, not because it's the most popular bottle on the shelf. Choosing one starts with paying attention to how fragrance actually behaves on your skin over time, not how it smells in the first thirty seconds.",
      "Test on skin, not paper. Paper shows you the fragrance's structure, but skin chemistry, oil levels, temperature, even diet, changes how a scent develops. A fragrance that smells sharp on a card can soften into something completely different an hour into wearing it.",
      "Give it time before deciding. Every fragrance moves through top, heart, and base notes over several hours. If you only smell the first ten minutes, you're judging the introduction, not the fragrance. Spray, go about your day, and check back in at the two-hour and six-hour marks.",
      "Consider where you'll wear it most. An intense oud that reads beautifully for evening can feel like too much for a daytime office setting. Many of our clients keep two or three fragrances in rotation rather than searching for one that does everything, a lighter citrus or floral for daytime, something warmer and more concentrated for evening.",
      "When in doubt, ask. Fragrance is genuinely personal, and there's no substitute for trying it on your own skin. Visit us in Mabushi or message us on WhatsApp and we'll help you narrow it down from the collection.",
    ],
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}
