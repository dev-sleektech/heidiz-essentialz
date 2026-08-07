import type { Product } from "@/lib/product-types";

// Shared order shape used by both the WhatsApp handoff (src/lib/whatsapp.ts)
// and the email receipt (src/lib/email.ts) built from the same checkout
// submission.
export type OrderLine = { product: Product; quantity: number };

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
