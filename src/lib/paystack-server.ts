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
  amount?: number;
  currency?: string;
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
    currency: data.data?.currency,
  };
}
