// Shared parsing/validation for the admin category write routes, so POST
// (/api/admin/categories) and PATCH (/api/admin/categories/[slug]) can't
// drift apart on what a valid category looks like.

import { ICON_KEYS, type IconKey } from "@/lib/product-types";
import { NAV_GROUPS, type NavGroup } from "@/lib/category-types";
import { slugify } from "@/lib/slug";

export type CategoryInput = {
  name: string;
  tagline: string;
  description: string;
  icon: IconKey;
  image: string | null;
  groupSlugs: string[];
  navGroup: NavGroup | null;
  sortOrder: number;
  assignable: boolean;
  showOnHome: boolean;
};

// Re-exported under the old name so the category routes keep reading
// naturally; the implementation is the app-wide one in src/lib/slug.ts.
export { slugify as slugifyCategory } from "@/lib/slug";

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Returns the cleaned input, or a message naming the first problem. */
export function parseCategoryInput(
  body: unknown
): { ok: true; value: CategoryInput } | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Invalid request body." };
  }
  const raw = body as Record<string, unknown>;

  const name = trimmed(raw.name);
  if (!name) return { ok: false, message: "Name is required." };

  const tagline = trimmed(raw.tagline);
  if (!tagline) return { ok: false, message: "Tagline is required." };

  const description = trimmed(raw.description);
  if (!description) return { ok: false, message: "Description is required." };

  const icon = trimmed(raw.icon) as IconKey;
  if (!ICON_KEYS.includes(icon)) {
    return { ok: false, message: `Icon must be one of: ${ICON_KEYS.join(", ")}.` };
  }

  const image = trimmed(raw.image) || null;

  // Slugs of other categories folded into this one's page. Normalised the
  // same way a slug is generated, and de-duplicated, so a typo'd or
  // differently-cased entry can't silently match nothing.
  const groupSlugs = Array.isArray(raw.groupSlugs)
    ? Array.from(new Set(raw.groupSlugs.map((s) => slugify(String(s))).filter(Boolean)))
    : [];

  // Empty string means "not on any menu" — the form's default option.
  const rawNavGroup = trimmed(raw.navGroup);
  if (rawNavGroup && !NAV_GROUPS.includes(rawNavGroup as NavGroup)) {
    return { ok: false, message: `Header menu must be one of: ${NAV_GROUPS.join(", ")}.` };
  }
  const navGroup = (rawNavGroup || null) as NavGroup | null;

  const sortOrder = Number(raw.sortOrder);
  if (!Number.isFinite(sortOrder)) {
    return { ok: false, message: "Sort order must be a number." };
  }

  return {
    ok: true,
    value: {
      name,
      tagline,
      description,
      icon,
      image,
      groupSlugs,
      navGroup,
      sortOrder: Math.trunc(sortOrder),
      assignable: raw.assignable !== false,
      showOnHome: raw.showOnHome !== false,
    },
  };
}
