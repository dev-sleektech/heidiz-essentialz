import { NextResponse } from "next/server";

// Verifies a Monnify transaction server-side. Unlike Paystack (one secret
// key used directly as a Bearer token), Monnify requires exchanging the API
// key + secret key for a short-lived access token first, then using that
// token to query the transaction. The client-side modal (src/lib/monnify.ts)
// only tells us a charge *appeared* to complete; this confirms it with
// Monnify directly before we treat the order as paid.
const BASE_URL = process.env.MONNIFY_BASE_URL ?? "https://sandbox.monnify.com";

async function getAccessToken(apiKey: string, secretKey: string): Promise<string | null> {
  const basicAuth = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { Authorization: `Basic ${basicAuth}`, "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok || !data?.requestSuccessful) return null;
  return data.responseBody?.accessToken ?? null;
}

export async function POST(request: Request) {
  const apiKey = process.env.NEXT_PUBLIC_MONNIFY_API_KEY;
  const secretKey = process.env.MONNIFY_SECRET_KEY;

  if (!apiKey || !secretKey || apiKey.includes("replace_me") || secretKey.includes("replace_me")) {
    return NextResponse.json(
      { status: false, message: "Monnify keys are not configured on the server." },
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
    const accessToken = await getAccessToken(apiKey, secretKey);
    if (!accessToken) {
      console.error("[monnify verify] could not authenticate");
      return NextResponse.json(
        { status: false, message: "Could not authenticate with Monnify." },
        { status: 502 }
      );
    }

    // The onComplete callback can fire a beat before Monnify's own backend
    // finishes settling the charge (card processing isn't instant even once
    // the widget says "done") — retry a few times before giving up, rather
    // than failing on what's really just a race.
    let data: Record<string, unknown> | undefined;
    let ok = false;
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await fetch(
        `${BASE_URL}/api/v1/transactions/verify_by_reference?reference=${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      data = await res.json();
      ok = res.ok;
      console.log(`[monnify verify] attempt ${attempt} reference=${reference} status=${res.status} body=${JSON.stringify(data)}`);

      const responseBody = data as { requestSuccessful?: boolean; responseBody?: { paymentStatus?: string } };
      if (ok && responseBody.requestSuccessful && responseBody.responseBody?.paymentStatus === "PAID") {
        break; // confirmed paid, no need to keep retrying
      }
      if (ok && responseBody.requestSuccessful && responseBody.responseBody?.paymentStatus && responseBody.responseBody.paymentStatus !== "PENDING") {
        break; // a definitive non-pending outcome (FAILED, EXPIRED, etc.) — no point retrying
      }
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
    }

    const typedData = data as { requestSuccessful?: boolean; responseMessage?: string; responseBody?: { paymentStatus?: string; amountPaid?: number; currencyCode?: string } } | undefined;

    if (!ok || !typedData?.requestSuccessful) {
      return NextResponse.json(
        { status: false, message: typedData?.responseMessage ?? "Verification failed." },
        { status: 502 }
      );
    }

    const paid = typedData.responseBody?.paymentStatus === "PAID";
    return NextResponse.json({
      status: paid,
      message: paid ? "Payment verified." : `Payment status: ${typedData.responseBody?.paymentStatus ?? "unknown"}.`,
      amount: typedData.responseBody?.amountPaid,
      currency: typedData.responseBody?.currencyCode,
    });
  } catch (err) {
    console.error("[monnify verify] error", err);
    return NextResponse.json(
      { status: false, message: "Could not reach Monnify to verify the transaction." },
      { status: 502 }
    );
  }
}
