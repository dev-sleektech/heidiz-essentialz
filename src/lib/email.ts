import { formatNaira } from "@/lib/format";
import type { OrderDetails } from "@/lib/order";
import type { DailyStats } from "@/lib/ai-summary";

// Order confirmation email via Resend (https://resend.com). Same pattern as
// Paystack: gracefully report "not configured" instead of throwing, and this
// must never block the checkout flow — the WhatsApp handoff (src/lib/whatsapp.ts)
// is the reliable fallback if email sending fails or isn't set up yet.

export function isResendConfigured() {
  const key = process.env.RESEND_API_KEY;
  return Boolean(key && !key.includes("replace_me"));
}

// Every template below interpolates customer-submitted checkout fields
// (name, address, city, state, phone) straight into an HTML string sent as
// a real email via Resend. None of that is JSX, so nothing here gets
// React's automatic escaping — a customer typing `<img src=x onerror=...>`
// as their name would otherwise ship as live HTML/script in the email.
// Escape every interpolated value that can trace back to user input before
// it goes in the template.
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
        const options = [size && `Size ${escapeHtml(size)}`, color && escapeHtml(color)].filter(Boolean).join(", ");
        return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:14px;color:${CHARCOAL};">
            ${escapeHtml(product.name)}<br/>
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
            <strong>${escapeHtml(order.orderNumber)}</strong> has been confirmed and paid via ${escapeHtml(order.paymentMethodLabel)}.
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
              ${escapeHtml(order.customerName)}<br/>
              ${escapeHtml(order.address)}, ${escapeHtml(order.city)}, ${escapeHtml(order.state)}<br/>
              ${escapeHtml(order.phone)}
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
            ${escapeHtml(item.name)}<br/>
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
            ${customerName ? `${escapeHtml(customerName)}, y` : "Y"}ou left something behind
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

const STATUS_LABELS: Record<string, string> = {
  PLACED: "Order Placed",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  PROCESSING: "Processing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_MESSAGES: Record<string, string> = {
  PROCESSING: "We're getting your order ready.",
  OUT_FOR_DELIVERY: "Your rider is on the way. Expect your order shortly.",
  DELIVERED: "Your order has been delivered. Thank you for shopping with us.",
  CANCELLED: "This order has been cancelled. Reach out to us on WhatsApp if that's unexpected.",
};

function buildStatusUpdateEmailHtml(orderNumber: string, customerName: string, status: string, trackingUrl: string): string {
  const label = STATUS_LABELS[status] ?? status;
  const message = STATUS_MESSAGES[status] ?? "There's an update on your order.";

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
          <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;color:${BRAND_ORANGE};text-transform:uppercase;margin:0 0 8px;">Order ${escapeHtml(orderNumber)}</p>
          <p style="font-family:Georgia,serif;font-size:22px;color:${BRAND_BLACK};margin:0 0 8px;">${escapeHtml(label)}</p>
          <p style="font-size:14px;color:${CHARCOAL};margin:0 0 24px;">
            Hi ${escapeHtml(customerName)}, ${escapeHtml(message)}
          </p>
          <div style="text-align:center;">
            <a href="${trackingUrl}" style="display:inline-block;background:${BRAND_ORANGE};color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:14px 32px;border-radius:4px;text-decoration:none;">
              Track Your Order
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

// Sent whenever staff moves an order to a new status from /admin/orders (see
// src/app/api/staff/orders/[orderNumber]/status/route.ts). Only PROCESSING/
// OUT_FOR_DELIVERY/DELIVERED/CANCELLED get a real message copy — PLACED and
// PAYMENT_CONFIRMED are already covered by the checkout-time receipt email,
// so this fires only for statuses set later. Same "never block the request"
// contract as the other email helpers here.
export async function sendOrderStatusEmail(params: {
  email: string | null;
  orderNumber: string;
  customerName: string;
  status: string;
}): Promise<{ sent: boolean; message: string }> {
  if (!params.email) {
    return { sent: false, message: "No customer email on file for this order." };
  }
  if (!isResendConfigured()) {
    return { sent: false, message: "Email is not configured yet." };
  }

  const from = process.env.RESEND_FROM_EMAIL || "HEIDIZ Essentialz <onboarding@resend.dev>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3300";
  const trackingUrl = `${siteUrl}/order-tracking?orderNumber=${encodeURIComponent(params.orderNumber)}`;
  const label = STATUS_LABELS[params.status] ?? params.status;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: params.email,
        subject: `Your HEIDIZ order ${params.orderNumber}: ${label}`,
        html: buildStatusUpdateEmailHtml(params.orderNumber, params.customerName, params.status, trackingUrl),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { sent: false, message: data?.message ?? `Resend responded with ${res.status}.` };
    }
    return { sent: true, message: "Status update email sent." };
  } catch {
    return { sent: false, message: "Could not reach Resend to send the status update." };
  }
}

// Internal alert to staff (ADMIN_EMAILS) when a product flips to out of
// stock — see the admin product-update route. Not a "low stock" warning:
// Product only tracks inStock as a boolean, there's no quantity field to
// threshold against (see the "still not built" note in project memory).
export async function sendOutOfStockAlertEmail(product: { name: string; slug: string }): Promise<{ sent: boolean; message: string }> {
  const to = (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim();
  if (!to) {
    return { sent: false, message: "No ADMIN_EMAILS configured to alert." };
  }
  if (!isResendConfigured()) {
    return { sent: false, message: "Email is not configured yet." };
  }

  const from = process.env.RESEND_FROM_EMAIL || "HEIDIZ Essentialz <onboarding@resend.dev>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3300";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `Out of stock: ${product.name}`,
        html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:${CHARCOAL};padding:24px;">
          <p><strong>${escapeHtml(product.name)}</strong> just went out of stock.</p>
          <p><a href="${siteUrl}/admin/products/${product.slug}" style="color:${BRAND_ORANGE};">Update it in the admin</a></p>
        </div>`,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { sent: false, message: data?.message ?? `Resend responded with ${res.status}.` };
    }
    return { sent: true, message: "Out-of-stock alert sent." };
  } catch {
    return { sent: false, message: "Could not reach Resend to send the alert." };
  }
}

// Alerts staff when Paystack has taken money we have no order for.
//
// This exists because of the 2026-08-26 to 2026-09-03 outage: a bug
// rejected every card payment after the customer had already been charged,
// so no order was ever written. Eight days passed before anyone noticed,
// and only because a customer complained. The bug is fixed; the blind spot
// it exposed is what this closes.
export async function sendPaymentMismatchAlertEmail(params: {
  orphanCount: number;
  totalNaira: number;
  references: string[];
  sinceLabel: string;
}): Promise<{ sent: boolean; message: string }> {
  const to = (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim();
  if (!to) {
    return { sent: false, message: "No ADMIN_EMAILS configured to alert." };
  }
  if (!isResendConfigured()) {
    return { sent: false, message: "Email is not configured yet." };
  }

  const from = process.env.RESEND_FROM_EMAIL || "HEIDIZ Essentialz <onboarding@resend.dev>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3300";
  const list = params.references
    .slice(0, 25)
    .map((r) => `<li style="margin-bottom:4px;"><code>${escapeHtml(r)}</code></li>`)
    .join("");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `Action needed: ${params.orphanCount} payment(s) with no order`,
        html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:${CHARCOAL};padding:24px;">
          <p><strong>${params.orphanCount} successful payment(s) since ${escapeHtml(params.sinceLabel)} have no matching order.</strong></p>
          <p>Customers have been charged a total of <strong>NGN ${params.totalNaira.toLocaleString()}</strong> for orders that were never recorded. They are waiting on goods nobody has been told to send.</p>
          <p>References:</p>
          <ul style="padding-left:18px;">${list}</ul>
          <p style="margin-top:16px;">Run <code>node scripts/reconcile-paystack.mjs</code> for the full breakdown, including anyone charged more than once.</p>
          <p><a href="${siteUrl}/admin/orders" style="color:${BRAND_ORANGE};">Open the admin</a></p>
        </div>`,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { sent: false, message: data?.message ?? `Resend responded with ${res.status}.` };
    }
    return { sent: true, message: "Payment mismatch alert sent." };
  } catch {
    return { sent: false, message: "Could not reach Resend to send the alert." };
  }
}

// Daily AI-generated sales digest (see src/lib/ai-summary.ts), sent to
// ADMIN_EMAILS by the sales-summary cron job. `summaryText` is Claude's
// generated paragraph; the stat cards below it are computed directly from
// the DB (not AI-generated) so the headline numbers are always exact, not
// paraphrased.
export async function sendSalesSummaryEmail(summaryText: string, stats: DailyStats): Promise<{ sent: boolean; message: string }> {
  const to = (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim();
  if (!to) {
    return { sent: false, message: "No ADMIN_EMAILS configured to send the summary to." };
  }
  if (!isResendConfigured()) {
    return { sent: false, message: "Email is not configured yet." };
  }

  const from = process.env.RESEND_FROM_EMAIL || "HEIDIZ Essentialz <onboarding@resend.dev>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3300";

  const statCard = (label: string, value: string) => `
    <td style="padding:16px;background:${IVORY};border-radius:4px;" width="50%">
      <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;color:#999;text-transform:uppercase;margin:0 0 4px;">${escapeHtml(label)}</p>
      <p style="font-family:Georgia,serif;font-size:20px;color:${BRAND_BLACK};margin:0;">${escapeHtml(value)}</p>
    </td>`;

  const html = `
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
          <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;color:${BRAND_ORANGE};text-transform:uppercase;margin:0 0 8px;">Daily Sales Summary</p>
          <p style="font-family:Georgia,serif;font-size:20px;color:${BRAND_BLACK};margin:0 0 20px;">${escapeHtml(stats.dateLabel)}</p>

          <p style="font-size:14px;line-height:1.6;color:${CHARCOAL};margin:0 0 24px;">${escapeHtml(summaryText)}</p>

          <table width="100%" cellpadding="0" cellspacing="8">
            <tr>
              ${statCard("Orders", String(stats.orderCount))}
              ${statCard("Revenue", formatNaira(stats.revenue))}
            </tr>
            <tr>
              ${statCard("Needs Attention", String(stats.needsAttentionCount))}
              ${statCard("Cancelled", String(stats.cancelledCount))}
            </tr>
          </table>

          <div style="margin-top:24px;text-align:center;">
            <a href="${siteUrl}/admin" style="display:inline-block;background:${BRAND_ORANGE};color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:4px;text-decoration:none;">
              Open Admin Dashboard
            </a>
          </div>
        </td>
      </tr>
    </table>
  </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `HEIDIZ sales summary: ${stats.dateLabel}`,
        html,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { sent: false, message: data?.message ?? `Resend responded with ${res.status}.` };
    }
    return { sent: true, message: "Sales summary email sent." };
  } catch {
    return { sent: false, message: "Could not reach Resend to send the summary." };
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
        subject: `Your HEIDIZ Essentialz Order Confirmation: ${order.orderNumber}`,
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
