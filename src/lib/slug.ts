// One slugifier for the whole app. There were three near-identical copies
// (both admin forms and the category API's input parser) — a divergence
// between the one the form previews and the one the server stores would
// silently create a category at a different URL than the admin was shown.
export function slugify(text: string): string {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
