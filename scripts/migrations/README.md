# One-off data migrations

Dated, idempotent scripts that were run once against the production
database to reshape existing data. They are kept for the record — each one
documents *why* a change was made, which the resulting rows can't.

They are **not** part of deploy. A fresh database gets its categories from
`../seed-categories.mjs`, which already reflects the end state of every
migration here.

Run order, if a database ever has to be rebuilt from an old snapshot:

1. `restructure-categories.mjs` — promoted Oil Perfumes, Body Mist and Gift
   Sets from free-text `Product.category` labels to real categories, and
   moved the storefront to the client's nine collections.
2. `restructure-nav.mjs` — added the header's two dropdowns (`navGroup`),
   the collections the client named that didn't exist yet, and split
   Jewelry into Bracelets and Necklaces.
3. `add-combo-deals.mjs` — added the Combo Deals collection.
4. `move-luxury-perfumes-to-arabian.mjs` — emptied the legacy Luxury
   Perfumes collection into Arabian Perfumes, once the client decided where
   the 31 unfiled perfumes belonged.

Each is safe to re-run: they use `on conflict do nothing` for inserts and
guard every update on the change not already being in place.
