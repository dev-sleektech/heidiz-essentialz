"use client";

import { useState } from "react";
import Image from "next/image";
import { stockImages, type IconKey } from "@/lib/placeholder-data";
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

  return (
    <div className="flex flex-col gap-3">
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

      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {gallery.map((photo, i) => (
            <button
              key={photo + i}
              type="button"
              onClick={() => setActive(i)}
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
