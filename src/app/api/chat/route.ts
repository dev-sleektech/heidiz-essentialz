import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { startConversation } from "@/lib/chat";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/rate-limit";

// Starts a conversation, together with its first message. The widget calls
// this once — when someone sends their opening message after filling in the
// pre-chat name/email form — then persists the returned id to localStorage,
// so a guest returns to the same thread on their next visit, matching the
// cart/wishlist pattern.
//
// Name and email are required (2026-09-02): every guest thread used to
// arrive in the staff inbox labelled only "Guest", which made two
// simultaneous conversations impossible to tell apart. A signed-in
// visitor's Clerk details prefill the form, but what they actually submit
// wins — they may want replies at a different address.
//
// Rate limited per IP so a script can't mint unlimited conversations.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: NextRequest) {
  const { allowed, retryAfterSeconds } = await checkRateLimit(`chat-create:${clientIp(request)}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) return rateLimitResponse(retryAfterSeconds);

  const body = await request.json().catch(() => null);

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const text = typeof body?.body === "string" ? body.body.trim() : "";

  if (name.length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (name.length > 80) {
    return NextResponse.json({ error: "That name is too long." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 160) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "Message body is required" }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: "Message is too long" }, { status: 400 });
  }

  const { userId } = await auth();
  // Only touched to link the thread to an account when one is signed in;
  // the identity shown to staff comes from the form above either way.
  const user = userId ? await currentUser() : null;

  const { conversation, message } = await startConversation({
    userId: user?.id ?? userId,
    customerName: name,
    customerEmail: email,
    body: text,
  });

  return NextResponse.json({ conversationId: conversation.id, message });
}
