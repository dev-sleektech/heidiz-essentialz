import { NextResponse } from "next/server";
import { isPaystackServerConfigured, verifyPaystackReference } from "@/lib/paystack-server";

// Verifies a Paystack transaction server-side, using the secret key (never
// exposed to the browser). The client-side inline popup only tells us a
// charge *appeared* to succeed; this confirms it with Paystack directly
// before we treat the order as paid. See src/lib/paystack.ts for the
// client-side trigger, and src/app/api/webhooks/paystack for the redundant
// webhook-driven confirmation path.
export async function POST(request: Request) {
  if (!isPaystackServerConfigured()) {
    return NextResponse.json(
      { status: false, message: "Paystack secret key is not configured on the server." },
      { status: 500 }
    );
  }

  let reference: string | undefined;
  try {
    const body = await request.json();
    reference = body?.reference;
  } catch {
    return NextResponse.json({ status: false, message: "Invalid request body." }, { status: 400 });
  }

  if (!reference) {
    return NextResponse.json({ status: false, message: "Missing transaction reference." }, { status: 400 });
  }

  try {
    const result = await verifyPaystackReference(reference);
    return NextResponse.json({ status: result.paid, message: result.message, amount: result.amount, currency: result.currency });
  } catch {
    return NextResponse.json(
      { status: false, message: "Could not reach Paystack to verify the transaction." },
      { status: 502 }
    );
  }
}
