"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, CheckCircle2, AlertCircle, Upload, X } from "lucide-react";
import { categories } from "@/lib/placeholder-data";
import type { Product } from "@/lib/product-types";

const BADGE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "None" },
  { value: "New", label: "New" },
  { value: "Best Seller", label: "Best Seller" },
  { value: "Limited", label: "Limited" },
  { value: "Sale", label: "Sale (promo indicator)" },
  { value: "Black Friday", label: "Black Friday (promo indicator)" },
  { value: "Valentine's Day", label: "Valentine's Day (promo indicator)" },
  { value: "Christmas", label: "Christmas (promo indicator)" },
];

const inputClass =
  "w-full rounded-button border border-brand-black/15 bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-burnt-orange";
const labelClass = "text-xs uppercase tracking-wide text-charcoal/60";

// Arrays (benefits, fragrance note lists) are edited as one-item-per-line
// textareas rather than a repeater UI — matches how the static catalog
// data was authored and keeps the form simple for a catalog this size.
function linesToArray(text: string): string[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

// "25ml = 45000" per line -> { "25ml": 45000 }. Sizes with no line here (or
// an unparseable one) just fall back to the base Price field on the
// product page — this is meant for products where size actually changes
// the price (perfumes), not a required field for every sized product
// (shoes/colors don't need it at all).
function linesToSizePricing(text: string): Record<string, number> | null {
  const entries: [string, number][] = [];
  for (const line of text.split("\n")) {
    const [rawSize, rawPrice] = line.split("=");
    if (!rawSize || !rawPrice) continue;
    const size = rawSize.trim();
    const price = Number(rawPrice.trim());
    if (!size || !Number.isFinite(price) || price <= 0) continue;
    entries.push([size, price]);
  }
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function sizePricingToLines(sizePricing: Record<string, number> | undefined): string {
  if (!sizePricing) return "";
  return Object.entries(sizePricing)
    .map(([size, price]) => `${size} = ${price}`)
    .join("\n");
}

// Standard US-to-EU shoe size conversion (industry-standard mapping, same
// as used by major retailers e.g. Nike/Zappos) — offered as a one-click
// fill for the Sizes field below since typing the full men's + women's
// range by hand for every shoe product would be tedious. Products that
// aren't shoes, or that only come in one gender, can still just type
// whatever's relevant directly.
const MENS_US_TO_EU: [string, string][] = [
  ["6", "38.5"], ["6.5", "39"], ["7", "40"], ["7.5", "40.5"], ["8", "41"],
  ["8.5", "42"], ["9", "42.5"], ["9.5", "43"], ["10", "44"], ["10.5", "44.5"],
  ["11", "45"], ["11.5", "45.5"], ["12", "46"], ["13", "47"],
];
const WOMENS_US_TO_EU: [string, string][] = [
  ["5", "35"], ["5.5", "35.5"], ["6", "36"], ["6.5", "37"], ["7", "37.5"],
  ["7.5", "38"], ["8", "38.5"], ["8.5", "39"], ["9", "39.5"], ["9.5", "40"],
  ["10", "40.5"], ["10.5", "41"], ["11", "42"], ["11.5", "42.5"], ["12", "43"],
];
const FULL_SHOE_SIZE_RANGE = [
  ...MENS_US_TO_EU.map(([us, eu]) => `EU ${eu} / US ${us} (Men)`),
  ...WOMENS_US_TO_EU.map(([us, eu]) => `EU ${eu} / US ${us} (Women)`),
].join("\n");

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Same form for both create and edit — pass `product` to edit an existing
// one (PATCHes /api/admin/products/[slug]), omit it to create a new one
// (POSTs to /api/admin/products, then redirects to the new product's edit
// page). The only real difference is the extra Slug field in create mode.
export function ProductEditForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isCreate = !product;
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [image, setImage] = useState(product?.image ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gallery: extra photos beyond the primary "Product Photo" above, up to
  // 10 total, shown as a thumbnail strip on the product detail page (see
  // ProductGallery). The primary photo stays the cover used in cards.
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const sizesInputRef = useRef<HTMLTextAreaElement>(null);

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

  async function handleGalleryFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setGalleryUploading(true);
    setGalleryError(null);

    try {
      for (const file of files) {
        if (images.length >= 10) {
          setGalleryError("Up to 10 gallery photos allowed.");
          break;
        }
        const uploadForm = new FormData();
        uploadForm.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: uploadForm });
        const json = await res.json();
        if (json.uploaded) {
          setImages((prev) => [...prev, json.url]);
        } else {
          setGalleryError(json.message ?? "Upload failed.");
        }
      }
    } catch {
      setGalleryError("Upload failed.");
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  function removeGalleryImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setResult(null);

    const data = new FormData(e.currentTarget);
    const categorySlug = String(data.get("categorySlug"));
    const category = categories.find((c) => c.slug === categorySlug)?.name ?? categorySlug;

    const hasFragranceNotes =
      String(data.get("notesTop")).trim() ||
      String(data.get("notesHeart")).trim() ||
      String(data.get("notesBase")).trim();

    const body = {
      ...(isCreate ? { slug: slugify(slug) } : {}),
      name: String(data.get("name")),
      category,
      categorySlug,
      price: Number(data.get("price")),
      compareAtPrice: data.get("compareAtPrice") ? Number(data.get("compareAtPrice")) : null,
      badge: String(data.get("badge")) || null,
      image: image || null,
      images,
      description: String(data.get("description")),
      benefits: linesToArray(String(data.get("benefits"))),
      directions: String(data.get("directions")),
      ingredients: String(data.get("ingredients")) || null,
      fragranceNotes: hasFragranceNotes
        ? {
            top: linesToArray(String(data.get("notesTop"))),
            heart: linesToArray(String(data.get("notesHeart"))),
            base: linesToArray(String(data.get("notesBase"))),
          }
        : null,
      sizes: linesToArray(String(data.get("sizes"))),
      colors: linesToArray(String(data.get("colors"))),
      sizePricing: linesToSizePricing(String(data.get("sizePricing"))),
      rating: Number(data.get("rating")),
      reviewCount: Number(data.get("reviewCount")),
      inStock: data.get("inStock") === "on",
    };

    try {
      const res = await fetch(
        isCreate ? "/api/admin/products" : `/api/admin/products/${product.slug}`,
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
          router.push(`/admin/products/${json.slug}`);
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
            defaultValue={product?.name}
            className={inputClass}
            onChange={(e) => {
              if (isCreate && !slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </label>

        {isCreate && (
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
              placeholder="my-new-product"
            />
            <span className="text-xs text-charcoal/40">/product/{slugify(slug) || "..."}</span>
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Category</span>
          <select required name="categorySlug" defaultValue={product?.categorySlug ?? categories[0].slug} className={inputClass}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Product Photo</span>
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

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={labelClass}>Gallery Photos (up to 10, shown on the product page)</span>
          <div className="flex flex-wrap gap-2">
            {images.map((src, i) => (
              <div key={src + i} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[4px] border border-brand-black/10 bg-ivory">
                <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => removeGalleryImage(i)}
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-black/70 text-white hover:bg-burnt-orange"
                >
                  <X className="h-2.5 w-2.5" strokeWidth={2} />
                </button>
              </div>
            ))}
            {images.length < 10 && (
              <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-dashed border-brand-black/20 text-charcoal/40 hover:border-burnt-orange hover:text-burnt-orange">
                {galleryUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                ) : (
                  <Upload className="h-4 w-4" strokeWidth={1.5} />
                )}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryFilesSelected}
                  disabled={galleryUploading}
                  className="hidden"
                />
              </label>
            )}
          </div>
          {galleryError && <span className="text-xs text-red-600">{galleryError}</span>}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Price (₦)</span>
          <input required type="number" min="0" name="price" defaultValue={product?.price} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Compare-At Price (₦)</span>
          <input
            type="number"
            min="0"
            name="compareAtPrice"
            defaultValue={product?.compareAtPrice ?? ""}
            className={inputClass}
            placeholder="Original price, if discounted"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Badge</span>
          <select name="badge" defaultValue={product?.badge ?? ""} className={inputClass}>
            {BADGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-charcoal/50 sm:col-span-3">
          Set a Compare-At Price higher than Price to show a discount (crossed-out original price).
          The &quot;Sale&quot; badge is the promo indicator shown on product cards.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Description</span>
          <textarea required name="description" rows={3} defaultValue={product?.description} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Benefits (one per line)</span>
          <textarea name="benefits" rows={4} defaultValue={product?.benefits.join("\n") ?? ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Directions for Use</span>
          <textarea required name="directions" rows={2} defaultValue={product?.directions} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Ingredients (optional)</span>
          <textarea name="ingredients" rows={2} defaultValue={product?.ingredients ?? ""} className={inputClass} />
        </label>
      </section>

      <section className="flex flex-col gap-4">
        <span className={labelClass}>Fragrance Notes (perfumes only, one per line, leave all blank to omit)</span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-charcoal/50">Top</span>
            <textarea name="notesTop" rows={3} defaultValue={product?.fragranceNotes?.top.join("\n") ?? ""} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-charcoal/50">Heart</span>
            <textarea name="notesHeart" rows={3} defaultValue={product?.fragranceNotes?.heart.join("\n") ?? ""} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-charcoal/50">Base</span>
            <textarea name="notesBase" rows={3} defaultValue={product?.fragranceNotes?.base.join("\n") ?? ""} className={inputClass} />
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <span className={labelClass}>
          Sizes &amp; Colors (optional, one per line, e.g. shoes; leave blank if not applicable)
        </span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-charcoal/50">Sizes</span>
              <button
                type="button"
                onClick={() => {
                  if (sizesInputRef.current) sizesInputRef.current.value = FULL_SHOE_SIZE_RANGE;
                }}
                className="text-xs text-burnt-orange underline-offset-2 hover:underline"
              >
                Fill full Men&apos;s + Women&apos;s range (EU &amp; US)
              </button>
            </div>
            <textarea
              ref={sizesInputRef}
              name="sizes"
              rows={6}
              defaultValue={product?.sizes.join("\n") ?? ""}
              className={inputClass}
              placeholder={"EU 42 / US 9 (Men)\nEU 40 / US 9 (Women)"}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-charcoal/50">Colors</span>
            <textarea
              name="colors"
              rows={3}
              defaultValue={product?.colors.join("\n") ?? ""}
              className={inputClass}
              placeholder={"Black\nBrown\nTan"}
            />
          </label>
        </div>
        <p className="text-xs text-charcoal/50">
          Shown as a dropdown/selectable options on the product page. Customers must pick one of
          each before adding to cart if any are listed. For shoes, use the fill button above for
          the standard EU/US Men&apos;s + Women&apos;s range, then delete any lines that don&apos;t
          apply to this specific product.
        </p>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-charcoal/50">
            Size Prices (optional, one per line: size = price in ₦)
          </span>
          <textarea
            name="sizePricing"
            rows={5}
            defaultValue={sizePricingToLines(product?.sizePricing)}
            className={inputClass}
            placeholder={"25ml = 45000\n50ml = 65000\n75ml = 85000\n100ml = 105000"}
          />
        </label>
        <p className="text-xs text-charcoal/50">
          Only needed when different sizes should have different prices, like perfume ml options.
          Any size left out here just uses the base Price above, so this can stay empty for
          products like shoes where size doesn&apos;t change the price.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Rating (0–5)</span>
          <input required type="number" min="0" max="5" step="0.1" name="rating" defaultValue={product?.rating ?? 5} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Review Count</span>
          <input required type="number" min="0" name="reviewCount" defaultValue={product?.reviewCount ?? 0} className={inputClass} />
        </label>
        <label className="flex items-center gap-2 pt-6">
          <input type="checkbox" name="inStock" defaultChecked={product?.inStock ?? true} className="h-4 w-4 accent-burnt-orange" />
          <span className="text-sm text-charcoal">In Stock</span>
        </label>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-button bg-burnt-orange px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />}
          {saving ? "Saving..." : isCreate ? "Create Product" : "Save Changes"}
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
      </div>
    </form>
  );
}
