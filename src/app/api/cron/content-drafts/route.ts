import { NextResponse } from "next/server";
import { generateContentDrafts, isAnthropicConfigured } from "@/lib/ai-agents";
import { sendContentDraftsReadyEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

// Weekly AI marketing drafts (see src/lib/ai-agents.ts): social posts,
// promo copy, and blog ideas drawn from the real catalog, written to the
// ContentDraft table for staff to review at /admin/content. Nothing here
// posts or sends anything on its own. Same CRON_SECRET auth pattern as
// every other cron here.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!isAnthropicConfigured()) {
    return NextResponse.json({ created: 0, message: "Anthropic API key not configured yet." });
  }

  const drafts = await generateContentDrafts();
  if (!drafts || drafts.length === 0) {
    // Either nothing came back (see generateContentDrafts for a logged
    // API-error reason) or the model genuinely returned zero drafts.
    return NextResponse.json({ created: 0, message: "No drafts were generated this run." });
  }

  await prisma.contentDraft.createMany({
    data: drafts.map((d) => ({ type: d.type, title: d.title, body: d.body })),
  });

  const alert = await sendContentDraftsReadyEmail(drafts.length);
  return NextResponse.json({ created: drafts.length, alerted: alert.sent, alertMessage: alert.message });
}
