import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";

// Backs the client-side product catalog context (see
// src/lib/product-catalog-context.tsx) — cart/checkout/wishlist need
// synchronous-feeling product lookups by slug on the client, so this loads
// the full catalog once rather than round-tripping per lookup. 56 products
// of this shape is a small enough payload that this is simpler and faster
// than a more granular API.
// Matches the 60s ISR the storefront pages already use. Without it this was
// an uncached Neon round-trip on every page load that mounts the provider —
// which is every storefront page, since the provider lives in the root
// layout. The catalog changes on a staff edit, not per request.
export const revalidate = 60;

export async function GET() {
  const products = await getAllProducts();
  return NextResponse.json(
    { products },
    {
      headers: {
        // Let the CDN serve it and keep serving the stale copy while it
        // refreshes, so a customer never waits on the origin for this.
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
