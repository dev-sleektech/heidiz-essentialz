import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";

// Backs the client-side product catalog context (see
// src/lib/product-catalog-context.tsx) — cart/checkout/wishlist need
// synchronous-feeling product lookups by slug on the client, so this loads
// the full catalog once rather than round-tripping per lookup. 56 products
// of this shape is a small enough payload that this is simpler and faster
// than a more granular API.
export async function GET() {
  const products = await getAllProducts();
  return NextResponse.json({ products });
}
