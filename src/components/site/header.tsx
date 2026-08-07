"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Search, User, Heart, ShoppingBag } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/site/logo";
import { categories } from "@/lib/placeholder-data";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";

const navLinks = [
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Perfumes", href: "/category/perfumes" },
  { label: "Beauty & Skincare", href: "/category/beauty-skincare" },
  { label: "Makeup", href: "/category/makeup" },
  { label: "Hair Care", href: "/category/hair-care" },
  { label: "Accessories", href: "/category/accessories" },
  { label: "Gift Sets", href: "/gift-sets" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { slugs: wishlistSlugs } = useWishlist();
  const { isSignedIn } = useUser();

  return (
    <header className="sticky top-0 z-50 border-b border-brand-black/10 bg-ivory/90 backdrop-blur-md">
      <div className="bg-brand-black py-2 text-center text-[0.7rem] tracking-widest text-champagne">
        COMPLIMENTARY DELIVERY ON ORDERS OVER ₦150,000 &nbsp;•&nbsp; CALL +234 815 885 1166
      </div>

      <Container className="flex items-center justify-between py-4">
        <button
          type="button"
          className="flex items-center gap-2 lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/" className="mx-auto lg:mx-0">
          <Logo priority />
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-charcoal/80 hover:text-burnt-orange transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-brand-black">
          <button aria-label="Search" className="hidden sm:inline-flex hover:text-burnt-orange">
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </button>
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
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-charcoal/80 hover:text-burnt-orange"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="hairline my-2" />
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="text-xs uppercase tracking-wide text-charcoal/50 hover:text-burnt-orange"
                onClick={() => setMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
          </Container>
        </div>
      )}
    </header>
  );
}
