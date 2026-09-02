"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Footer } from "./footer";
import { ChatWidget } from "@/components/chat/chat-widget";
import type { Category } from "@/lib/category-types";

// The storefront Header/Footer don't belong on /admin — it's an internal
// tool with its own sidebar nav (see src/app/admin/layout.tsx), not a
// customer-facing page. Checked by pathname here rather than a route-group
// restructure, since that would mean moving every existing storefront route.
export function SiteChrome({
  children,
  categories,
}: {
  children: React.ReactNode;
  categories: Category[];
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} />
      <ChatWidget />
    </>
  );
}
