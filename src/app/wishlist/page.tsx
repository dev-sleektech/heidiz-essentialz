"use client";

import { Heart } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { ProductGrid } from "@/components/shop/product-grid";
import { useWishlist } from "@/lib/wishlist-context";
import { useProductCatalog } from "@/lib/product-catalog-context";

export default function WishlistPage() {
  const { slugs } = useWishlist();
  const { getProduct, loading } = useProductCatalog();
  const products = slugs
    .map((slug) => getProduct(slug))
    .filter((p): p is NonNullable<ReturnType<typeof getProduct>> => Boolean(p));

  return (
    <Container className="py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Wishlist" }]} />
      <h1 className="mt-4 font-display text-3xl text-brand-black md:text-4xl">Your Wishlist</h1>

      {/* Wishlist slugs are local and immediate; the products behind them
          are not. Without this the page told a returning customer their
          wishlist was empty every time, for as long as the catalog took. */}
      {loading && slugs.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {Array.from({ length: Math.min(slugs.length, 4) }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3" aria-hidden="true">
              <div className="aspect-[4/5] w-full animate-pulse rounded-button bg-charcoal/10" />
              <div className="h-3 w-16 animate-pulse rounded bg-charcoal/10" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-charcoal/10" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <Heart className="h-10 w-10 text-charcoal/60" strokeWidth={1.5} />
          <p className="font-display text-xl text-brand-black">Your wishlist is empty</p>
          <p className="text-sm text-charcoal/80">
            Save pieces you love and come back to them anytime.
          </p>
          <ButtonLink href="/shop" variant="primary" size="md" className="mt-2">
            Shop the Collection
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-8">
          <ProductGrid products={products} />
        </div>
      )}
    </Container>
  );
}
