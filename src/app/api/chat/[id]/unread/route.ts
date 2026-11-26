import { NextRequest, NextResponse } from "next/server";
import { findConversation, unreadForCustomer } from "@/lib/chat";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/rate-limit";

// Unread count for the customer's closed chat bubble, plus the thread's
// open/ended status.
//
// This has to be its own route because GET /api/chat/[id]/messages marks
// staff replies read-by-customer as a side effect — polling that while the
// panel is closed would clear the badge for a reply nobody had seen yet,
// which is why a staff reply was previously invisible until the customer
// happened to reopen the widget on their own.
//
// Deliberately cheap: a count and a lookup, polled every 15s while closed.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { allowed, retryAfterSeconds } = await checkRateLimit(`chat-unread:${clientIp(req)}`, {
    limit: 300,
    windowMs: 5 * 60 * 1000,
  });
  if (!allowed) return rateLimitResponse(retryAfterSeconds);

  const { id } = await params;
  const conversation = await findConversation(id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const unread = await unreadForCustomer(id);
  return NextResponse.json({ unread, status: conversation.status });
}
