import { NextResponse } from "next/server";
import { isMonnifyServerConfigured, verifyMonnifyReference } from "@/lib/monnify-server";

// Verifies a Monnify transaction server-side. The client-side modal
// (src/lib/monnify.ts) only tells us a charge *appeared* to complete; this
// confirms it with Monnify directly before we treat the order as paid. See
// src/app/api/webhooks/monnify for the redundant webhook-driven
// confirmation path.
export async function POST(request: Request) {
  if (!isMonnifyServerConfigured()) {
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
    const result = await verifyMonnifyReference(reference);
    return NextResponse.json({ status: result.paid, message: result.message, amount: result.amount, currency: result.currency });
  } catch (err) {
    console.error("[monnify verify] error", err);
    return NextResponse.json(
      { status: false, message: "Could not reach Monnify to verify the transaction." },
      { status: 502 }
    );
  }
}
