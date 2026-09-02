"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Search, User, Heart, ShoppingBag, ChevronDown } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/site/logo";
import { NavDropdown } from "@/components/site/nav-dropdown";
import { groupForNav, type Category } from "@/lib/category-types";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";

// Top-level bar, exactly as the client specified:
//
//   New Arrivals | Combo Deals | Collections ▾ | Beauty & Skincare |
//   Accessories ▾ | Contact | Refund Policy
//
// The two dropdowns are filled from the DB (Category.navGroup, set per
// category at /admin/categories) and sorted alphabetically, so adding a
// collection puts it on the menu without touching this file. The plain
// links are pages, not categories, so they stay declared here.
//
// "Refund Policy" points at /shipping-returns, which is where the refund
// terms actually live — there is no separate refunds page.
// Combo Deals sits beside New Arrivals rather than inside a dropdown, so
// it's declared here with the other top-level links. It is a real category
// (see scripts/add-combo-deals.mjs) — staff file bundle products into it at
// /admin/products, and it has its own /category page like any other.
const STATIC_LINKS_BEFORE = [
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Combo Deals", href: "/category/combo-deals" },
];

const STATIC_LINK_MIDDLE = { label: "Beauty & Skincare", href: "/category/beauty-skincare" };

const STATIC_LINKS_AFTER = [
  { label: "Contact", href: "/contact" },
  { label: "Refund Policy", href: "/shipping-returns" },
];

export function Header({ categories }: { categories: Category[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Which mobile accordion is expanded. Only one at a time, so a long
  // catalog can't push the rest of the menu off a phone screen.
  const [openGroup, setOpenGroup] = useState<"collections" | "accessories" | null>(null);
  const { totalItems } = useCart();
  const { slugs: wishlistSlugs } = useWishlist();
  const { isSignedIn } = useUser();

  const menus = groupForNav(categories);

  function closeMenu() {
    setMenuOpen(false);
    setOpenGroup(null);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-brand-black/10 bg-ivory/90 backdrop-blur-md">
      <div className="bg-brand-black py-2 text-center text-[0.7rem] tracking-widest text-champagne">
        COMPLIMENTARY DELIVERY ON ORDERS OVER ₦150,000 &nbsp;•&nbsp; CALL +234 815 885 1166
      </div>

      <Container className="flex items-center justify-between py-4">
        <button
          type="button"
          className="flex items-center gap-2 lg:hidden"
          onClick={() => {
            setMenuOpen((open) => !open);
            setOpenGroup(null);
          }}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/" className="mx-auto lg:mx-0">
          <Logo priority />
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {STATIC_LINKS_BEFORE.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-charcoal/80 transition-colors hover:text-burnt-orange"
            >
              {link.label}
            </Link>
          ))}

          <NavDropdown label="Collections" href="/category/collections" items={menus.collections} />

          <Link
            href={STATIC_LINK_MIDDLE.href}
            className="text-sm text-charcoal/80 transition-colors hover:text-burnt-orange"
          >
            {STATIC_LINK_MIDDLE.label}
          </Link>

          <NavDropdown label="Accessories" href="/category/accessories" items={menus.accessories} />

          {STATIC_LINKS_AFTER.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-charcoal/80 transition-colors hover:text-burnt-orange"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-brand-black">
          <Link href="/search" aria-label="Search" className="hidden sm:inline-flex hover:text-burnt-orange">
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <Link
            href="/account"
            aria-label="Account"
            className="relative hidden sm:inline-flex hover:text-burnt-orange"
          >
            <User className="h-5 w-5" strokeWidth={1.5} />
            {isSignedIn && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-burnt-orange ring-2 ring-ivory" />
            )}
          </Link>
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="relative hidden sm:inline-flex hover:text-burnt-orange"
          >
            <Heart className="h-5 w-5" strokeWidth={1.5} />
            {wishlistSlugs.length > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-burnt-orange text-[0.6rem] text-white">
                {wishlistSlugs.length}
              </span>
            )}
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative inline-flex hover:text-burnt-orange">
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-burnt-orange text-[0.6rem] text-white">
              {totalItems}
            </span>
          </Link>
        </div>
      </Container>

      {menuOpen && (
        <div className="border-t border-brand-black/10 bg-ivory lg:hidden">
          <Container className="flex flex-col gap-4 py-6">
            {/* Search/Account/Wishlist have their own icons in the header
                on screens ≥sm, but disappear below that with nothing else
                to reach them from — this is the small-screen fallback so
                they're never fully inaccessible on a phone. */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pb-2 sm:hidden">
              <Link
                href="/search"
                className="flex items-center gap-2 text-sm text-charcoal/80 hover:text-burnt-orange"
                onClick={closeMenu}
              >
                <Search className="h-4 w-4" strokeWidth={1.5} />
                Search
              </Link>
              <Link
                href="/account"
                className="flex items-center gap-2 text-sm text-charcoal/80 hover:text-burnt-orange"
                onClick={closeMenu}
              >
                <User className="h-4 w-4" strokeWidth={1.5} />
                Account
              </Link>
              <Link
                href="/wishlist"
                className="flex items-center gap-2 text-sm text-charcoal/80 hover:text-burnt-orange"
                onClick={closeMenu}
              >
                <Heart className="h-4 w-4" strokeWidth={1.5} />
                Wishlist{wishlistSlugs.length > 0 ? ` (${wishlistSlugs.length})` : ""}
              </Link>
            </div>
            <div className="hairline mb-2 sm:hidden" />

            {STATIC_LINKS_BEFORE.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-charcoal/80 hover:text-burnt-orange"
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}

            {/* Same two menus as the desktop bar, as accordions — a hover
                dropdown has no equivalent on a phone. */}
            {(
              [
                { key: "collections" as const, label: "Collections", href: "/category/collections" },
                { key: "accessories" as const, label: "Accessories", href: "/category/accessories" },
              ]
            ).map((group) => (
              <div key={group.key} className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setOpenGroup((current) => (current === group.key ? null : group.key))}
                  aria-expanded={openGroup === group.key}
                  className="flex items-center justify-between text-sm text-charcoal/80 hover:text-burnt-orange"
                >
                  {group.label}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${openGroup === group.key ? "rotate-180" : ""}`}
                    strokeWidth={1.5}
                  />
                </button>
                {openGroup === group.key && (
                  <div className="flex flex-col gap-3 border-l border-brand-black/10 pl-4">
                    {menus[group.key].map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/category/${cat.slug}`}
                        className="text-xs uppercase tracking-wide text-charcoal/60 hover:text-burnt-orange"
                        onClick={closeMenu}
                      >
                        {cat.name}
                      </Link>
                    ))}
                    <Link
                      href={group.href}
                      className="text-xs uppercase tracking-wide text-burnt-orange"
                      onClick={closeMenu}
                    >
                      View all {group.label}
                    </Link>
                  </div>
                )}
              </div>
            ))}

            <Link
              href={STATIC_LINK_MIDDLE.href}
              className="text-sm text-charcoal/80 hover:text-burnt-orange"
              onClick={closeMenu}
            >
              {STATIC_LINK_MIDDLE.label}
            </Link>

            {STATIC_LINKS_AFTER.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-charcoal/80 hover:text-burnt-orange"
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}
          </Container>
        </div>
      )}
    </header>
  );
}
