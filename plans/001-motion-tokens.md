# 001 — Add motion tokens to the Tailwind v4 theme

- **Status**: DONE
- **Commit**: eef50f2
- **Severity**: HIGH
- **Category**: 7 — Cohesion & tokens
- **Estimated scope**: 1 file, ~15 lines added

## Problem

`src/app/globals.css` defines a complete design system for color, typography and radius, and nothing at all for motion. There is not a single easing or duration token in the file:

```css
/* src/app/globals.css:18-36 — current @theme block, abridged */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);

  --color-burnt-orange: var(--color-burnt-orange);
  /* ...more colors... */

  --font-display: var(--font-playfair);
  --font-serif-alt: var(--font-cormorant);
  --font-sans: var(--font-inter);
  --font-body-alt: var(--font-manrope);

  --radius-button: 14px;
}
```

Because there is no shared vocabulary, every animated component hand-types its own values, and they do not agree. Current durations found across the app: `duration-300` (4 sites), `duration-500` (2 sites), `duration-700` (1 site), plus several bare `transition-colors` and `transition-transform` with no duration at all, which silently fall back to Tailwind's 150ms default.

This plan adds nothing visible on its own. It exists so plans 002, 003 and 004 have tokens to reference instead of inventing more one-off values.

## Target

Add a `@theme` block defining three easing curves and a four-step duration scale. Values are exact and must not be altered:

```css
/* target — add to src/app/globals.css */
@theme {
  /* Motion curves. Strong custom easings; the CSS built-ins are too weak
     for deliberate motion. See plans/README.md for which to use when. */
  --ease-brand: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-brand-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);

  /* Duration scale. UI motion stays under 300ms. */
  --duration-press: 160ms;
  --duration-fast: 180ms;
  --duration-base: 220ms;
  --duration-slow: 280ms;
}
```

In Tailwind v4 the three curves generate real utilities: `ease-brand`, `ease-brand-in-out`, `ease-drawer`.

### The durations do NOT generate utilities — this bit off

Tailwind v4 has an `--ease-*` theme namespace but **no `--duration-*` namespace**. Declaring `--duration-press` in `@theme` emits the CSS variable but generates no `duration-press` class, and Tailwind drops unknown utilities **silently** with no build error. Verified against the emitted stylesheet on this repo: only `.duration-300`, `.duration-500` and `.duration-700` exist as selectors.

Consume the duration tokens with v4's custom-property syntax instead:

```
duration-(--duration-press)     ✅ compiles to transition-duration: var(--duration-press)
duration-press                  ❌ silently dropped, element gets no duration
```

The `@theme` block above is still correct as written — the variables emit and resolve fine. Only the consumption syntax differs from the curves.

### Why these token names and not `--ease-out`

Tailwind v4 ships a built-in `--ease-out` (`cubic-bezier(0, 0, 0.2, 1)`). Redefining `--ease-out` in `@theme` **overrides the built-in globally**, which would silently retime `src/components/shop/product-gallery.tsx:36`, where a deliberate 700ms editorial image zoom already uses `ease-out`. That zoom is intentional and out of scope. Prefixing the new curves with `brand` avoids the collision. Do not rename them.

## Repo conventions to follow

- All theme tokens live in `src/app/globals.css`. There is no separate tokens file, do not create one.
- The file already uses two blocks: a plain `:root` for raw brand values (`src/app/globals.css:3-16`) and `@theme inline` for Tailwind-facing tokens (`src/app/globals.css:18-36`).
- **Use a separate plain `@theme` block, not `@theme inline`.** `inline` exists so tokens can reference `var(--background)` and resolve at use site. Motion tokens are literal values with no indirection, so plain `@theme` is correct.
- Exemplar for comment style: `src/app/globals.css:73-75`, where the skyline keyframes carry a short explanatory comment above them. Match that register, brief and factual.

## Steps

1. Open `src/app/globals.css`.
2. Insert a new `@theme { ... }` block immediately after the closing brace of the existing `@theme inline` block (currently line 36) and before the `body {` rule (currently line 38). Use the exact block from the **Target** section above, comments included.
3. Do not modify the existing `:root` or `@theme inline` blocks.

## Boundaries

- Do NOT change any component file. This plan is `globals.css` only.
- Do NOT apply the new tokens anywhere yet. Plans 002, 003 and 004 do that.
- Do NOT rename the tokens or alter any cubic-bezier or duration value.
- Do NOT remove or retime the existing `skyline-pan` or `scooter-bounce` keyframes.
- Do NOT add dependencies.
- If `globals.css` no longer matches the excerpts above (drift since commit `eef50f2`), STOP and report rather than improvising.

## Verification

- **Mechanical**: run `npx tsc --noEmit` (expect no new errors) and `npm run build` (expect success). A malformed `@theme` block fails the Tailwind build loudly, so a green build is a real signal here.
- **Feel check**: none. This plan changes no rendered output. Confirming that is the point.
- **Done when**:
  - `grep -c "ease-brand" src/app/globals.css` returns 2.
  - Adding `class="duration-(--duration-base)"` to any element resolves to `transition-duration: 220ms` in the computed styles panel. Note the parenthesis syntax — plain `duration-base` resolves to nothing.
  - `git diff --stat` shows exactly one file changed.
