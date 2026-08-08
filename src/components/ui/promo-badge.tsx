// Original tag-shaped promo badges — a real price-tag silhouette (angled
// point + punched hole) via clip-path, one per occasion badge value, built
// from scratch rather than any stock graphic. New/Best Seller/Limited keep
// the plain pill elsewhere; these are only for the promo-specific badges.
type PromoBadgeTheme = {
  gradient: string;
  dotColor: string;
  label: string;
  prefix?: string;
};

const THEMES: Record<string, PromoBadgeTheme> = {
  Sale: {
    gradient: "linear-gradient(135deg, #D9642C 0%, #B5531E 100%)",
    dotColor: "#F8F6F2",
    label: "SALE",
  },
  "Black Friday": {
    gradient: "linear-gradient(135deg, #2B2B2B 0%, #000000 100%)",
    dotColor: "#E8C9A0",
    label: "BLACK FRIDAY",
  },
  "Valentine's Day": {
    gradient: "linear-gradient(135deg, #E8536E 0%, #C0334F 100%)",
    dotColor: "#F8F6F2",
    label: "VALENTINE'S",
    prefix: "♥ ",
  },
  Christmas: {
    gradient: "linear-gradient(135deg, #B5182B 0%, #7A0F1D 100%)",
    dotColor: "#E8C9A0",
    label: "CHRISTMAS",
    prefix: "✦ ",
  },
};

function PromoTag({
  theme,
  discountPercent,
  className,
}: {
  theme: PromoBadgeTheme;
  discountPercent?: number;
  className?: string;
}) {
  const text = discountPercent ? `${theme.prefix ?? ""}-${discountPercent}% ${theme.label}` : `${theme.prefix ?? ""}${theme.label}`;

  // `className` (e.g. "absolute top-3 right-0") controls placement in the
  // caller's layout, kept on its own outer wrapper rather than merged into
  // the tag's own classes below — both would otherwise set a conflicting
  // `position` value on the same element, which Tailwind doesn't resolve
  // by className order, so whichever wins is unpredictable. The inner
  // div's own `relative` (needed as the containing block for the
  // hole-punch dot) stays safe from that clash this way.
  return (
    <div className={className}>
      <div
        className="relative flex items-center gap-1 whitespace-nowrap py-1.5 pl-5 pr-3 text-[0.65rem] font-semibold tracking-wide text-white shadow-sm"
        style={{ background: theme.gradient, clipPath: "polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)" }}
      >
        <span
          className="absolute left-[7px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: theme.dotColor }}
          aria-hidden="true"
        />
        {text}
      </div>
    </div>
  );
}

export function SaleBadge({ discountPercent, className }: { discountPercent?: number; className?: string }) {
  return <PromoTag theme={THEMES.Sale} discountPercent={discountPercent} className={className} />;
}

export function BlackFridayBadge({ discountPercent, className }: { discountPercent?: number; className?: string }) {
  return <PromoTag theme={THEMES["Black Friday"]} discountPercent={discountPercent} className={className} />;
}

export function ValentinesBadge({ discountPercent, className }: { discountPercent?: number; className?: string }) {
  return <PromoTag theme={THEMES["Valentine's Day"]} discountPercent={discountPercent} className={className} />;
}

export function ChristmasBadge({ discountPercent, className }: { discountPercent?: number; className?: string }) {
  return <PromoTag theme={THEMES.Christmas} discountPercent={discountPercent} className={className} />;
}

// Renders the right themed tag for any of the four promo badge values, or
// null for non-promo badges (New/Best Seller/Limited — callers fall back
// to their own plain pill for those).
export function PromoBadge({
  badge,
  discountPercent,
  className,
}: {
  badge?: string;
  discountPercent?: number;
  className?: string;
}) {
  if (!badge || !THEMES[badge]) return null;
  return <PromoTag theme={THEMES[badge]} discountPercent={discountPercent} className={className} />;
}

// Lets callers pick the plain pill vs the tag graphic for whatever badge
// value a product has, without duplicating the theme name list themselves.
export function isPromoBadge(badge?: string): boolean {
  return Boolean(badge && THEMES[badge]);
}

export function computeDiscountPercent(price: number, compareAtPrice?: number): number | undefined {
  if (!compareAtPrice || compareAtPrice <= price) return undefined;
  return Math.round((1 - price / compareAtPrice) * 100);
}
