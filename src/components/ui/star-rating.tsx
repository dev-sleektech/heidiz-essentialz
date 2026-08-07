import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  className,
  starClassName = "h-4 w-4",
}: {
  rating: number;
  className?: string;
  starClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-0.5 text-burnt-orange", className)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = rating >= i + 1;
        const half = !filled && rating > i && rating < i + 1;
        return (
          <Star
            key={i}
            className={cn(starClassName, !filled && !half && "text-charcoal/20")}
            strokeWidth={1.5}
            fill={filled || half ? "currentColor" : "none"}
            fillOpacity={half ? 0.5 : 1}
          />
        );
      })}
    </div>
  );
}
