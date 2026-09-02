import { NextRequest, NextResponse } from "next/server";
import { findConversation, setConversationStatus } from "@/lib/chat";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/rate-limit";

// Customer side of "End chat". Marks the thread CLOSED so it drops out of
// the staff inbox's open filter and stops looking like it's waiting on a
// reply. The transcript is kept: the widget still shows it, and staff can
// reopen from /admin/chat. Writing another message reopens it either way
// (see addMessage in src/lib/chat.ts).
//
// Unauthenticated for the same reason the rest of the customer chat routes
// are: the cuid conversation id is the capability. The worst a leaked id
// buys is ending a conversation that any new message reopens.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed, retryAfterSeconds } = checkRateLimit(`chat-close:${clientIp(req)}`, {
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) return rateLimitResponse(retryAfterSeconds);

  const { id } = await params;
  const conversation = await findConversation(id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  await setConversationStatus(id, "CLOSED");
  return NextResponse.json({ closed: true });
}
