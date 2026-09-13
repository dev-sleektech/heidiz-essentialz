import { NextResponse } from "next/server";
import { generateWeeklyFinanceDigest, isAnthropicConfigured } from "@/lib/ai-agents";
import { sendFinanceDigestEmail } from "@/lib/email";

// Weekly AI finance digest (see src/lib/ai-agents.ts): this week vs the
// prior week, with the trend called out in plain language. Runs Mondays,
// after the daily sales-summary cron so it doesn't compete for the same
// minute. Same CRON_SECRET auth pattern as every other cron here.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!isAnthropicConfigured()) {
    return NextResponse.json({ sent: false, message: "Anthropic API key not configured yet." });
  }

  const result = await generateWeeklyFinanceDigest();
  if (!result) {
    // Configured but still failed (billing/credits, rate limit, bad key) -
    // generateWeeklyFinanceDigest already logged the real reason server-side.
    return NextResponse.json({ sent: false, message: "Claude call failed. Check server logs for the reason." });
  }

  const emailResult = await sendFinanceDigestEmail(result.text, result.stats);
  return NextResponse.json({ sent: emailResult.sent, message: emailResult.message, stats: result.stats });
}
