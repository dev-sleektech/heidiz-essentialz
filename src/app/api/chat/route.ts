import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createConversation } from "@/lib/chat";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/rate-limit";

// Starts a new conversation. Called once by the customer widget the first
// time someone sends a message (widget then persists the returned id to
// localStorage — so a guest returns to the same thread on their next
// visit, matching the cart/wishlist pattern) — rate limited per IP so a
// script can't mint unlimited empty conversations.
export async function POST(request: NextRequest) {
  const { allowed, retryAfterSeconds } = checkRateLimit(`chat-create:${clientIp(request)}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) return rateLimitResponse(retryAfterSeconds);

  const { userId } = await auth();
  const user = userId ? await currentUser() : null;

  const conversation = await createConversation({
    userId,
    customerName: user
      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || null
      : null,
    customerEmail: user?.primaryEmailAddress?.emailAddress ?? null,
  });

  return NextResponse.json({ conversationId: conversation.id });
}
