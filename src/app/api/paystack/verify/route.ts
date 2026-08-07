import { NextResponse } from "next/server";

// Verifies a Paystack transaction server-side, using the secret key (never
// exposed to the browser). The client-side inline popup only tells us a
// charge *appeared* to succeed; this confirms it with Paystack directly
// before we treat the order as paid. See src/lib/paystack.ts for the
// client-side trigger.
export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey || secretKey.includes("replace_me")) {
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
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    const data = await res.json();

    if (!res.ok || !data?.status) {
      return NextResponse.json(
        { status: false, message: data?.message ?? "Verification failed." },
        { status: 502 }
      );
    }

    const paid = data.data?.status === "success";
    return NextResponse.json({
      status: paid,
      message: paid ? "Payment verified." : "Payment was not successful.",
      amount: data.data?.amount,
      currency: data.data?.currency,
    });
  } catch {
    return NextResponse.json(
      { status: false, message: "Could not reach Paystack to verify the transaction." },
      { status: 502 }
    );
  }
}
