import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import { LayoutDashboard, Package, ShoppingBag, Wallet, MessageCircle, LogOut } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { isStaffEmail } from "@/lib/staff-auth";
import { unreadCountForStaff } from "@/lib/chat";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/products", label: "Products", icon: ShoppingBag },
  { href: "/admin/transactions", label: "Transactions", icon: Wallet },
  { href: "/admin/chat", label: "Live Chat", icon: MessageCircle },
];

// Single gate for the whole /admin tree — every page under here inherits
// this check instead of repeating it. The API routes each admin page calls
// (e.g. /api/staff/orders/[orderNumber]/status) still re-check server-side
// too, as defense in depth against this layout check alone.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  if (!isStaffEmail(email)) {
    redirect("/");
  }

  // Snapshot at page-load time, not live: the sidebar is a server
  // component and doesn't poll. The /admin/chat page itself polls the
  // conversation list every few seconds once you're actually in there.
  const unreadChatCount = await unreadCountForStaff();

  return (
    <div className="flex min-h-full bg-ivory">
      <aside className="flex w-64 shrink-0 flex-col border-r border-brand-black/10 bg-brand-black text-white">
        <div className="px-6 py-6">
          <Logo markClassName="h-8" showWordmark={false} />
          <p className="mt-3 font-display text-lg tracking-wide">Admin</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-button px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <item.icon className="h-4 w-4" strokeWidth={1.5} />
              {item.label}
              {item.href === "/admin/chat" && unreadChatCount > 0 && (
                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-burnt-orange px-1.5 text-xs font-semibold text-white">
                  {unreadChatCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 px-6 py-5">
          <p className="truncate text-xs text-white/50">Signed in as</p>
          <p className="truncate text-sm text-white/90">{email}</p>
          <SignOutButton redirectUrl="/">
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-2 text-xs text-white/60 hover:text-burnt-orange"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </aside>

      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
