import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { isStaffEmail } from "@/lib/staff-auth";

// Answers exactly one question for client components: is the caller staff?
//
// ADMIN_EMAILS is server-only and has to stay that way, so the allow-list
// itself is never shipped to the browser. This returns a single boolean
// about whoever is asking and nothing about anybody else, so it exposes no
// addresses. A signed-out visitor simply gets false.
//
// It exists because the alternative was calling currentUser() in the root
// layout, which wraps every storefront page. That would have opted the
// whole statically prerendered site into dynamic rendering, which is far
// too high a price for a prefill decision.
export async function GET() {
  const user = await currentUser();
  return NextResponse.json({ isStaff: isStaffEmail(user?.primaryEmailAddress?.emailAddress) });
}
