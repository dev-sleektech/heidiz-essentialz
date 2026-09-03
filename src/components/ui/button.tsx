import { type ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const variantClasses = {
  primary:
    "bg-burnt-orange text-white hover:bg-burnt-orange-dark shadow-[0_8px_24px_-8px_rgba(181,83,30,0.55)]",
  dark: "bg-brand-black text-white hover:bg-charcoal",
  outline:
    "border border-brand-black/70 text-brand-black hover:bg-brand-black hover:text-white",
  ghost: "text-charcoal hover:text-burnt-orange",
} as const;

const sizeClasses = {
  md: "px-7 py-3 text-sm",
  lg: "px-9 py-4 text-base",
} as const;

type Variant = keyof typeof variantClasses;
type Size = keyof typeof sizeClasses;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-button font-medium tracking-wide transition-[background-color,border-color,color,transform] duration-(--duration-press) ease-brand motion-safe:active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burnt-orange focus-visible:ring-offset-2 focus-visible:ring-offset-ivory cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

type ButtonLinkProps = {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-button font-medium tracking-wide transition-[background-color,border-color,color,transform] duration-(--duration-press) ease-brand motion-safe:active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burnt-orange focus-visible:ring-offset-2 focus-visible:ring-offset-ivory",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </Link>
  );
}
