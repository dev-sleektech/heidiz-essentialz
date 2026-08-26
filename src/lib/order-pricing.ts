import { prisma } from "@/lib/prisma";
import { getDeliveryEstimate } from "@/lib/delivery";

// The cart (src/lib/cart-context.tsx) snapshots unitPrice into localStorage
// on the client — which means it's fully attacker-editable (open devtools,
// rewrite a cart line's unitPrice, checkout for whatever you typed). This
// module is the fix: the authoritative price of an order is always
// recomputed here from the Product table, never trusted from the client.
// Used by /api/orders/create (what gets logged/shipped) and by the
// Paystack/Monnify verify routes (what the customer is actually required
// to have paid) so the two can never drift apart.

export type PricedLine = {
  slug: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
};

export type ComputedOrderItem = {
  productSlug: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  size: string | null;
  color: string | null;
};

export type ComputedOrder = {
  items: ComputedOrderItem[];
  subtotal: number;
  delivery: number;
  total: number;
};

// Returns null if the order can't be priced as submitted (unknown product,
// non-positive quantity) — callers should reject the request outright
// rather than falling back to anything client-supplied.
export async function computeOrderTotals(lines: PricedLine[], state: string): Promise<ComputedOrder | null> {
  if (!Array.isArray(lines) || lines.length === 0) return null;

  const slugs = [...new Set(lines.map((line) => line?.slug).filter((s): s is string => typeof s === "string"))];
  if (slugs.length === 0) return null;

  const products = await prisma.product.findMany({ where: { slug: { in: slugs } } });
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const items: ComputedOrderItem[] = [];
  let subtotal = 0;

  for (const line of lines) {
    const product = bySlug.get(line.slug);
    if (!product || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 50) {
      return null;
    }

    const sizePricing = (product.sizePricing as Record<string, number> | null) ?? null;
    const unitPrice = line.size && sizePricing && line.size in sizePricing ? sizePricing[line.size] : product.price;

    items.push({
      productSlug: product.slug,
      productName: product.name,
      unitPrice,
      quantity: line.quantity,
      size: line.size ?? null,
      color: line.color ?? null,
    });
    subtotal += unitPrice * line.quantity;
  }

  const { fee: delivery } = getDeliveryEstimate(subtotal, state);
  return { items, subtotal, delivery, total: subtotal + delivery };
}
