import { NextRequest, NextResponse } from "next/server";
import { findConversation, listMessages, addMessage, markRead } from "@/lib/chat";

// Customer side of the polling loop: GET returns the full thread (widget
// re-fetches this every few seconds while open) and also marks any staff
// replies as read-by-customer, so the unread dot on the closed bubble
// clears once the customer has actually seen the reply. POST sends a new
// customer message. No auth required, guest chat is intentional, same as
// guest checkout; the conversation id itself (opaque, cuid) is the only
// thing gating access to a thread, matching how order-tracking gates by
// order number + phone rather than a login.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversation = await findConversation(id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  await markRead(id, "CUSTOMER");
  const messages = await listMessages(id);
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
