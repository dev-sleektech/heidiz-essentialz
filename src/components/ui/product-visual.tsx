import Image from "next/image";
import { cn } from "@/lib/utils";
import { stockImages, type IconKey } from "@/lib/placeholder-data";

// Licensed Unsplash stock photography standing in for real product/store
// photography (see stockImages in placeholder-data.ts for sourcing notes).
// Swap for the client's own cinematic imagery/video once supplied.

export function ProductVisual({
  icon,
  src,
  className,
  monogram = "HE",
}: {
  icon: IconKey;
  /** Real product photo (local /public path or licensed remote URL).
   *  Takes priority over the generic per-category stock photo. */
  src?: string;
  className?: string;
  monogram?: string;
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
        alt=""
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
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
