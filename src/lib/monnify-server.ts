// Server-only Monnify verification, shared between the client-triggered
// verify route (src/app/api/monnify/verify/route.ts) and the webhook route
// (src/app/api/webhooks/monnify/route.ts). See paystack-server.ts for the
// same pattern on the Paystack side.

const BASE_URL = process.env.MONNIFY_BASE_URL ?? "https://sandbox.monnify.com";

export function isMonnifyServerConfigured() {
  const apiKey = process.env.NEXT_PUBLIC_MONNIFY_API_KEY;
  const secretKey = process.env.MONNIFY_SECRET_KEY;
  return Boolean(
    apiKey && secretKey && !apiKey.includes("replace_me") && !secretKey.includes("replace_me")
  );
}

async function getAccessToken(): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_MONNIFY_API_KEY;
  const secretKey = process.env.MONNIFY_SECRET_KEY;
  if (!apiKey || !secretKey) return null;

  const basicAuth = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { Authorization: `Basic ${basicAuth}`, "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok || !data?.requestSuccessful) return null;
  return data.responseBody?.accessToken ?? null;
}

// Retries a few times on PENDING — the webhook (or the popup's onComplete)
// can arrive a beat before Monnify's own backend finishes settling the
// charge. See src/app/api/monnify/verify/route.ts for the original version
// of this comment/logic, now shared here.
export async function verifyMonnifyReference(reference: string): Promise<{
  paid: boolean;
  message: string;
  amount?: number;
  currency?: string;
}> {
  if (!isMonnifyServerConfigured()) {
    return { paid: false, message: "Monnify keys are not configured on the server." };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { paid: false, message: "Could not authenticate with Monnify." };
  }

  let data: { requestSuccessful?: boolean; responseMessage?: string; responseBody?: { paymentStatus?: string; amountPaid?: number; currencyCode?: string } } | undefined;
  let ok = false;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(
      `${BASE_URL}/api/v1/transactions/verify_by_reference?reference=${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    data = await res.json();
    ok = res.ok;

    if (ok && data?.requestSuccessful && data.responseBody?.paymentStatus === "PAID") break;
    if (ok && data?.requestSuccessful && data.responseBody?.paymentStatus && data.responseBody.paymentStatus !== "PENDING") break;
    if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
  }

  if (!ok || !data?.requestSuccessful) {
    return { paid: false, message: data?.responseMessage ?? "Verification failed." };
  }

  const paid = data.responseBody?.paymentStatus === "PAID";
  return {
    paid,
    message: paid ? "Payment verified." : `Payment status: ${data.responseBody?.paymentStatus ?? "unknown"}.`,
    amount: data.responseBody?.amountPaid,
    currency: data.responseBody?.currencyCode,
  };
}
