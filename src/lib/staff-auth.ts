// Deliberately minimal: no roles table, just an allow-list of emails
// checked against the signed-in Clerk user. Gates the /admin dashboard
// (dashboard home + order management) and its API routes.
export function isStaffEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowList = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowList.includes(email.toLowerCase());
}
