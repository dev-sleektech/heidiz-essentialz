"use client";

import { useState } from "react";
import Image from "next/image";
import { stockImages } from "@/lib/placeholder-data";
import type { IconKey } from "@/lib/product-types";
import { cn } from "@/lib/utils";

// Main image + thumbnail strip when a product has multiple photos (up to
// 10, set from /admin — see product-edit-form.tsx). Falls back to the
// single `src`/category stock placeholder when a product only has one
// photo, same as before.
export function ProductGallery({
  icon,
  src,
  images = [],
  name,
}: {
  icon: IconKey;
  src?: string;
  images?: string[];
  name: string;
}) {
  const gallery = images.length > 0 ? images : src ? [src] : [stockImages[icon]];
  const [active, setActive] = useState(0);
  // Only mount photos the shopper has actually opened, so a 10-image product
  // still loads one image on first paint. Once mounted a photo stays mounted,
  // which is what lets the opacity transition crossfade in both directions.
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));

  function show(i: number) {
    setSeen((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
    setActive(i);
  }

  return (
    <div className="flex flex-col gap-3">
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

      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {gallery.map((photo, i) => (
            <button
              key={photo + i}
              type="button"
              onClick={() => show(i)}
              aria-label={`View photo ${i + 1} of ${name}`}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-[4px] border transition-colors",
                active === i ? "border-burnt-orange" : "border-brand-black/10 hover:border-brand-black/30"
              )}
            >
              <Image src={photo} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
