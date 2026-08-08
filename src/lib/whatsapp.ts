import { formatNaira } from "@/lib/format";
import type { OrderDetails } from "@/lib/order";

export type { OrderDetails, OrderLine } from "@/lib/order";

// HEIDIZ Essentialz's WhatsApp business line (see footer.tsx). Centralized
// here since checkout now also builds links to it.
export const STORE_WHATSAPP_NUMBER = "2347053220268";

// There's no order backend yet (see project memory), so this is how the
// store actually finds out an order happened: build a pre-filled WhatsApp
// message addressed to the store's line, and let the customer send it with
// one tap from the confirmation screen.
export function buildOrderWhatsAppLink(order: OrderDetails): string {
  const itemLines = order.lines
    .map(({ product, quantity, size, color, unitPrice }) => {
      const options = [size && `Size ${size}`, color].filter(Boolean).join(", ");
      return `- ${product.name}${options ? ` (${options})` : ""} x${quantity} (${formatNaira(unitPrice * quantity)})`;
    })
    .join("\n");

  const message = [
    `Hi HEIDIZ Essentialz, I just placed order ${order.orderNumber}.`,
    "",
    itemLines,
    "",
    `Subtotal: ${formatNaira(order.subtotal)}`,
    `Delivery: ${order.delivery === 0 ? "Complimentary" : formatNaira(order.delivery)}`,
    `Total: ${formatNaira(order.total)}`,
    `Payment method: ${order.paymentMethodLabel}`,
    "",
    `Name: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Delivery address: ${order.address}, ${order.city}, ${order.state}`,
    ...(order.notes ? [`Notes: ${order.notes}`] : []),
  ].join("\n");

  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
