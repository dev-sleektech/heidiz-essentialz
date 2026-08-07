"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { CartLineItem } from "@/components/shop/cart-line-item";
import { OrderSummary } from "@/components/shop/order-summary";
import { useCart } from "@/lib/cart-context";
import { useProductCatalog } from "@/lib/product-catalog-context";

// "Complete Your Order" link from the abandoned-cart reminder email
// (src/lib/email.ts) — ?restore=slug1:qty1,slug2:qty2 merges those lines
// back into the (client-side, localStorage) cart on load. Split out and
// Suspense-wrapped below because useSearchParams() requires it even on an
// otherwise fully client-rendered page.
function RestoreFromEmail() {
  const { addItem } = useCart();
  const searchParams = useSearchParams();
  const restored = useRef(false);

  useEffect(() => {
    const restore = searchParams.get("restore");
    if (!restore || restored.current) return;
    restored.current = true;
    for (const pair of restore.split(",")) {
      const [slug, qty] = pair.split(":");
      if (slug) addItem(slug, Math.max(1, Number(qty) || 1));
    }
  }, [searchParams, addItem]);

  return null;
}

export default function CartPage() {
  const { lines, totalItems, subtotal } = useCart();
  const { getProduct } = useProductCatalog();

  const resolvedLines = lines
    .map((line) => ({ line, product: getProduct(line.slug) }))
    .filter((entry): entry is { line: (typeof lines)[number]; product: NonNullable<ReturnType<typeof getProduct>> } =>
      Boolean(entry.product)
    );

  return (
    <Container className="py-10 md:py-14">
      <Suspense fallback={null}>
        <RestoreFromEmail />
      </Suspense>
      <Breadcrumbs items={[{ label: "Cart" }]} />
      <h1 className="mt-4 font-display text-3xl text-brand-black md:text-4xl">Shopping Cart</h1>

      {resolvedLines.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <ShoppingBag className="h-10 w-10 text-charcoal/30" strokeWidth={1.5} />
          <p className="font-display text-xl text-brand-black">Your cart is empty</p>
          <p className="text-sm text-charcoal/60">
            Explore the collection and add something you love.
          </p>
          <ButtonLink href="/shop" variant="primary" size="md" className="mt-2">
            Shop the Collection
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col">
            {resolvedLines.map(({ line, product }) => (
              <CartLineItem
                key={`${line.slug}-${line.size ?? ""}-${line.color ?? ""}`}
                product={product}
                quantity={line.quantity}
                size={line.size}
                color={line.color}
              />
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <OrderSummary subtotal={subtotal} itemCount={totalItems}>
              <ButtonLink href="/checkout" variant="primary" size="lg" className="mt-2 w-full">
                Proceed to Checkout
              </ButtonLink>
              <ButtonLink href="/shop" variant="ghost" size="md" className="w-full">
                Continue Shopping
              </ButtonLink>
            </OrderSummary>
          </div>
        </div>
      )}
    </Container>
  );
}
