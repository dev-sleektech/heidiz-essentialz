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

// The persisted shape of an order, as stored by the checkout and read back
// later. Declared structurally rather than importing Prisma's generated
// types so this module stays free of a database dependency, since it is
// also pulled into client bundles through src/lib/whatsapp.ts.
export type StoredOrder = {
  orderNumber: string;
  customerName: string;
  email: string | null;
  phone: string;
  address: string;
  city: string;
  state: string;
  notes: string | null;
  paymentMethodLabel: string;
  subtotal: number;
  delivery: number;
  total: number;
  items: {
    productSlug: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    size: string | null;
    color: string | null;
  }[];
};

// Rebuilds OrderDetails from a stored order so a receipt can be sent again
// after checkout is over. The checkout builds the same shape from the live
// cart; this builds it from what was actually persisted, which is the only
// trustworthy source once the customer has gone.
//
// One asymmetry to know about: OrderLine carries a full Product, but an
// OrderItem only snapshots slug, name and unit price. That snapshot is
// deliberate, so a reprinted receipt shows what was bought rather than what
// the catalog says today. The receipt template reads only product.name, so
// the remaining fields are inert filler rather than a catalog lookup. Do
// not read them expecting real product data, and if the template ever needs
// more than the name, snapshot that field on OrderItem instead of resolving
// it here.
export function orderDetailsFromStored(order: StoredOrder): OrderDetails {
  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    email: order.email ?? undefined,
    phone: order.phone,
    address: order.address,
    city: order.city,
    state: order.state,
    notes: order.notes ?? undefined,
    paymentMethodLabel: order.paymentMethodLabel,
    subtotal: order.subtotal,
    delivery: order.delivery,
    total: order.total,
    lines: order.items.map((item) => ({
      quantity: item.quantity,
      size: item.size ?? undefined,
      color: item.color ?? undefined,
      unitPrice: item.unitPrice,
      product: {
        slug: item.productSlug,
        name: item.productName,
        price: item.unitPrice,
        category: "",
        categorySlug: "",
        icon: "perfume",
        images: [],
        sizes: [],
        colors: [],
        description: "",
        benefits: [],
        directions: "",
        rating: 0,
        reviewCount: 0,
        inStock: true,
      },
    })),
  };
}
