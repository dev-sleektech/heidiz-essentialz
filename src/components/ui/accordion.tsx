"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type AccordionItem = {
  title: string;
  content: React.ReactNode;
};

export function Accordion({
  items,
  defaultOpenIndex = 0,
  className,
}: {
  items: AccordionItem[];
  defaultOpenIndex?: number | null;
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex);

  return (
    <div className={cn("flex flex-col divide-y divide-brand-black/10 border-t border-b border-brand-black/10", className)}>
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.title}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="flex w-full items-center justify-between py-4 text-left"
            >
              <span className="font-display text-base text-brand-black">{item.title}</span>
              {open ? (
                <Minus className="h-4 w-4 shrink-0 text-burnt-orange" strokeWidth={1.5} />
              ) : (
                <Plus className="h-4 w-4 shrink-0 text-charcoal/50" strokeWidth={1.5} />
              )}
            </button>
            {open && (
              <div className="pb-5 text-sm leading-relaxed text-charcoal/70">{item.content}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
