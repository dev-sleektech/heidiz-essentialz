"use client";

// Create/edit form for a storefront category, mirroring how
// ProductEditForm works: pass `category` to edit an existing one (PATCHes
// /api/admin/categories/[slug]), omit it to create a new one (POSTs to
// /api/admin/categories, then redirects to its edit page). The slug is
// fixed after creation — it's the public /category/<slug> URL and the key
// every product's categorySlug points at, so changing it would 404 live
// links and orphan products.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, CheckCircle2, AlertCircle, Upload } from "lucide-react";
import { DeleteButton } from "@/components/admin/delete-button";
import { ICON_KEYS } from "@/lib/product-types";
import { NAV_GROUPS, NAV_GROUP_LABELS, type Category } from "@/lib/category-types";
import { inputClass, labelClass } from "@/lib/form-styles";
import { slugify } from "@/lib/slug";


const ICON_LABELS: Record<(typeof ICON_KEYS)[number], string> = {
  perfume: "Perfume bottle",
  skincare: "Skincare bottles",
  makeup: "Cosmetics",
  hair: "Hair care",
  watch: "Watch",
  bag: "Handbag",
  jewelry: "Jewelry",
  sunglasses: "Sunglasses",
  shoes: "Shoes",
  candle: "Candle",
};


export function CategoryEditForm({
  category,
  /** Every other category, for the "folds in" checkboxes. */
  siblings,
  productCount,
}: {
  category?: Category;
  siblings: Category[];
  productCount?: number;
}) {
  const router = useRouter();
  const isCreate = !category;

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [image, setImage] = useState(category?.image ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [groupSlugs, setGroupSlugs] = useState<string[]>(category?.groupSlugs ?? []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);

    const uploadForm = new FormData();
    uploadForm.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: uploadForm });
      const json = await res.json();
      if (json.uploaded) {
        setImage(json.url);
      } else {
        setUploadError(json.message ?? "Upload failed.");
      }
    } catch {
      setUploadError("Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function toggleGroupSlug(target: string) {
    setGroupSlugs((prev) =>
      prev.includes(target) ? prev.filter((s) => s !== target) : [...prev, target]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setResult(null);

    const data = new FormData(e.currentTarget);
    const body = {
      ...(isCreate ? { slug: slugify(slug) } : {}),
      name: String(data.get("name")),
      tagline: String(data.get("tagline")),
      description: String(data.get("description")),
      icon: String(data.get("icon")),
      image: image || null,
      groupSlugs,
      navGroup: String(data.get("navGroup") ?? ""),
      sortOrder: Number(data.get("sortOrder")),
      assignable: data.get("assignable") === "on",
      showOnHome: data.get("showOnHome") === "on",
    };

    try {
      const res = await fetch(
        isCreate ? "/api/admin/categories" : `/api/admin/categories/${category.slug}`,
        {
          method: isCreate ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      const ok = isCreate ? json.created : json.updated;
      if (ok) {
        if (isCreate) {
          router.push(`/admin/categories/${json.slug}`);
        } else {
          setResult({ ok: true, message: "Saved." });
          router.refresh();
        }
      } else {
        setResult({ ok: false, message: json.message ?? "Could not save changes." });
      }
    } catch {
      setResult({ ok: false, message: "Could not save changes." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={labelClass}>Name</span>
          <input
            required
            name="name"
            defaultValue={category?.name}
            className={inputClass}
            placeholder="Luxury Perfumes"
            onChange={(e) => {
              if (isCreate && !slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </label>

        {isCreate ? (
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>Slug (URL, must be unique)</span>
            <input
              required
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              className={inputClass}
              placeholder="luxury-perfumes"
            />
            <span className="text-xs text-charcoal/40">
              /category/{slugify(slug) || "..."} — fixed once the category is created.
            </span>
          </label>
        ) : (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>Slug</span>
            <p className="rounded-button border border-brand-black/10 bg-ivory px-4 py-2.5 text-sm text-charcoal/60">
              /category/{category.slug}
            </p>
            <span className="text-xs text-charcoal/40">
              Fixed after creation: it is the public URL and the key every product in this category
              points at.
            </span>
          </div>
        )}

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={labelClass}>Tagline</span>
          <input
            required
            name="tagline"
            defaultValue={category?.tagline}
            className={inputClass}
            placeholder="Signature scents & oud"
          />
          <span className="text-xs text-charcoal/40">
            One short line, shown under the name on the homepage tile.
          </span>
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={labelClass}>Description</span>
          <textarea
            required
            name="description"
            rows={3}
            defaultValue={category?.description}
            className={inputClass}
          />
          <span className="text-xs text-charcoal/40">
            Shown at the top of the category page, and used as its search-engine description.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Stock Icon</span>
          <select name="icon" defaultValue={category?.icon ?? "perfume"} className={inputClass}>
            {ICON_KEYS.map((key) => (
              <option key={key} value={key}>
                {ICON_LABELS[key]}
              </option>
            ))}
          </select>
          <span className="text-xs text-charcoal/40">
            Used as the fallback picture when no tile photo is set, and as the default icon for new
            products in this category.
          </span>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Tile Photo</span>
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-brand-black/10 bg-ivory">
              {image ? (
                <Image src={image} alt="" width={64} height={64} className="h-full w-full object-cover" />
              ) : (
                <Upload className="h-5 w-5 text-charcoal/30" strokeWidth={1.5} />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelected}
                  disabled={uploading}
                  className="text-xs text-charcoal/60 file:mr-3 file:rounded-button file:border-0 file:bg-brand-black file:px-3 file:py-1.5 file:text-xs file:text-white file:hover:bg-burnt-orange"
                />
                {uploading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-burnt-orange" strokeWidth={1.5} />}
              </div>
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className={inputClass}
                placeholder="Or paste an image URL / path directly"
              />
              {uploadError && <span className="text-xs text-red-600">{uploadError}</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <span className={labelClass}>Placement</span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-charcoal/50">Header Menu</span>
            <select name="navGroup" defaultValue={category?.navGroup ?? ""} className={inputClass}>
              <option value="">Not on the menu</option>
              {NAV_GROUPS.map((group) => (
                <option key={group} value={group}>
                  Under &quot;{NAV_GROUP_LABELS[group]}&quot;
                </option>
              ))}
            </select>
            <span className="text-xs text-charcoal/40">
              Which header dropdown this appears in. Both menus are listed alphabetically, so sort
              order below does not affect them.
            </span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-charcoal/50">Sort Order</span>
            <input
              required
              type="number"
              name="sortOrder"
              defaultValue={category?.sortOrder ?? 120}
              className={inputClass}
            />
            <span className="text-xs text-charcoal/40">
              Lower shows first in the homepage grid.
            </span>
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              name="showOnHome"
              defaultChecked={category?.showOnHome ?? true}
              className="mt-0.5 h-4 w-4 accent-burnt-orange"
            />
            <span className="text-sm text-charcoal">
              Show on homepage
              <span className="block text-xs text-charcoal/40">
                Gives it a tile in the homepage collection grid.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              name="assignable"
              defaultChecked={category?.assignable ?? true}
              className="mt-0.5 h-4 w-4 accent-burnt-orange"
            />
            <span className="text-sm text-charcoal">
              Products can be filed here
              <span className="block text-xs text-charcoal/40">
                Uncheck for a pure grouping page like Accessories.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <span className={labelClass}>Also Show Products From</span>
        <p className="text-xs text-charcoal/50">
          Tick other collections to gather their products onto this category&apos;s page as well.
          This is how Accessories pulls in watches, handbags, jewelry and sunglasses. Leave every
          box clear for an ordinary category.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {siblings.map((sib) => (
            <label key={sib.slug} className="flex items-center gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={groupSlugs.includes(sib.slug)}
                onChange={() => toggleGroupSlug(sib.slug)}
                className="h-4 w-4 accent-burnt-orange"
              />
              {sib.name}
              <span className="text-xs text-charcoal/40">/{sib.slug}</span>
            </label>
          ))}
          {siblings.length === 0 && (
            <p className="text-sm text-charcoal/40">No other categories yet.</p>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-button bg-burnt-orange px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />}
          {saving ? "Saving..." : isCreate ? "Create Category" : "Save Changes"}
        </button>
        {result && (
          <span
            className={`inline-flex items-center gap-1.5 text-sm ${result.ok ? "text-green-700" : "text-red-700"}`}
          >
            {result.ok ? (
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
            )}
            {result.message}
          </span>
        )}

        {!isCreate && (
          <div className="ml-auto">
            <DeleteButton
              endpoint={`/api/admin/categories/${category.slug}`}
              confirmLabel="Remove this category?"
              redirectTo="/admin/categories"
            />
          </div>
        )}
      </div>

      {!isCreate && (
        <p className="text-xs text-charcoal/40">
          {productCount && productCount > 0
            ? `${productCount} product${productCount === 1 ? "" : "s"} currently sit in this category. Move or delete ${productCount === 1 ? "it" : "them"} before it can be removed.`
            : "No products are in this category, so it can be removed safely."}
        </p>
      )}
    </form>
  );
}
