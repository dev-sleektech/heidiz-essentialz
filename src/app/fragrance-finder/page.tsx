import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, RotateCcw } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";
import { ProductVisual } from "@/components/ui/product-visual";
import { formatNaira } from "@/lib/format";
import { getProductsByCategory } from "@/lib/products";
import {
  matchFragrances,
  SCENT_FAMILY_OPTIONS,
  BUDGET_OPTIONS,
  OCCASION_OPTIONS,
  type ScentFamily,
  type Budget,
  type Occasion,
} from "@/lib/fragrance-finder";

export const metadata: Metadata = {
  title: "Fragrance Finder",
  description: "Answer a few questions and find your next signature scent from our real perfume collection.",
};

const fieldsetClass = "flex flex-col gap-3";
const legendClass = "font-display text-lg text-brand-black";
const optionClass =
  "flex cursor-pointer flex-col gap-0.5 rounded-button border border-brand-black/15 bg-white px-4 py-3 text-sm has-[:checked]:border-burnt-orange has-[:checked]:bg-champagne/20";

export default async function FragranceFinderPage(props: PageProps<"/fragrance-finder">) {
  const searchParams = await props.searchParams;
  const family = typeof searchParams.family === "string" ? (searchParams.family as ScentFamily) : undefined;
  const budget = typeof searchParams.budget === "string" ? (searchParams.budget as Budget) : undefined;
  const occasion = typeof searchParams.occasion === "string" ? (searchParams.occasion as Occasion) : undefined;
  const hasAnswers = Boolean(family && budget && occasion);

  const matches =
    family && budget && occasion
      ? matchFragrances(await getProductsByCategory("perfumes"), { family, budget, occasion })
      : [];

  return (
    <>
      <CollectionHeader
        eyebrow="Find Your Scent"
        title="Fragrance Finder"
        description="Answer three quick questions and we'll match you to your next signature scent from our real collection."
        crumbs={[{ label: "Fragrance Finder" }]}
      />

      <Container className="py-12 md:py-16">
        {!hasAnswers ? (
          <form method="GET" className="mx-auto flex max-w-xl flex-col gap-10">
            <fieldset className={fieldsetClass}>
              <legend className={legendClass}>What kind of scent draws you in?</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SCENT_FAMILY_OPTIONS.map((opt) => (
                  <label key={opt.value} className={optionClass}>
                    <span className="flex items-center gap-2">
                      <input required type="radio" name="family" value={opt.value} className="accent-burnt-orange" />
                      <span className="font-medium text-brand-black">{opt.label}</span>
                    </span>
                    <span className="pl-6 text-xs text-charcoal/50">{opt.description}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className={fieldsetClass}>
              <legend className={legendClass}>What&apos;s your budget?</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {BUDGET_OPTIONS.map((opt) => (
                  <label key={opt.value} className={optionClass}>
                    <span className="flex items-center gap-2">
                      <input required type="radio" name="budget" value={opt.value} className="accent-burnt-orange" />
                      <span className="font-medium text-brand-black">{opt.label}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className={fieldsetClass}>
              <legend className={legendClass}>What&apos;s the occasion?</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {OCCASION_OPTIONS.map((opt) => (
                  <label key={opt.value} className={optionClass}>
                    <span className="flex items-center gap-2">
                      <input required type="radio" name="occasion" value={opt.value} className="accent-burnt-orange" />
                      <span className="font-medium text-brand-black">{opt.label}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-button bg-burnt-orange px-8 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" strokeWidth={1.5} />
              Find My Scent
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-brand-black">
                {matches.length > 0 ? "Your Matches" : "No Perfect Match Found"}
              </h2>
              <Link
                href="/fragrance-finder"
                className="inline-flex items-center gap-1.5 text-sm text-burnt-orange hover:underline"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                Retake Quiz
              </Link>
            </div>

            {matches.length === 0 && (
              <p className="text-sm text-charcoal/60">
                We couldn&apos;t find a close match for that combination. Try widening your budget, or{" "}
                <Link href="/category/perfumes" className="text-burnt-orange hover:underline">
                  browse the full perfume collection
                </Link>
                .
              </p>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {matches.map(({ product, reasons }) => (
                <Link
                  key={product.slug}
                  href={`/product/${product.slug}`}
                  className="group flex flex-col gap-3 rounded-[4px] border border-brand-black/10 bg-white p-3 transition-shadow hover:shadow-md"
                >
                  <ProductVisual icon={product.icon} src={product.image} className="aspect-square w-full" />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wide text-charcoal/50">{product.category}</span>
                    <h3 className="font-display text-base text-brand-black">{product.name}</h3>
                    <span className="text-sm font-medium text-burnt-orange">{formatNaira(product.price)}</span>
                    {reasons[0] && <p className="mt-1 text-xs text-charcoal/50">{reasons[0]}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
