import Image from "next/image";
import { cn } from "@/lib/utils";
import { stockImages } from "@/lib/placeholder-data";
import type { IconKey } from "@/lib/product-types";

// Licensed Unsplash stock photography standing in for real product/store
// photography (see stockImages in placeholder-data.ts for sourcing notes).
// Swap for the client's own cinematic imagery/video once supplied.

// The default `sizes` describes a product grid cell, which is what most
// callers are. It was previously hardcoded for every caller, so an 80px
// cart thumbnail and a 6-across Instagram tile both told the browser to
// download an image for half the viewport. Callers that aren't grid cells
// pass their own.
const GRID_CELL_SIZES = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw";

export function ProductVisual({
  icon,
  src,
  className,
  monogram = "HE",
  alt = "",
  sizes = GRID_CELL_SIZES,
  priority = false,
}: {
  icon: IconKey;
  /** Real product photo (local /public path or licensed remote URL).
   *  Takes priority over the generic per-category stock photo. */
  src?: string;
  className?: string;
  monogram?: string;
  /** Describe the product when this image is the only thing identifying
   *  it. Cards leave it empty because their covering link already carries
   *  an aria-label, and announcing both just repeats the name. */
  alt?: string;
  /** Override when this isn't a grid cell — "96px" for a cart thumbnail,
   *  "(min-width: 768px) 16vw, 33vw" for the Instagram strip. */
  sizes?: string;
  /** Set on the first image above the fold so it isn't lazy-loaded. */
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-[4px] bg-ivory",
        className
      )}
    >
      <Image
        src={src ?? stockImages[icon]}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-black/25 via-transparent to-transparent" />
      <span className="absolute top-4 left-4 font-display text-[0.65rem] tracking-luxury text-white/80 drop-shadow">
        {monogram}
      </span>
      <div className="absolute inset-0 border border-brand-black/10" />
    </div>
  );
}
