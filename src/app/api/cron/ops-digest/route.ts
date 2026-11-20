import { NextResponse } from "next/server";
import { generateOpsDigest, isAnthropicConfigured } from "@/lib/ai-agents";
import { sendOpsDigestEmail } from "@/lib/email";

// Daily AI operations digest (see src/lib/ai-agents.ts): stale orders and
// out-of-stock bestsellers, emailed to staff. Same auth pattern as every
// other cron here: the Cloudflare trigger sends `Authorization: Bearer ${CRON_SECRET}`
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

  const result = await generateOpsDigest();
  if (!result) {
    // Configured but still failed (billing/credits, rate limit, bad key) -
    // generateOpsDigest already logged the real reason server-side.
    return NextResponse.json({ sent: false, message: "Claude call failed. Check server logs for the reason." });
  }

  const emailResult = await sendOpsDigestEmail(result.text, result.data);
  return NextResponse.json({ sent: emailResult.sent, message: emailResult.message, data: result.data });
}
