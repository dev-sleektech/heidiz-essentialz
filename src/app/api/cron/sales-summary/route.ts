import { NextResponse } from "next/server";
import { generateDailySummary, isAnthropicConfigured } from "@/lib/ai-summary";
import { sendSalesSummaryEmail } from "@/lib/email";

// Triggered daily by Vercel Cron (see vercel.json), same auth pattern as
// the abandoned-cart cron: Vercel sends `Authorization: Bearer ${CRON_SECRET}`
// automatically on cron-triggered requests, verified below.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!isAnthropicConfigured()) {
    return NextResponse.json({ sent: false, message: "Anthropic API key not configured yet." });
  }

  const result = await generateDailySummary();
  if (!result) {
    return NextResponse.json({ sent: false, message: "Anthropic API key not configured yet." });
  }

  const emailResult = await sendSalesSummaryEmail(result.text, result.stats);
  return NextResponse.json({ sent: emailResult.sent, message: emailResult.message, stats: result.stats });
}
