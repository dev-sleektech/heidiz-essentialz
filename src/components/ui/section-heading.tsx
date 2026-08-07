import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  dark = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "text-xs tracking-luxury uppercase font-sans font-medium",
            dark ? "text-champagne" : "text-burnt-orange"
          )}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "font-display text-3xl md:text-4xl lg:text-[2.75rem] leading-tight",
          dark ? "text-white" : "text-brand-black"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "font-sans text-base max-w-xl",
            dark ? "text-white/70" : "text-charcoal/70"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
