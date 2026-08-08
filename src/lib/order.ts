import type { Product } from "@/lib/product-types";

// Shared order shape used by both the WhatsApp handoff (src/lib/whatsapp.ts)
// and the email receipt (src/lib/email.ts) built from the same checkout
// submission.
// unitPrice is the price actually charged for this line (the selected
// size's price if the product has one, else the base product price) —
// snapshotted from the cart line rather than re-read from product.price,
// so a per-size price stays correct even if the product's base/other-size
// prices change later.
export type OrderLine = { product: Product; quantity: number; size?: string; color?: string; unitPrice: number };

export type OrderDetails = {
  orderNumber: string;
  customerName: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  notes?: string;
  paymentMethodLabel: string;
  lines: OrderLine[];
  subtotal: number;
  delivery: number;
  total: number;
};
