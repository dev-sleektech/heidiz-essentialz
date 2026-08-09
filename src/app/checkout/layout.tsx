import type { Metadata } from "next";

// checkout/page.tsx is a client component — see the same note in
// src/app/cart/layout.tsx.
export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your HEIDIZ Essentialz order.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: LayoutProps<"/checkout">) {
  return children;
}
