import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createConversation } from "@/lib/chat";

// Starts a new conversation. Called once by the customer widget the first
// time someone sends a message (widget then persists the returned id to
// localStorage — see chat-widget.tsx — so a guest returns to the same
// thread on their next visit, matching the cart/wishlist pattern).
export async function POST() {
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
