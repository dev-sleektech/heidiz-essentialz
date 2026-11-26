/**
 * Server-side limits for text that public endpoints accept. The checkout form has its own
 * checks, but anyone can call the API directly, so the server enforces them too. Overlong
 * or wrongly-typed input is REJECTED (400), never silently cut: no real customer hits these.
 */
export const LIMITS = {
  name: 120,
  email: 254,
  phone: 40,
  address: 300,
  shortText: 200, // slugs, city, state, labels, sizes, colours
  notes: 1000,
} as const;

/** Deliberately simple: one @, something either side, a dot in the domain, no spaces. */
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Returns an error naming the first field that is not a string within its limit, or null.
 * `optional` fields may be absent (undefined/null/"").
 */
export function invalidText(
  fields: Record<string, { value: unknown; max: number; optional?: boolean }>
): string | null {
  for (const [label, { value, max, optional }] of Object.entries(fields)) {
    if (value === undefined || value === null || value === "") {
      if (optional) continue;
      return `${label} is required.`;
    }
    if (typeof value !== "string") return `${label} is invalid.`;
    if (value.length > max) return `${label} is too long (max ${max} characters).`;
  }
  return null;
}
