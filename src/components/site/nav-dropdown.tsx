"use client";

// Desktop header dropdown (2026-09-02). Opens on hover for a mouse and on
// click/Enter for keyboard and touch, since hover alone leaves a menu
// unreachable on both. The panel is a sibling inside the same hover target
// as the trigger, with no gap between them, so moving the pointer down into
// the list doesn't close it mid-travel.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { Category } from "@/lib/category-types";

export function NavDropdown({
  label,
  href,
  items,
}: {
  label: string;
  /** Where the label itself goes — the umbrella page gathering the items. */
  href: string;
  items: Category[];
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // A click anywhere else, or Escape, closes it. Needed because the panel
  // can also be opened by click, which hover-out alone wouldn't undo on a
  // touch device.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (items.length === 0) {
    return (
      <Link href={href} className="text-sm text-charcoal/80 transition-colors hover:text-burnt-orange">
        {label}
      </Link>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={href}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={(e) => {
          // First tap on a touch device reveals the menu instead of
          // navigating straight past it; the label is still reachable from
          // the panel's own "View all" row below.
          if (!open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="flex items-center gap-1 text-sm text-charcoal/80 transition-colors hover:text-burnt-orange"
      >
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={1.5}
        />
      </Link>

      {open && (
        <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3">
          <div className="min-w-56 rounded-[4px] border border-brand-black/10 bg-ivory py-2 shadow-xl">
            {items.map((item) => (
              <Link
                key={item.slug}
                href={`/category/${item.slug}`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-charcoal/80 transition-colors hover:bg-white hover:text-burnt-orange"
              >
                {item.name}
              </Link>
            ))}
            <div className="my-1 border-t border-brand-black/10" />
            <Link
              href={href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-xs uppercase tracking-wide text-charcoal/50 transition-colors hover:text-burnt-orange"
            >
              View all {label}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
