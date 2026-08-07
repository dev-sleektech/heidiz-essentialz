import type { Product } from "@/lib/product-types";

// Simple keyword-matching quiz, not an LLM — scores real fragranceNotes
// data already in the catalog against the customer's answers. No AI
// provider account needed, per the user's chosen scope (2026-08-07).

export type ScentFamily = "fresh" | "floral" | "oriental" | "woody";
export type Budget = "under-30k" | "30k-80k" | "80k-150k" | "150k-plus";
export type Occasion = "everyday" | "evening" | "special" | "gifting";

export const SCENT_FAMILY_OPTIONS: { value: ScentFamily; label: string; description: string }[] = [
  { value: "fresh", label: "Fresh & Citrus", description: "Bright, clean, energizing" },
  { value: "floral", label: "Floral & Soft", description: "Romantic, delicate, feminine" },
  { value: "oriental", label: "Oriental & Warm", description: "Rich, spicy, sensual" },
  { value: "woody", label: "Woody & Earthy", description: "Deep, grounded, confident" },
];

export const BUDGET_OPTIONS: { value: Budget; label: string; min: number; max: number }[] = [
  { value: "under-30k", label: "Under ₦30,000", min: 0, max: 30_000 },
  { value: "30k-80k", label: "₦30,000 – ₦80,000", min: 30_000, max: 80_000 },
  { value: "80k-150k", label: "₦80,000 – ₦150,000", min: 80_000, max: 150_000 },
  { value: "150k-plus", label: "₦150,000 and above", min: 150_000, max: Infinity },
];

export const OCCASION_OPTIONS: { value: Occasion; label: string }[] = [
  { value: "everyday", label: "Everyday Wear" },
  { value: "evening", label: "Evening & Date Night" },
  { value: "special", label: "Special Occasion" },
  { value: "gifting", label: "Gifting" },
];

const FAMILY_KEYWORDS: Record<ScentFamily, string[]> = {
  fresh: ["bergamot", "citrus", "lemon", "mandarin", "orange", "grapefruit", "lime", "mint", "marine", "aquatic", "green", "apple"],
  floral: ["jasmine", "rose", "lily", "orchid", "ylang", "violet", "peony", "iris", "magnolia", "lavender", "gardenia", "blossom"],
  oriental: ["amber", "vanilla", "oud", "agarwood", "saffron", "spice", "cinnamon", "cardamom", "incense", "musk", "tonka"],
  woody: ["sandalwood", "cedar", "patchouli", "vetiver", "oakmoss", "wood", "earthy", "tobacco", "leather", "moss"],
};

export type QuizAnswers = { family: ScentFamily; budget: Budget; occasion: Occasion };

export type Match = { product: Product; score: number; reasons: string[] };

export function matchFragrances(products: Product[], answers: QuizAnswers, limit = 4): Match[] {
  const budget = BUDGET_OPTIONS.find((b) => b.value === answers.budget);
  const keywords = FAMILY_KEYWORDS[answers.family];
  const familyLabel = SCENT_FAMILY_OPTIONS.find((f) => f.value === answers.family)?.label ?? "";

  const scored: Match[] = products
    .filter((p) => p.fragranceNotes)
    .map((product) => {
      const allNotes = [
        ...(product.fragranceNotes?.top ?? []),
        ...(product.fragranceNotes?.heart ?? []),
        ...(product.fragranceNotes?.base ?? []),
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      const reasons: string[] = [];

      const familyHits = keywords.filter((kw) => allNotes.includes(kw)).length;
      if (familyHits > 0) {
        score += familyHits * 3;
        reasons.push(`Matches your love of ${familyLabel.toLowerCase()} scents`);
      }

      if (budget && product.price >= budget.min && product.price <= budget.max) {
        score += 4;
        reasons.push("Fits your budget");
      }

      if (answers.occasion === "special" && (product.badge === "Limited" || product.price >= 150_000)) {
        score += 2;
        reasons.push("A statement bottle for special occasions");
      }
      if (answers.occasion === "gifting" && product.badge) {
        score += 1;
        reasons.push("A well-regarded pick for gifting");
      }
      if (answers.occasion === "everyday" && product.price < 60_000) {
        score += 2;
        reasons.push("Easy, everyday-priced pick");
      }
      if (answers.occasion === "evening" && (allNotes.includes("oud") || allNotes.includes("amber") || allNotes.includes("vanilla"))) {
        score += 2;
        reasons.push("Warm base notes that carry into the evening");
      }

      return { product, score, reasons };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
