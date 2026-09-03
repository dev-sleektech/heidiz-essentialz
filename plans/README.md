# Animation plans — HEIDIZ Essentialz

Produced by `improve-animations` against commit `eef50f2`.

These plans are self-contained. Each one names its own files, exact values and verification steps, so any agent can execute one without having read the audit or the others. Execute them in the order below.

## Plans

| # | Title | Severity | Category | Files | Status |
|---|---|---|---|---|---|
| [001](001-motion-tokens.md) | Add motion tokens to the Tailwind v4 theme | HIGH | Cohesion & tokens | `src/app/globals.css` | DONE |
| [002](002-button-transition-and-press.md) | Replace `transition-all` on buttons and add press feedback | HIGH | Performance, Physicality | `src/components/ui/button.tsx` | DONE |
| [003](003-hero-reduced-motion.md) | Respect reduced motion in the hero entrance | HIGH | Accessibility | `src/components/home/hero.tsx` | DONE |
| [004](004-gallery-crossfade.md) | Crossfade the product gallery main image | MEDIUM | Missed opportunities | `src/components/shop/product-gallery.tsx` | DONE |

All four executed and verified against the emitted stylesheet on 2026-09-02. `npx tsc --noEmit` and `npm run build` both pass.

### One correction found during execution

Plans 002 and 004 originally specified `duration-press` and `duration-base` as Tailwind utilities. **They are not.** Tailwind v4 has an `--ease-*` theme namespace but no `--duration-*` one, so those two classes were dropped silently — no build error, no type error, the elements simply had no transition duration. Caught by grepping the built CSS in `.next/static/chunks/*.css` for the emitted selectors, not by any mechanical check in the plans.

Both plans now use `duration-(--duration-press)` and `duration-(--duration-base)`, v4's custom-property syntax, verified as `transition-duration:var(--duration-press)` in the output. **Any future plan consuming these tokens must use the parenthesis form.**

The lesson worth keeping: a green `npm run build` does not prove a Tailwind class exists. Verify custom utilities against the emitted CSS.

## Execution order and dependencies

```
001 (tokens)
 ├── 002 (button)      needs --duration-press, --ease-brand
 └── 004 (gallery)     needs --duration-base, --ease-brand

003 (hero a11y)        independent, can run at any point
```

**Run 001 first.** It is the only plan with dependents, and it is the only one that changes no rendered output, so it can be merged with near-zero review risk. 002 and 004 both fail their own step 1 guard if 001 has not landed.

003 touches no shared file and has no token dependency. Run it whenever convenient, including in parallel with the others.

No two plans touch the same file, so there are no merge conflicts between them.

## Why this set

The audit surfaced 10 findings plus 3 missed opportunities. These four were selected on leverage:

- **001** unblocks everything else and replaces a vocabulary that currently does not exist. The repo has a complete color and type system and zero motion tokens.
- **002** touches every click in the application. Buttons currently use `transition-all` at 300ms and the app has no press feedback anywhere (`grep -rn "active:scale" src` returns 0 results).
- **003** closes an accessibility gap on the first view every visitor loads, where the CSS background animations already respect `prefers-reduced-motion` but the foreground headline does not.
- **004** is the highest emotional payoff. Thumbnail selection on a product page currently hard-cuts, on a site whose entire proposition is photography.

## Not addressed

These findings were confirmed at their `file:line` but are not covered by the plans above. They remain open.

| Sev | Location | Finding |
|---|---|---|
| MED | `src/components/ui/accordion.tsx:42` | `{open && ...}` hard mount, FAQ answers pop in with no height or opacity transition |
| MED | `src/components/site/nav-dropdown.tsx:83` | `{open && ...}` hard mount, no `transform-origin`, panel has no spatial relationship to its trigger |
| MED | `src/components/site/header.tsx:149` | Mobile menu appears instantly and shoves page content down |
| MED | `src/components/chat/chat-widget.tsx:237` | Chat panel teleports in above its launcher |
| MED | `src/components/chat/chat-widget.tsx:407` | `hover:scale-105` with no `@media (hover: hover)` gate, fires a false hover on every tap on touch |
| MED | `src/components/ui/product-card.tsx:82` | `transition-all duration-300` on the hover reveal, on grids rendering 12+ cards |
| LOW | `src/components/home/hero.tsx:45,53,62,71` | framer-motion `y` shorthand is not hardware accelerated, runs on the main thread alongside two infinite marquees |

The first four are the same fix pattern applied to four hand-rolled disclosures. Once 001 has landed they collapse into one shared plan rather than four, which is the cheapest way to pick them up later.

Two further missed opportunities, not planned: the add-to-cart confirmation at `src/components/ui/product-card.tsx:24-28` swaps text instantly and reverts after 1500ms, and the product grids in `shop`, `category` and `new-arrivals` render with no stagger.

## Deliberately not reported

Checked and judged correct by design. Do not "fix" these:

- `src/components/shop/product-gallery.tsx:36`, `src/app/blog/page.tsx:29`, `src/components/home/featured-collections.tsx:22` — 500 to 700ms image zooms. Slow zoom is a legitimate editorial choice for this brand. Note that plan 004 does retime the gallery one to 220ms as a stated side effect.
- `src/app/globals.css:77-100` — the `skyline-pan` marquee. `linear` is correct for constant motion, and it is already gated behind `prefers-reduced-motion`.
- `src/app/globals.css:105-122` — the `scooter-bounce` order-status bob. Also already gated.
