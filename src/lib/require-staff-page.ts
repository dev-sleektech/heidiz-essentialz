import "server-only";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { isStaffEmail } from "@/lib/staff-auth";

/**
 * Staff gate for every admin PAGE. Call it as the first line of each page under
 * src/app/admin/(protected).
 *
 * The admin layout runs the same check, but a layout is not a security boundary in the
 * App Router: on a client-side navigation request (RSC: 1 + Next-Router-State-Tree) the
 * server skips the layouts the client says it already has and renders only the page. A
 * crafted request with no session therefore got /admin/orders' data back (verified on
 * the live site 2026-11-26). Each page has to check for itself; the layout's check stays
 * as the fast path for normal visits.
 */
export async function requireStaffPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/sign-in");
  if (!isStaffEmail(user.primaryEmailAddress?.emailAddress)) redirect("/");
  return user;
}
