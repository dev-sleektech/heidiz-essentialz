import type { Metadata } from "next";

// Covers /account and every subroute (orders, order detail) — private,
// signed-in-only pages with no SEO value, so noindex applies once here
// rather than repeating it on each page's own metadata export.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return children;
}
