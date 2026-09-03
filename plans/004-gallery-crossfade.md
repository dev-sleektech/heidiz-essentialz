# 004 — Crossfade the product gallery main image

- **Status**: DONE
- **Commit**: eef50f2
- **Severity**: MEDIUM (highest emotional payoff on the list)
- **Category**: 8 — Missed opportunities
- **Estimated scope**: 1 file, ~25 lines changed
- **Depends on**: plan 001 (needs `duration-base` and `ease-brand`)

## Problem

`src/components/shop/product-gallery.tsx` renders one `<Image>` whose `src` is swapped by index:

```tsx
/* src/components/shop/product-gallery.tsx:29-41 — current */
<div className="group relative aspect-square w-full overflow-hidden rounded-[4px] bg-ivory md:aspect-[4/5]">
  <Image
    src={gallery[active] ?? stockImages[icon]}
    alt={name}
    fill
    sizes="(min-width: 1024px) 50vw, 100vw"
    priority
    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
  />
  <div className="absolute inset-0 border border-brand-black/10" />
</div>
```

```tsx
/* src/components/shop/product-gallery.tsx:47 — the trigger */
onClick={() => setActive(i)}
```

Changing `src` on a mounted image element is a hard cut. The old photo is replaced the instant the new one decodes, with no transition, and on a slow connection the frame can go briefly blank first.

This is the primary interaction on a product page for a brand selling perfume, jewellery and handbags, where the photography *is* the product. Every other surface on this site has been given editorial care. The one moment a customer deliberately asks to see more is the one moment that behaves like a plain image swapper.

The thumbnail strip itself is fine. `src/components/shop/product-gallery.tsx:52-56` already transitions its border with `transition-colors`. Only the main image needs work.

## Target

Stack every image the user has actually viewed in the same box and crossfade between them with opacity. Opacity is GPU-composited, and because this is a CSS **transition** rather than a keyframe animation it retargets mid-flight, so clicking rapidly through thumbnails blends smoothly instead of restarting.

Only images that have been selected at least once are mounted. This preserves lazy loading: a 10-photo product still ships one image on first paint.

```tsx
/* target — src/components/shop/product-gallery.tsx, state */
const [active, setActive] = useState(0);
// Only mount photos the shopper has actually opened, so a 10-image product
// still loads one image on first paint. Once mounted a photo stays mounted,
// which is what lets the opacity transition crossfade in both directions.
const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));

function show(i: number) {
  setSeen((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
  setActive(i);
}
```

```tsx
/* target — src/components/shop/product-gallery.tsx, the main image box */
<div className="group relative aspect-square w-full overflow-hidden rounded-[4px] bg-ivory md:aspect-[4/5]">
  {gallery.map((photo, i) =>
    seen.has(i) ? (
      <Image
        key={photo + i}
        src={photo ?? stockImages[icon]}
        alt={i === active ? name : ""}
        aria-hidden={i !== active}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        priority={i === 0}
        className={cn(
          "object-cover transition-[opacity,transform] duration-(--duration-base) ease-brand group-hover:scale-105",
          i === active ? "opacity-100" : "opacity-0"
        )}
      />
    ) : null
  )}
  <div className="absolute inset-0 border border-brand-black/10" />
</div>
```

Exact values and decisions, do not substitute:

- Duration `duration-(--duration-base)` = `220ms` from plan 001. Long enough to read as a dissolve, short enough to stay under the 300ms UI ceiling.
- Easing `ease-brand` = `cubic-bezier(0.23, 1, 0.32, 1)` from plan 001.
- `priority` moves from "always" to `i === 0` only. Marking every stacked image as priority would defeat the lazy loading this design exists to preserve.
- `alt` is the product name on the active image and empty on the inactive ones, with `aria-hidden` on the inactive ones. Without this a screen reader announces the product name once per mounted photo.
- **The hover zoom keeps `group-hover:scale-105` but loses its own `duration-700 ease-out`**, because one `transition-` utility now covers both opacity and transform on the same element. The zoom therefore speeds up from 700ms to 220ms. This is an intentional, visible change and is called out in the feel check below. If you would rather keep the slow zoom, that requires splitting the transition across two elements, which is out of scope for this plan, so do not attempt it.
- **No `prefers-reduced-motion` gating.** A crossfade is opacity only with no position change, which is exactly the kind of transition the reduced-motion guidance says to keep. Do not add `motion-safe:` here.
- No blur masking. Two photos of one product on a shared ivory ground dissolve cleanly without it, and transition-time `filter: blur()` is expensive.

## Repo conventions to follow

- The file is already `"use client"` (line 1) and already imports `cn` from `@/lib/utils` (line 6), which it uses for the thumbnail border at line 51. Use `cn()` for the conditional opacity the same way.
- `gallery` is derived at line 25 and must not change: `const gallery = images.length > 0 ? images : src ? [src] : [stockImages[icon]];`
- Exemplar of the exact conditional-class pattern to imitate, three lines below your edit:

```tsx
/* src/components/shop/product-gallery.tsx:50-54 */
className={cn(
  "relative h-16 w-16 shrink-0 overflow-hidden rounded-[4px] border transition-colors",
  active === i ? "border-burnt-orange" : "border-brand-black/10 hover:border-brand-black/30"
)}
```

## Steps

1. Confirm plan 001 is applied. `grep -c "duration-base" src/app/globals.css` must return 1. If it returns 0, STOP.
2. In `src/components/shop/product-gallery.tsx`, directly below `const [active, setActive] = useState(0);` (line 26), add the `seen` state and the `show` function from the **Target** section, comment included.
3. Replace the single `<Image>` block (lines 30-40) with the `gallery.map(...)` block from the **Target** section. Leave the wrapping `<div className="group relative ...">` and the trailing border div untouched.
4. At line 47, change the thumbnail handler from `onClick={() => setActive(i)}` to `onClick={() => show(i)}`.
5. Change nothing else.

## Boundaries

- Do NOT change the thumbnail strip's markup, sizing, or its `transition-colors` border treatment beyond the one `onClick` swap in step 4.
- Do NOT change the `gallery` derivation at line 25 or the `aspect-square` / `md:aspect-[4/5]` box.
- Do NOT add `AnimatePresence` or import framer-motion into this file. CSS transitions are the correct tool for predetermined motion and are what makes this interruptible.
- Do NOT add a blur filter.
- Do NOT preload all gallery images, and do NOT set `priority` on more than index 0.
- Do NOT add dependencies.
- If the code does not match the excerpts above (drift since commit `eef50f2`), STOP and report.

## Verification

- **Mechanical**: `npx tsc --noEmit` and `npm run build`, both expected to pass. TypeScript will catch a malformed `Set<number>` initializer, which is the likeliest slip in step 2.
- **Feel check**: run `npm run dev` and open a product page that has more than one photo (`/product/<slug>`, seeded via `/admin`). If no multi-image product exists, add a second photo to one through the admin product form first.
  - Click a thumbnail. The main image must dissolve, not cut. The old photo fades out as the new one fades in.
  - Click rapidly between three thumbnails. It should blend continuously with no flicker and no restart from blank. A visible restart means a keyframe animation crept in instead of a transition.
  - Click a thumbnail you have already viewed. It should crossfade the same way in reverse, confirming mounted photos stay mounted.
  - Open the Network panel, hard-reload the product page, filter to Img. Exactly **one** gallery photo should load. Click a thumbnail and confirm the second loads only then.
  - DevTools, Animations panel, playback 10%, click a thumbnail. Confirm both images are visible mid-transition and neither jumps in position.
  - Hover the main image and confirm the zoom now runs at 220ms rather than 700ms. This is expected. Confirm you find it acceptable, and if not, reopen this plan rather than patching around it.
  - Tab to a thumbnail and press Enter. The crossfade must behave identically to a click.
- **Done when**: thumbnail selection dissolves in both directions, only viewed photos are ever fetched, and rapid clicking never produces a flash or a hard cut.
