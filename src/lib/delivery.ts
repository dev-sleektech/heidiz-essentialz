// Shared delivery pricing logic, kept in one place so the promo banner,
// cart, and checkout summary can't drift out of sync.
export const FREE_DELIVERY_THRESHOLD = 150000;
export const STANDARD_DELIVERY_FEE = 3500;

// getDeliveryFee(subtotal) stays exactly as it was — used wherever the
// customer's state isn't known yet (cart page, header promo banner). Once
// checkout collects a state, getDeliveryEstimate() below gives a real
// zone-based fee + ETA instead of this one flat guess.
export function getDeliveryFee(subtotal: number) {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
}

// Zone-based delivery pricing (2026-08-16): scoped down from a vague "AI
// automated delivery" ask via AskUserQuestion — real distance-based pricing
// would need a geocoding/mapping API (a genuine engineering decision, not
// an AI one; asking an LLM to estimate distance from a text address would
// be unreliable), so this is the simpler, honest version: zone tiers keyed
// off the State dropdown already collected at checkout. No new account,
// no per-request cost, roughly as accurate as most Nigerian e-commerce
// delivery pricing gets without a real logistics partner.
//
// Fees/ETAs below are a reasonable starting point anchored to the existing
// flat ₦3,500, not confirmed per-zone pricing from the client — same
// "make a decision, client corrects later" approach already used for
// perfume pricing in this project. Edit here if the real numbers differ.
type DeliveryZone = "abuja" | "major" | "other";

const ABUJA_STATE = "FCT - Abuja";

// States from the checkout page's own NIGERIAN_STATES list that have
// decent courier/logistics coverage — everything else (including "Other")
// falls into the slower, pricier "other" zone.
const MAJOR_STATES = new Set(["Lagos", "Rivers", "Kano", "Oyo", "Kaduna", "Enugu", "Delta", "Ogun", "Anambra"]);

const ZONE_CONFIG: Record<DeliveryZone, { fee: number; etaLabel: string }> = {
  abuja: { fee: 2500, etaLabel: "Same day to 1 business day" },
  major: { fee: 4000, etaLabel: "2 to 4 business days" },
  other: { fee: 6000, etaLabel: "4 to 7 business days" },
};

function resolveZone(state: string): DeliveryZone {
  if (state === ABUJA_STATE) return "abuja";
  if (MAJOR_STATES.has(state)) return "major";
  return "other";
}

export function getDeliveryEstimate(subtotal: number, state: string): { fee: number; etaLabel: string; zone: DeliveryZone } {
  const zone = resolveZone(state);
  const { fee, etaLabel } = ZONE_CONFIG[zone];
  return { fee: subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : fee, etaLabel, zone };
}
