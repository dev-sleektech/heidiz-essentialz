import type { FragranceNotes as Notes } from "@/lib/product-types";

// The scent pyramid, promoted out of the accordion it used to hide in
// (2026-09-03).
//
// This is the one piece of content in the catalog that is specific to
// selling fragrance, structured per product, and impossible for a generic
// store template to have. It was rendering as a <dl> inside a collapsed
// panel below the fold, while the product description printed twice at full
// size — the hierarchy was exactly inverted for the category.
//
// Ordered top -> heart -> base, which is the order the wearer actually
// meets them, with the reading order doubling as the timeline. The short
// gloss on each tier matters: most buyers know they like a scent without
// knowing the vocabulary, and "what you smell first" sells better than
// "Top".

const TIERS = [
  { key: "top", label: "Top", gloss: "What you smell first" },
  { key: "heart", label: "Heart", gloss: "The character it settles into" },
  { key: "base", label: "Base", gloss: "What lingers on skin" },
] as const;

export function FragranceNotes({ notes }: { notes: Notes }) {
  const tiers = TIERS.map((tier) => ({ ...tier, values: notes[tier.key] ?? [] })).filter(
    (tier) => tier.values.length > 0
  );

  if (tiers.length === 0) return null;

  return (
    <section className="rounded-[4px] border border-brand-black/10 bg-white p-6 md:p-7">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-xl text-brand-black">How It Unfolds</h2>
        <span className="text-xs uppercase tracking-luxury text-charcoal/70">Scent Notes</span>
      </div>

      <ol className="mt-6 flex flex-col">
        {tiers.map((tier, i) => (
          <li key={tier.key} className="relative flex gap-5 pb-7 last:pb-0">
            {/* Connector runs between the markers, not past the last one,
                so the column reads as a progression that ends on skin. */}
            {i < tiers.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute top-3 bottom-0 left-[5px] w-px bg-gradient-to-b from-burnt-orange/40 to-champagne/40"
              />
            )}
            <span
              aria-hidden="true"
              className="relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-burnt-orange"
              style={{ opacity: 1 - i * 0.25 }}
            />
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <span className="text-xs uppercase tracking-luxury text-burnt-orange">
                  {tier.label}
                </span>
                <span className="text-xs text-charcoal/70">{tier.gloss}</span>
              </div>
              <p className="font-display text-lg leading-snug text-brand-black">
                {tier.values.join(", ")}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
