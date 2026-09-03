// Server-only Paystack verification, shared between the client-triggered
// verify route (src/app/api/paystack/verify/route.ts, called right after
// the inline popup reports success) and the webhook route
// (src/app/api/webhooks/paystack/route.ts, a redundant confirmation path
// that also catches payments completed after the customer closed the tab).
// Both ultimately trust only this — never the client-side callback alone.

export function isPaystackServerConfigured() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  return Boolean(key && !key.includes("replace_me"));
}

export async function verifyPaystackReference(reference: string): Promise<{
  paid: boolean;
  message: string;
  /** Gross kobo the customer was actually debited. When the Paystack
   *  account passes the transaction fee to the customer, this is the order
   *  total PLUS that fee, so it does not equal what the order cost. */
  amount?: number;
  /** Kobo we asked Paystack to collect for the order itself, fee excluded.
   *  This is the figure to reconcile an order against. Paystack has
   *  returned it on every transaction since 2022, but it stays optional
   *  here so a missing field degrades to `amount` rather than throwing. */
  requestedAmount?: number;
  /** Paystack's cut, in kobo. Logged on a mismatch so the next person can
   *  see at a glance whether fee-bearing explains the gap. */
  fees?: number;
  currency?: string;
  /** Whatever we attached when opening the checkout. The webhook rebuilds
   *  a missing order from this — see api/webhooks/paystack. */
  metadata?: unknown;
}> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || secretKey.includes("replace_me")) {
    return { paid: false, message: "Paystack secret key is not configured on the server." };
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = await res.json();

  if (!res.ok || !data?.status) {
    return { paid: false, message: data?.message ?? "Verification failed." };
  }

  const paid = data.data?.status === "success";
  return {
    paid,
    message: paid ? "Payment verified." : "Payment was not successful.",
    amount: data.data?.amount,
    requestedAmount: data.data?.requested_amount,
    fees: data.data?.fees,
    currency: data.data?.currency,
    metadata: data.data?.metadata,
  };
}
