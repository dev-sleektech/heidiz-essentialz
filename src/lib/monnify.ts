// Monnify's checkout is a global <script src> widget, not an npm package
// (unlike Paystack's @paystack/inline-js) — this loads it once and exposes
// the same openXCheckout/verifyXTransaction shape as src/lib/paystack.ts so
// checkout/page.tsx can treat both providers identically.

const SDK_URL = "https://sdk.monnify.com/plugin/monnify.js";

declare global {
  interface Window {
    MonnifySDK?: {
      initialize: (options: Record<string, unknown>) => void;
    };
  }
}

export type MonnifySuccessResponse = { reference: string };

type OpenCheckoutOptions = {
  email: string;
  amount: number; // naira, not kobo — Monnify takes the amount as-is
  customerName: string;
  ref: string;
  callback: (response: MonnifySuccessResponse) => void;
  onClose: () => void;
};

export function isMonnifyConfigured() {
  const key = process.env.NEXT_PUBLIC_MONNIFY_API_KEY;
  const contractCode = process.env.NEXT_PUBLIC_MONNIFY_CONTRACT_CODE;
  return Boolean(key && !key.includes("replace_me") && contractCode && !contractCode.includes("replace_me"));
}

let sdkLoadPromise: Promise<void> | null = null;

function loadMonnifySdk(): Promise<void> {
  if (typeof window !== "undefined" && window.MonnifySDK) {
    return Promise.resolve();
  }
  if (!sdkLoadPromise) {
    sdkLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SDK_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load the Monnify checkout script."));
      document.head.appendChild(script);
    });
  }
  return sdkLoadPromise;
}

export async function openMonnifyCheckout({
  email,
  amount,
  customerName,
  ref,
  callback,
  onClose,
}: OpenCheckoutOptions) {
  const apiKey = process.env.NEXT_PUBLIC_MONNIFY_API_KEY;
  const contractCode = process.env.NEXT_PUBLIC_MONNIFY_CONTRACT_CODE;
  if (!apiKey || !contractCode) {
    throw new Error("Monnify API key/contract code is not configured.");
  }

  await loadMonnifySdk();
  if (!window.MonnifySDK) {
    throw new Error("Monnify checkout script failed to load.");
  }

  window.MonnifySDK.initialize({
    amount,
    currency: "NGN",
    reference: ref,
    customerFullName: customerName,
    customerEmail: email,
    apiKey,
    contractCode,
    paymentDescription: "HEIDIZ Essentialz order",
    isTestMode: process.env.NEXT_PUBLIC_MONNIFY_TEST_MODE !== "false",
    // Our own `ref` (set above) is what we verify server-side — never trust
    // the shape of Monnify's onComplete response for the reference itself,
    // only use it as a success signal to trigger verification.
    onComplete: () => callback({ reference: ref }),
    onClose: () => onClose(),
  });
}

export type VerifyLine = { slug: string; quantity: number; size?: string; color?: string };

// items/state let the server recompute the real order total from the
// Product table and confirm the amount actually charged matches it — see
// src/lib/order-pricing.ts. Without this, a client-tampered cart could pay
// less than the true cost and still be treated as fully paid.
export async function verifyMonnifyTransaction(reference: string, items: VerifyLine[], state: string): Promise<boolean> {
  const res = await fetch("/api/monnify/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference, items, state }),
  });
  const data = await res.json();
  return Boolean(data?.status);
}
