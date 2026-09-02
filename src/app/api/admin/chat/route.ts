import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { isStaffEmail } from "@/lib/staff-auth";
import { listConversationsForStaff } from "@/lib/chat";

export const dynamic = "force-dynamic";

// List all conversations for the admin inbox, newest activity first.
// Polled by /admin/chat every few seconds, same rhythm as the customer
// widget (see src/app/api/chat/[id]/messages/route.ts).
export async function GET() {
  const user = await currentUser();
  if (!isStaffEmail(user?.primaryEmailAddress?.emailAddress)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const conversations = await listConversationsForStaff();
  return NextResponse.json({ conversations });
}
