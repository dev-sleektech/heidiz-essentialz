import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { isStaffEmail } from "@/lib/staff-auth";
import { findConversation, setConversationStatus } from "@/lib/chat";

// Staff side of "End chat": PATCH { status: "CLOSED" } to end a resolved
// conversation, { status: "OPEN" } to pull it back. Nothing is deleted, so
// the transcript stays available on both sides, and a new message from
// either party reopens the thread anyway (see addMessage in src/lib/chat.ts).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!isStaffEmail(user?.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ updated: false, message: "Not authorized." }, { status: 403 });
  }

  const { id } = await params;
  const conversation = await findConversation(id);
  if (!conversation) {
    return NextResponse.json({ updated: false, message: "Conversation not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (status !== "OPEN" && status !== "CLOSED") {
    return NextResponse.json(
      { updated: false, message: "Status must be OPEN or CLOSED." },
      { status: 400 }
    );
  }

  await setConversationStatus(id, status);
  return NextResponse.json({ updated: true, status });
}
