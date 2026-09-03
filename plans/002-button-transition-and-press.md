# 002 — Replace `transition-all` on buttons and add press feedback

- **Status**: DONE
- **Commit**: eef50f2
- **Severity**: HIGH
- **Category**: 5 — Performance, and 3 — Physicality & origin
- **Estimated scope**: 1 file, 2 lines changed
- **Depends on**: plan 001 (needs `duration-press` and `ease-brand`)

## Problem

Two problems in one file, both on the most-clicked element in the entire site.

**1. `transition-all` on both button components.**

```tsx
/* src/components/ui/button.tsx:32 — current (Button) */
"inline-flex items-center justify-center gap-2 rounded-button font-medium tracking-wide transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
```

```tsx
/* src/components/ui/button.tsx:62 — current (ButtonLink) */
"inline-flex items-center justify-center gap-2 rounded-button font-medium tracking-wide transition-all duration-300",
```

`transition-all` animates every animatable property, including `box-shadow`. The `primary` variant carries `shadow-[0_8px_24px_-8px_rgba(181,83,30,0.55)]` (`src/components/ui/button.tsx:7`), so every hover repaints a 24px blurred shadow off the GPU rather than compositing a transform. It also animates properties nobody intended, which is why `transition: all` is a finding on sight.

Separately, 300ms is too slow for a hover color change. The budget for this class of feedback is 100 to 160ms. At 300ms the button visibly lags the cursor.

**2. No press feedback anywhere in the application.**

A repo-wide sweep returns zero results:

```
$ grep -rn "active:scale" --include=*.tsx src | wc -l
0
```

Nothing in this app responds to being pressed. On a luxury e-commerce site where the primary actions are "Add to Cart" and "Checkout", the click target giving no physical acknowledgement is the single most common way a site reads as cheap regardless of how good the typography is.

## Target

```tsx
/* target — src/components/ui/button.tsx:32 (Button) */
"inline-flex items-center justify-center gap-2 rounded-button font-medium tracking-wide transition-[background-color,border-color,color,transform] duration-(--duration-press) ease-brand motion-safe:active:scale-[0.97] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
```

```tsx
/* target — src/components/ui/button.tsx:62 (ButtonLink) */
"inline-flex items-center justify-center gap-2 rounded-button font-medium tracking-wide transition-[background-color,border-color,color,transform] duration-(--duration-press) ease-brand motion-safe:active:scale-[0.97]",
```

Exact values, do not substitute:

- Transitioned properties: `background-color`, `border-color`, `color`, `transform`. **`box-shadow` is deliberately excluded** so the primary variant's shadow stays static instead of repainting on every hover.
- Duration: `duration-(--duration-press)`, which resolves to `160ms` from plan 001.
- Easing: `ease-brand`, which is `cubic-bezier(0.23, 1, 0.32, 1)` from plan 001.
- Press scale: `0.97`. Do not use a smaller value. Below 0.95 reads as a toy.
- The `motion-safe:` prefix is required. It compiles to `@media (prefers-reduced-motion: no-preference)`, so the press transform is dropped for users who ask for reduced motion while all color feedback survives. This is the correct reading of reduced motion: fewer and gentler, not zero.

## Repo conventions to follow

- This file uses a `variantClasses` / `sizeClasses` record merged through `cn()` (`src/components/ui/button.tsx:6-19`). The shared base string is the first argument to `cn()`. Motion belongs in that base string so both variants and all sizes inherit it. Do not add motion classes to individual variants.
- `Button` (line 27) and `ButtonLink` (line 51) intentionally duplicate their base string rather than sharing a constant. **Preserve that duplication.** Extracting a shared constant is a refactor, not this plan.
- Exemplar of a correctly scoped transition already in the repo: `src/components/ui/product-card.tsx:63` uses `transition-opacity duration-300` and names the single property it animates rather than reaching for `all`.

## Steps

1. Confirm plan 001 is applied. `grep -c "duration-press" src/app/globals.css` must return 1. If it returns 0, STOP, plan 001 is a prerequisite.
2. In `src/components/ui/button.tsx` line 32, replace `transition-all duration-300` with `transition-[background-color,border-color,color,transform] duration-(--duration-press) ease-brand motion-safe:active:scale-[0.97]`. Leave the rest of the string, including `cursor-pointer` and the `disabled:` classes, exactly as it is.
3. In `src/components/ui/button.tsx` line 62, apply the identical replacement.
4. Change nothing else in the file.

## Boundaries

- Do NOT touch `variantClasses` or `sizeClasses`.
- Do NOT extract the duplicated base string into a shared constant.
- Do NOT add `active:` or `hover:` states to any other component. The two other `transition-all` sites (`src/app/account/orders/page.tsx:51` and `src/app/gift-cards/page.tsx:36`) are hand-rolled buttons that do not use this component and are **out of scope for this plan**.
- Do NOT change `src/components/ui/product-card.tsx:82`, which is finding 9 and is not part of this plan.
- Do NOT add dependencies.
- If line 32 or 62 does not match the excerpts above (drift since commit `eef50f2`), STOP and report.

## Verification

- **Mechanical**: `npx tsc --noEmit` and `npm run build`, both expected to pass. `grep -c "transition-all" src/components/ui/button.tsx` must return 0.
- **Feel check**: run `npm run dev` and open `/` (the hero has both a `primary` and an `outline` ButtonLink at `src/components/home/hero.tsx:76-88`), then:
  - Press and hold a button. It should visibly shrink slightly and hold at the smaller size, then spring back on release. If it does not hold while the mouse is down, the `active:` variant is not applying.
  - Hover on and off repeatedly. The color change should now feel like it tracks the cursor rather than trailing it.
  - Watch the `primary` button's orange drop shadow during hover. It must stay completely static. Any visible shadow animation means `box-shadow` is still being transitioned.
  - Open DevTools, Animations panel, set playback speed to 10%, then press a button. Confirm the scale animates and the shadow does not.
  - In DevTools, Rendering panel, set `prefers-reduced-motion: reduce`. Press a button again. The scale must be gone entirely while the hover color change still works.
- **Done when**: both lines carry the new classes, no `transition-all` remains in the file, and press feedback is visible on desktop and absent under reduced motion.
