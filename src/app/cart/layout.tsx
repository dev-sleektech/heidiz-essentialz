import type { Metadata } from "next";

// cart/page.tsx is a client component ("use client", uses useSearchParams
// for the abandoned-cart restore link) — metadata exports only work in
// Server Components, so this layout carries it instead.
export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Your HEIDIZ Essentialz shopping cart.",
  robots: { index: false, follow: false },
};

export default function CartLayout({ children }: LayoutProps<"/cart">) {
  return children;
}
