import "server-only";
import { verifyPaystackReference } from "@/lib/paystack-server";

/**
 * The only way an order may become PAYMENT_CONFIRMED: Paystack itself says the charge
 * succeeded AND that it covered the server-computed order total.
 *
 * Before 2026-11-26 two paths skipped this:
 *  - /api/orders/create marked any order whose payment label mentioned "Paystack" or
 *    "Monnify" as PAYMENT_CONFIRMED on the browser's word, so a direct request could get
 *    a "paid" order without paying at all;
 *  - the Paystack webhook advanced or recovered an order on any successful charge for its
 *    reference, so paying N100 against an order's number confirmed the whole order.
 *
 * Amount rule (same as /api/paystack/verify): compare `requested_amount` (what we asked to
 * collect, before the fee the customer bears) and fall back to `amount`; paying MORE is fine,
 * paying LESS never confirms.
 */
export type PaymentCheck =
  | { outcome: "paid"; paidKobo: number }
  | { outcome: "short"; paidKobo: number; expectedKobo: number }
  | { outcome: "unpaid" }
  | { outcome: "error"; message: string };

export function coversTotal(paidKobo: number | undefined, totalNaira: number): boolean {
  return paidKobo !== undefined && paidKobo >= Math.round(totalNaira * 100);
}

export async function checkPaystackPayment(reference: string, totalNaira: number): Promise<PaymentCheck> {
  try {
    const result = await verifyPaystackReference(reference);
    if (!result.paid) return { outcome: "unpaid" };
    if (result.currency && result.currency !== "NGN") {
      return { outcome: "short", paidKobo: 0, expectedKobo: Math.round(totalNaira * 100) };
    }
    const paidKobo = result.requestedAmount ?? result.amount;
    if (!coversTotal(paidKobo, totalNaira)) {
      return { outcome: "short", paidKobo: paidKobo ?? 0, expectedKobo: Math.round(totalNaira * 100) };
    }
    return { outcome: "paid", paidKobo: paidKobo! };
  } catch (err) {
    return { outcome: "error", message: err instanceof Error ? err.message : String(err) };
  }
}

/** Staff-facing note appended to an order whose payment did not cover its total. */
export function shortPaymentNote(reference: string, paidKobo: number, expectedKobo: number): string {
  const naira = (k: number) => `N${(k / 100).toLocaleString("en-NG")}`;
  return `PAYMENT CHECK: Paystack ref ${reference} paid ${naira(paidKobo)} but the order total is ${naira(expectedKobo)}. Not marked paid. Check before dispatch.`;
}
