import Image from "next/image";
import { cn } from "@/lib/utils";

// Real brand mark supplied by the client (public/brand/logo-mark.png,
// cropped from their source render with the white backdrop keyed out).
const MARK_ASPECT = 467 / 521;

export function Logo({
  className,
  markClassName = "h-10",
  wordmarkColor = "text-brand-black",
  accentColor = "text-burnt-orange",
  showWordmark = true,
  priority = false,
}: {
  className?: string;
  markClassName?: string;
  wordmarkColor?: string;
  accentColor?: string;
  showWordmark?: boolean;
  priority?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src="/brand/logo-mark.png"
        alt="HEIDIZ Essentialz"
        width={Math.round(521 * MARK_ASPECT)}
        height={521}
        priority={priority}
        className={cn("w-auto object-contain", markClassName)}
      />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className={cn("font-display text-2xl tracking-[0.15em]", wordmarkColor)}>
            HEIDIZ
          </span>
          <span className={cn("text-[0.6rem] tracking-luxury", accentColor)}>
            ESSENTIALZ
          </span>
        </span>
      )}
    </span>
  );
}
