// Thin wrapper around the official @paystack/inline-js package. Card
// details never touch our code — Paystack's hosted checkout form collects
// them directly. (Earlier version used the raw CDN script + window global,
// but Paystack's legacy inline.js throws unless its own <script> tag is a
// literal DOM descendant of a <form>, which doesn't hold up well against
// Next's script injection. The npm package avoids that entirely.)

// Imported dynamically inside openPaystackCheckout, not at module scope —
// the package touches `window` as soon as it's evaluated, which breaks
// Next's static prerendering of any page that imports this file at build
// time. Deferring the import means it only ever runs in the browser.

export type PaystackSuccessResponse = { reference: string };

type OpenCheckoutOptions = {
  email: string;
  amount: number; // kobo
  currency?: string;
  ref: string;
  metadata?: Record<string, unknown>;
  callback: (response: PaystackSuccessResponse) => void;
  onClose: () => void;
};

export function isPaystackConfigured() {
  const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  return Boolean(key && !key.includes("replace_me"));
}

export async function openPaystackCheckout({
  email,
  amount,
  currency = "NGN",
  ref,
  metadata,
  callback,
  onClose,
}: OpenCheckoutOptions) {
  const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  if (!key) {
    throw new Error("Paystack public key is not configured.");
  }

  const { default: PaystackPop } = await import("@paystack/inline-js");
  const paystack = new PaystackPop();
  paystack.newTransaction({
    key,
    email,
    amount,
    currency,
    reference: ref,
    metadata,
    onSuccess: (transaction: { reference: string }) => callback({ reference: transaction.reference }),
    onCancel: onClose,
    onError: () => onClose(),
  });
}

export async function verifyPaystackTransaction(reference: string): Promise<boolean> {
  const res = await fetch("/api/paystack/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference }),
  });
  const data = await res.json();
  return Boolean(data?.status);
}
