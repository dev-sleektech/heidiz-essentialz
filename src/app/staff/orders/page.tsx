import { redirect } from "next/navigation";

// Superseded by /admin/orders (part of the real admin dashboard). Kept as a
// redirect so any bookmarked/shared link to the old minimal tool still works.
export default function StaffOrdersRedirect() {
  redirect("/admin/orders");
}
