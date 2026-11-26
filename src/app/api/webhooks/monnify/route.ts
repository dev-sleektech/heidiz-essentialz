import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { verifyMonnifyReference } from "@/lib/monnify-server";

// Redundant, more reliable confirmation path alongside the client-triggered
// verify in src/app/api/monnify/verify/route.ts. Configure this URL as your
// webhook in the Monnify dashboard (Settings -> Webhooks):
// https://<your-domain>/api/webhooks/monnify
//
// Security: production webhook requests carry a monnify-signature header —
// HMAC-SHA512 of the raw request body, keyed with the secret key. Monnify's
// own docs note this header is NOT sent on sandbox notifications, so a
// missing header is only accepted when MONNIFY_BASE_URL is still pointed at
// sandbox; in production a missing/invalid signature is rejected. Either
// way, the payload's own claim is never trusted alone — re-verified with
// Monnify's API (verifyMonnifyReference(), same as the popup path) before
// touching the order.
export function isValidSignature(rawBody: string, signature: string, secretKey: string): boolean {
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}

export async function POST(request: Request) {
  const secretKey = process.env.MONNIFY_SECRET_KEY;
  if (!secretKey || secretKey.includes("replace_me")) {
    return NextResponse.json({ received: true });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("monnify-signature");
  const isSandbox = (process.env.MONNIFY_BASE_URL ?? "https://sandbox.monnify.com").includes("sandbox");

  if (signature) {
    if (!isValidSignature(rawBody, signature, secretKey)) {
      return NextResponse.json({ received: false, message: "Invalid signature." }, { status: 401 });
    }
  } else if (!isSandbox) {
    // Live mode always signs — a missing header here is suspicious, not a
    // documented exception like it is in sandbox.
    return NextResponse.json({ received: false, message: "Missing signature." }, { status: 401 });
  }

  let event: { eventType?: string; eventData?: { paymentReference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ received: false, message: "Invalid payload." }, { status: 400 });
  }

  if (event.eventType !== "SUCCESSFUL_TRANSACTION" || !event.eventData?.paymentReference) {
    return NextResponse.json({ received: true });
  }

  try {
    const result = await verifyMonnifyReference(event.eventData.paymentReference);
    if (!result.paid) {
      return NextResponse.json({ received: true });
    }

    // paymentReference IS our orderNumber (see makeOrderNumber() in
    // checkout/page.tsx) — no separate lookup needed. Only advance orders
    // still at PLACED, so this never regresses one staff already moved on.
    //
    // And only when the amount Monnify collected (in naira) covers the order's
    // server-computed total: a successful small charge against a bigger
    // order's reference must not confirm it (see lib/payment-confirmation.ts).
    const order = await prisma.order.findUnique({
      where: { orderNumber: event.eventData.paymentReference },
      select: { total: true },
    });
    if (!order || result.amount === undefined || result.amount < order.total) {
      console.error("[monnify webhook] charge does not cover order total, not confirming", {
        reference: event.eventData.paymentReference,
        amount: result.amount,
        total: order?.total,
      });
      return NextResponse.json({ received: true });
    }
    await prisma.order.updateMany({
      where: { orderNumber: event.eventData.paymentReference, status: "PLACED" },
      data: { status: "PAYMENT_CONFIRMED" },
    });
  } catch (err) {
    console.error("[monnify webhook] error", err);
  }

  return NextResponse.json({ received: true });
}
