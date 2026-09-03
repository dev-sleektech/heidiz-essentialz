---
target: HEIDIZ Essentialz storefront UI/UX
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:C:\\Users\\HP\\Projects\\heidiz-essentialz\\src\\app\\page.tsx"
target_fingerprint: "sha256:eeaa47da25b1f706df52741f65b368c006fca4a30a377574389562f66a783ed5"
target_path: "C:\\Users\\HP\\Projects\\heidiz-essentialz\\src\\app\\page.tsx"
timestamp: 2026-09-03T10-10-17Z
slug: src-app-page-tsx
---
Method: dual-agent (A: design review, isolated - B: detector + mechanical evidence, isolated)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | ProductCatalogProvider exposes a `loading` flag no consumer reads; zero loading.tsx files exist |
| 2 | Match System / Real World | 3 | Naira, Nigerian states, POD, WhatsApp correct. "Fresh from the atelier" is borrowed register |
| 3 | User Control and Freedom | 3 | No undo on cart removal; qty caps silently at 10 |
| 4 | Consistency and Standards | 3 | 3 buttons bypass the Button primitive; inputs get a designed focus ring, buttons don't |
| 5 | Error Prevention | 2 | "Pay on Delivery (FCT-Abuja only)" enforced in a label, not in code |
| 6 | Recognition Rather Than Recall | 2 | Bank-transfer/POD order numbers exist only in React state, yet tracking demands them verbatim |
| 7 | Flexibility and Efficiency | 2 | Sort only, no filters, no pagination; shop renders the entire catalog |
| 8 | Aesthetic and Minimalist Design | 2 | 147 text instances fail WCAG AA; homepage is 7 identical py-20 md:py-28 sections |
| 9 | Error Recognition and Recovery | 3 | Checkout error renders far from the radios that caused it |
| 10 | Help and Documentation | 3 | Bank transfer offered with no explanation of what happens next |
| **Total** | | **25/40** | Needs work |

## Design Specificity Verdict

Grounded in three places, interchangeable everywhere else - and the specificity is all in the chrome, never the merchandising. Non-transferable: the hand-authored Zuma Rock / Aso Rock SVG parallaxed at two speeds, zone-based delivery keyed to FCT vs major-state, Pay on Delivery, the WhatsApp handoff, "In stock, ready to ship from Abuja". Strip those and a competent interchangeable luxury-ecom skin remains.

Nothing in the visual language knows it is selling smell. fragranceNotes exists in the schema with top/heart/base - the most differentiating content owned - and renders as a collapsed accordion below the fold, while the product description prints twice at full size (product/[slug]/page.tsx:63 and :218). Hierarchy is inverted for the category.

Deterministic scan: 1 finding across 91 files - bounce-easing at globals.css:115. Assessed as a FALSE POSITIVE: ease-in-out, symmetric 3px bob, no overshoot, already wrapped in prefers-reduced-motion. Rule matched the identifier name.

Visual overlays: unavailable, no browser automation exposed. All findings source-derived with file:line.

## Overall Impression

A well-engineered store with a presentation-layer accessibility problem and two commerce paths that quietly lie to the customer. The money path is serious work. The customer-facing surface has 147 instances of text below WCAG AA, and two of four payment methods end on "Order Confirmed" for an order nobody has paid.

Biggest opportunity: the specificity is already owned. Promote fragrance notes, Abuja provenance and trust signals out of the fine print and into the hierarchy. Refinement, not redesign.

## What's Working

1. The money path. Client totals never trusted as proof of payment; verifyLines re-prices server-side and compares against what was charged (checkout/page.tsx:166-196). unitPrice snapshotted at add-time. Tracking matches order number AND normalized phone.
2. Two mobile bugs found by someone actually holding a phone. product-card.tsx:76-82 - hover-reveal add-to-cart sat above the full-cover nav link; since hover never fires on touch, every tap in that region became an add-to-cart instead of navigation.
3. The 1600ms confirmation beat converts an instant state flip into a felt transaction. Peak and end coincide.

## Priority Issues

### [P0] Cart and checkout claim to be empty while the catalog loads

ProductCatalogProvider exposes `loading` and no consumer reads it - cart/page.tsx:39, checkout/page.tsx:45, wishlist/page.tsx:13 destructure getProduct only. Until the fetch resolves resolvedLines is [], so the page renders "Your cart is empty" while the header badge shows the real count. /api/products has no revalidate and no cache headers, and returns full description/benefits/directions/ingredients the client never reads.

Fix: require !loading before the empty state; render skeletons when loading && lines.length > 0. Add revalidate; trim payload to the seven fields used. -> /impeccable optimize

### [P0] 147 text instances fail WCAG AA contrast, including the checkout trust sentence

text-charcoal/50 = 2.90:1 (77 occurrences), /40 = 2.26:1 (38), /60 = 3.79:1 (32). Two propagate from shared source: form-styles.ts:6 (every placeholder) and form-styles.ts:8 (every label, 12px). Both assessments converged on checkout/page.tsx:411 - the Paystack security reassurance - independently flagged as hidden fine print and measured at 2.90:1.

Fix: raise /40 and /50 tiers to /70 (5.06:1) as the body floor; promote the security note above the payment radios with champagne/20. -> /impeccable audit

### [P1] Bank transfer and POD end on "Order Confirmed" for an unpaid order

completeOrder(form, makeOrderNumber(), false) goes straight to a screen headed "Order Confirmed" with no account number, bank name or amount, and sendEmailReceipt:false means the order number lives only in React state - yet /order-tracking requires it verbatim. Separately POD is selectable from any state: checkout/page.tsx:141 branches with no state check.

Fix: "Order Received" for non-card methods; bank details inline under the selected radio and repeated on confirmation; send receipt whenever an email exists; disable POD when state is not "FCT - Abuja". -> /impeccable harden

### [P1] Fabricated reviews are wired into structured data

product-reviews.tsx:8-12 cycles productReviewPool from the file whose header says nothing in it is real business data. Every product shows the same three fake reviews with names and cities. product/[slug]/page.tsx:139-147 emits aggregateRating into JSON-LD from seeded numbers - a documented structured-data violation with manual-action risk.

Fix: gate both on real rows; honest empty state with the WhatsApp link. -> /impeccable harden

### [P2] Two card options named after payment processors

"Pay with Card (Paystack)" and "Pay with Card (Monnify)" presented as separate customer choices - an implementation detail promoted to a customer decision at peak anxiety.

Fix: three visible options; default one processor, surface the other as a fallback on error. -> /impeccable distill

## Persona Red Flags

Jordan (First-Timer, mobile, slow 3G, unfamiliar brand):

- First screen has no product and no reason to trust you: min-h-[92vh] of black ground and animated SVG. Every trust signal is in the footer.
- Search hidden below 640px (header.tsx:115 uses hidden sm:inline-flex). Fragrance buyers search by name.
- Four header icon links are 20x20px with no padding class - half the 44px minimum, in the sticky header.
- Chat bubble fixed bottom-5 right-5 z-50, over where the full-width Place Order button lands on a phone.

Alex (Returning buyer):

- No filters, no pagination; shop renders getAllProducts() in full.
- Cart says empty on arrival from the abandoned-cart email link.
- Compare and Share on the product page are inert - no onClick prop at all.

## Minor Observations

- Four Google font families load; font-body-alt (Manrope) appears zero times outside its token declaration; Cormorant loads 10 files for one italic line below the fold.
- ProductVisual hardcodes sizes ending in 50vw for every use including 80px cart thumbs and the 6-col Instagram grid; accepts no priority prop, so the first visible image on 12 routes is never prioritized.
- alt="" on the component supplying alt for every product card, category tile, blog card and cart thumbnail. Cart line items have no aria-label compensation.
- Newsletter form swallows emails: no onSubmit, no action, no API route, input has no name.
- Heading order skips h1 to h3 on 8 catalog pages; /admin/sign-in has zero heading elements.
- Delivery total changes between cart and checkout (flat 3,500 becomes 2,500-6,000 by zone) with no "estimated" qualifier.
- Delivery ETA labels use en-dashes against the standing no-em-dash preference for customer-facing copy.
- justAdded confirmations use bare setTimeout with no cleanup.

## Questions to Consider

1. The database knows top, heart and base notes for every fragrance; the interface hides them behind a +. What would this site look like if fragrance notes were the primary visual system instead of a 4:5 photo of a bottle?
2. For bank transfer and POD, WhatsApp is the only channel through which the business learns an order exists and the customer learns how to pay. Is WhatsApp the actual checkout, with the web form as lead capture?
3. The strongest emotional decision here is a deliberate 1600ms pause. Where else is time spent on purpose, and where by accident?
