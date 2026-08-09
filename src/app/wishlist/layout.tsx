import type { Metadata } from "next";

// wishlist/page.tsx is a client component (localStorage-backed) — see the
// same note in src/app/cart/layout.tsx. Noindexed since it's a personal,
// empty-by-default page with no unique content to rank for.
export const metadata: Metadata = {
  title: "Wishlist",
  description: "Your saved HEIDIZ Essentialz favorites.",
  robots: { index: false, follow: false },
};

export default function WishlistLayout({ children }: LayoutProps<"/wishlist">) {
  return children;
}
