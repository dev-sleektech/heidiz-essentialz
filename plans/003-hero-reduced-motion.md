# 003 — Respect reduced motion in the hero entrance

- **Status**: DONE
- **Commit**: eef50f2
- **Severity**: HIGH
- **Category**: 6 — Accessibility
- **Estimated scope**: 1 file, ~10 lines changed
- **Depends on**: nothing

## Problem

`src/components/home/hero.tsx` animates four elements upward on mount, and none of them consult the user's motion preference:

```tsx
/* src/components/home/hero.tsx:44-50 — current */
<motion.span
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  className="text-xs tracking-luxury uppercase text-champagne"
>
```

The same pattern repeats at lines 52 (`motion.h1`, `y: 16`, `delay: 0.1`), 61 (`motion.p`, `y: 16`, `delay: 0.2`) and 71 (`motion.div`, `y: 16`, `delay: 0.3`).

A repo-wide sweep confirms this is the only unguarded motion in the app, and that no JS component checks the preference at all:

```
$ grep -rn "useReducedMotion|prefers-reduced-motion" --include=*.tsx --include=*.ts src
(no results)
```

What makes this the sharpest instance rather than one of many: the two CSS animations in this same hero **are** correctly gated. `src/app/globals.css:94-100` disables the drifting Abuja skyline under `prefers-reduced-motion: reduce`, and `src/app/globals.css:118-122` does the same for the scooter bob. So a user who has asked for reduced motion currently gets a hero where the background correctly holds still and the foreground headline still slides up at them. The page is half-compliant in a way that is more conspicuous than no handling at all.

This is the first view every visitor loads, and vestibular triggers are exactly what this preference exists to prevent.

## Target

Use framer-motion's own `useReducedMotion()` hook and branch the `y` offset to `0`, keeping the opacity fade intact. Reduced motion means dropping position change, not removing all feedback.

```tsx
/* target — src/components/home/hero.tsx, imports */
import { motion, useReducedMotion } from "framer-motion";
```

```tsx
/* target — src/components/home/hero.tsx, inside export function Hero() */
export function Hero() {
  // Reduced motion keeps the fade but drops the upward travel. The hero's
  // CSS skyline drift is gated the same way in globals.css:94.
  const reduceMotion = useReducedMotion();
  const riseSm = reduceMotion ? 0 : 10;
  const rise = reduceMotion ? 0 : 16;
```

Then each element uses the branched value:

```tsx
/* target — the eyebrow, was y: 10 */
initial={{ opacity: 0, y: riseSm }}

/* target — the h1, p and button row, each was y: 16 */
initial={{ opacity: 0, y: rise }}
```

Exact behavior required:

- `animate={{ opacity: 1, y: 0 }}` stays unchanged on all four. When `initial.y` is already `0` the element simply fades with no travel.
- **Durations and delays stay exactly as they are** (`0.6`, and `0.7` with delays `0.1` / `0.2` / `0.3`). This is a marketing hero, where longer timings are legitimate, and retiming it is a separate judgement call that is not part of this plan.
- **Do not add an easing curve.** The absence of one is finding 10 in the audit and is deliberately left open.
- Do not use `motion-safe:` here. That is a CSS-variant tool and these values are JS props.

## Repo conventions to follow

- `hero.tsx` is already `"use client"` (line 1), so a hook needs no directive change.
- framer-motion is imported as `import { motion } from "framer-motion"` (line 3). Extend that existing named import rather than adding a second import statement.
- This is the only file in the repo importing framer-motion, so there is no in-repo exemplar for `useReducedMotion`. The nearest convention to imitate is the CSS one at `src/app/globals.css:94-100`, which keeps the element rendered and removes only the movement. Match that intent.
- Comment style: brief and explanatory, matching `src/components/site/nav-dropdown.tsx:7-12`.

## Steps

1. In `src/components/home/hero.tsx` line 3, change the import to `import { motion, useReducedMotion } from "framer-motion";`.
2. Immediately inside `export function Hero() {` (line 10), add the three lines from the **Target** section: the comment, `const reduceMotion = useReducedMotion();`, `const riseSm = ...`, and `const rise = ...`.
3. Line 46: change `initial={{ opacity: 0, y: 10 }}` to `initial={{ opacity: 0, y: riseSm }}`.
4. Line 54: change `initial={{ opacity: 0, y: 16 }}` to `initial={{ opacity: 0, y: rise }}`.
5. Line 63: same replacement as step 4.
6. Line 72: same replacement as step 4.
7. Change nothing else.

## Boundaries

- Do NOT change any `animate`, `duration` or `delay` value.
- Do NOT add an easing curve or a custom cubic-bezier to these transitions.
- Do NOT convert the framer-motion `y` shorthand to a full transform string. That is finding 10, tracked separately, and doing it here would make this diff impossible to review as an accessibility change.
- Do NOT touch the skyline markup (lines 14-30), the gradient overlays, or `src/components/home/abuja-skyline.tsx`.
- Do NOT modify `globals.css`. Its reduced-motion blocks are already correct.
- Do NOT add dependencies. `useReducedMotion` ships with framer-motion 12.
- If the line numbers or code do not match (drift since commit `eef50f2`), STOP and report.

## Verification

- **Mechanical**: `npx tsc --noEmit` and `npm run build`, both expected to pass. `grep -c "useReducedMotion" src/components/home/hero.tsx` must return 2, one import and one call.
- **Feel check**: run `npm run dev` and open `/`.
  - With normal settings, hard-reload. All four hero elements should still rise and fade in sequence exactly as before. This plan must produce **zero visible change** for a default user, so any difference means something was retimed by accident.
  - In DevTools, Rendering panel, set `prefers-reduced-motion: reduce`, then hard-reload. The headline, eyebrow, paragraph and buttons must **fade in place with no upward travel**. They must still fade, not appear instantly. If they pop in with no transition at all, the opacity was removed along with the movement, which is wrong.
  - With reduced motion still on, confirm the skyline behind the text is frozen. This should already be true and verifies the two systems now agree.
  - Test the real OS setting once, not just the DevTools override: on Windows, Settings, Accessibility, Visual effects, Animation effects off.
- **Done when**: with reduced motion enabled, nothing in the hero translates, everything still fades, and the default experience is pixel-identical to before the change.
