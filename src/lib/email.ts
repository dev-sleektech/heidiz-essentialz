import { formatNaira } from "@/lib/format";
import type { OrderDetails } from "@/lib/order";

// Order confirmation email via Resend (https://resend.com). Same pattern as
// Paystack: gracefully report "not configured" instead of throwing, and this
// must never block the checkout flow — the WhatsApp handoff (src/lib/whatsapp.ts)
// is the reliable fallback if email sending fails or isn't set up yet.

export function isResendConfigured() {
  const key = process.env.RESEND_API_KEY;
  return Boolean(key && !key.includes("replace_me"));
}

const BRAND_ORANGE = "#B5531E";
const BRAND_BLACK = "#000000";
const IVORY = "#F8F6F2";
const CHARCOAL = "#2D2D2D";

// Inline-styled, table-based layout — email clients don't reliably support
// flexbox/grid or external stylesheets.
function buildReceiptEmailHtml(order: OrderDetails): string {
  const itemRows = order.lines
    .map(
      ({ product, quantity, size, color, unitPrice }) => {
        const options = [size && `Size ${size}`, color].filter(Boolean).join(", ");
        return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:14px;color:${CHARCOAL};">
            ${product.name}<br/>
            <span style="color:#999;font-size:12px;">${options ? `${options} &middot; ` : ""}Qty ${quantity}</span>
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:14px;color:${CHARCOAL};white-space:nowrap;">
            ${formatNaira(unitPrice * quantity)}
          </td>
        </tr>`;
      }
    )
    .join("");

  return `
  <div style="background:${IVORY};padding:32px 16px;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:4px;overflow:hidden;">
      <tr>
        <td style="background:${BRAND_BLACK};padding:28px 32px;text-align:center;">
          <div style="font-family:Georgia,serif;color:#ffffff;font-size:22px;letter-spacing:2px;">HEIDIZ</div>
          <div style="color:${BRAND_ORANGE};font-size:11px;letter-spacing:4px;margin-top:2px;">ESSENTIALZ</div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <p style="font-family:Georgia,serif;font-size:22px;color:${BRAND_BLACK};margin:0 0 8px;">Order Confirmed</p>
          <p style="font-size:14px;color:${CHARCOAL};margin:0 0 24px;">
            Thank you for shopping with HEIDIZ Essentialz. Your order
            <strong>${order.orderNumber}</strong> has been confirmed and paid via ${order.paymentMethodLabel}.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0">
            ${itemRows}
            <tr>
              <td style="padding:12px 0;font-family:Arial,sans-serif;font-size:14px;color:${CHARCOAL};">Subtotal</td>
              <td align="right" style="padding:12px 0;font-family:Arial,sans-serif;font-size:14px;color:${CHARCOAL};">${formatNaira(order.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding:0 0 12px;font-family:Arial,sans-serif;font-size:14px;color:${CHARCOAL};">Delivery</td>
              <td align="right" style="padding:0 0 12px;font-family:Arial,sans-serif;font-size:14px;color:${CHARCOAL};">${order.delivery === 0 ? "Complimentary" : formatNaira(order.delivery)}</td>
            </tr>
            <tr>
              <td style="padding:12px 0 0;border-top:2px solid ${BRAND_BLACK};font-family:Georgia,serif;font-size:16px;color:${BRAND_BLACK};">Total</td>
              <td align="right" style="padding:12px 0 0;border-top:2px solid ${BRAND_BLACK};font-family:Georgia,serif;font-size:16px;color:${BRAND_BLACK};">${formatNaira(order.total)}</td>
            </tr>
          </table>

          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #eee;">
            <p style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;color:#999;text-transform:uppercase;margin:0 0 6px;">Delivery Address</p>
            <p style="font-family:Arial,sans-serif;font-size:14px;color:${CHARCOAL};margin:0;">
              ${order.customerName}<br/>
              ${order.address}, ${order.city}, ${order.state}<br/>
              ${order.phone}
            </p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="background:${BRAND_BLACK};padding:20px 32px;text-align:center;">
          <p style="font-family:Arial,sans-serif;font-size:12px;color:#ffffff99;margin:0;">
            Shop GF-31, Block C, Mabushi Ultra Modern Market, Jahi, FCT-Abuja
          </p>
          <p style="font-family:Arial,sans-serif;font-size:12px;color:#ffffff99;margin:4px 0 0;">
            info@heidizstores.com &middot; +234 815 885 1166
          </p>
        </td>
      </tr>
    </table>
  </div>`;
}

type AbandonedCartItem = { slug: string; name: string; price: number; quantity: number };

function buildAbandonedCartEmailHtml(customerName: string | null, items: AbandonedCartItem[], restoreUrl: string): string {
  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:14px;color:${CHARCOAL};">
            ${item.name}<br/>
            <span style="color:#999;font-size:12px;">Qty ${item.quantity}</span>
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:14px;color:${CHARCOAL};white-space:nowrap;">
            ${formatNaira(item.price * item.quantity)}
          </td>
        </tr>`
    )
    .join("");

  return `
  <div style="background:${IVORY};padding:32px 16px;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:4px;overflow:hidden;">
      <tr>
        <td style="background:${BRAND_BLACK};padding:28px 32px;text-align:center;">
          <div style="font-family:Georgia,serif;color:#ffffff;font-size:22px;letter-spacing:2px;">HEIDIZ</div>
          <div style="color:${BRAND_ORANGE};font-size:11px;letter-spacing:4px;margin-top:2px;">ESSENTIALZ</div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <p style="font-family:Georgia,serif;font-size:22px;color:${BRAND_BLACK};margin:0 0 8px;">
            ${customerName ? `${customerName}, y` : "Y"}ou left something behind
          </p>
          <p style="font-size:14px;color:${CHARCOAL};margin:0 0 24px;">
            Your selection is still saved. Complete your order before it's gone.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0">
            ${itemRows}
          </table>

          <div style="margin-top:28px;text-align:center;">
            <a href="${restoreUrl}" style="display:inline-block;background:${BRAND_ORANGE};color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:14px 32px;border-radius:4px;text-decoration:none;">
              Complete Your Order
            </a>
          </div>
        </td>
      </tr>
      <tr>
        <td style="background:${BRAND_BLACK};padding:20px 32px;text-align:center;">
          <p style="font-family:Arial,sans-serif;font-size:12px;color:#ffffff99;margin:0;">
            Shop GF-31, Block C, Mabushi Ultra Modern Market, Jahi, FCT-Abuja
          </p>
          <p style="font-family:Arial,sans-serif;font-size:12px;color:#ffffff99;margin:4px 0 0;">
            info@heidizstores.com &middot; +234 815 885 1166
          </p>
        </td>
      </tr>
    </table>
  </div>`;
}

export async function sendAbandonedCartEmail(
  email: string,
  customerName: string | null,
  items: AbandonedCartItem[],
  restoreUrl: string
): Promise<{ sent: boolean; message: string }> {
  if (!isResendConfigured()) {
    return { sent: false, message: "Email is not configured yet." };
  }

  const from = process.env.RESEND_FROM_EMAIL || "HEIDIZ Essentialz <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: "You left something at HEIDIZ Essentialz",
        html: buildAbandonedCartEmailHtml(customerName, items, restoreUrl),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { sent: false, message: data?.message ?? `Resend responded with ${res.status}.` };
    }
    return { sent: true, message: "Reminder email sent." };
  } catch {
    return { sent: false, message: "Could not reach Resend to send the reminder." };
  }
}

export async function sendOrderReceiptEmail(order: OrderDetails): Promise<{ sent: boolean; message: string }> {
  if (!order.email) {
    return { sent: false, message: "No customer email on file for this order." };
  }
  if (!isResendConfigured()) {
    return { sent: false, message: "Email receipts are not configured yet." };
  }

  const from = process.env.RESEND_FROM_EMAIL || "HEIDIZ Essentialz <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: order.email,
        subject: `Your HEIDIZ Essentialz Order Confirmation — ${order.orderNumber}`,
        html: buildReceiptEmailHtml(order),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { sent: false, message: data?.message ?? `Resend responded with ${res.status}.` };
    }
    return { sent: true, message: "Receipt email sent." };
  } catch {
    return { sent: false, message: "Could not reach Resend to send the receipt." };
  }
}
