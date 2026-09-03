// Shared form field styling. These two strings were copy-pasted into seven
// files (checkout, contact, order tracking, search, and both admin forms),
// so a change to the focus ring or border had to be made seven times and
// had already drifted in a couple of them.
//
// The charcoal opacities here follow the site-wide text contrast scale
// documented in globals.css: /70 and /80 are the only tiers that clear
// WCAG AA on ivory or white. The placeholder was /40 (2.26:1) and the
// label /60 (3.79:1) until 2026-09-03; both failed.
export const inputClass =
  "w-full rounded-button border border-brand-black/15 bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-charcoal/70 focus:outline-none focus:ring-2 focus:ring-burnt-orange";

export const labelClass = "text-xs uppercase tracking-wide text-charcoal/80";
