// Shared form field styling. These two strings were copy-pasted into seven
// files (checkout, contact, order tracking, search, and both admin forms),
// so a change to the focus ring or border had to be made seven times and
// had already drifted in a couple of them.
export const inputClass =
  "w-full rounded-button border border-brand-black/15 bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-burnt-orange";

export const labelClass = "text-xs uppercase tracking-wide text-charcoal/60";
