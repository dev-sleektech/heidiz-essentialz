import { NextRequest, NextResponse } from "next/server";
import { findConversation, listMessages, addMessage, markRead } from "@/lib/chat";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/rate-limit";

// Customer side of the polling loop: GET returns the full thread (widget
// re-fetches this every few seconds while open) and also marks any staff
// replies as read-by-customer, so the unread dot on the closed bubble
// clears once the customer has actually seen the reply. POST sends a new
// customer message. No auth required, guest chat is intentional, same as
// guest checkout; the conversation id itself (opaque, cuid) is the only
// thing gating access to a thread, matching how order-tracking gates by
// order number + phone rather than a login.
// GET limit is generous — the widget legitimately polls every 4s (see
// POLL_INTERVAL_MS in chat-widget.tsx), and several guests/tabs can share
// one IP behind NAT: at 75 calls per tab per 5 minutes, the old limit of
// 150 was tripped by two open tabs on one office/cafe connection, after
// which the widget silently stopped updating (it swallows fetch errors).
// Still bounds a runaway/scripted polling loop.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed, retryAfterSeconds } = checkRateLimit(`chat-messages-get:${clientIp(req)}`, {
    limit: 500,
    windowMs: 5 * 60 * 1000,
  });
  if (!allowed) return rateLimitResponse(retryAfterSeconds);

  const { id } = await params;
  const conversation = await findConversation(id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  await markRead(id, "CUSTOMER");
  const messages = await listMessages(id);
  return NextResponse.json({ messages, status: conversation.status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed, retryAfterSeconds } = checkRateLimit(`chat-messages-post:${clientIp(req)}`, {
    limit: 20,
    windowMs: 5 * 60 * 1000,
  });
  if (!allowed) return rateLimitResponse(retryAfterSeconds);

  const { id } = await params;
  const conversation = await findConversation(id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Message body is required" }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: "Message is too long" }, { status: 400 });
  }

  const message = await addMessage({
    conversationId: id,
    sender: "CUSTOMER",
    senderName: conversation.customerName,
    body: text,
  });

  return NextResponse.json({ message });
}
