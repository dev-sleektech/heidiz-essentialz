import Image from "next/image";
import { stockImages, type IconKey } from "@/lib/placeholder-data";

// Single large product image: the client's own photo when one exists
// (src), otherwise a per-category stock placeholder. Swap for a real
// multi-angle gallery/360° viewer once fuller photography is supplied.
export function ProductGallery({
  icon,
  src,
  name,
}: {
  icon: IconKey;
  src?: string;
  name: string;
}) {
  return (
    <div className="group relative aspect-square w-full overflow-hidden rounded-[4px] bg-ivory md:aspect-[4/5]">
      <Image
        src={src ?? stockImages[icon]}
        alt={name}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        priority
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 border border-brand-black/10" />
    </div>
  );
}
