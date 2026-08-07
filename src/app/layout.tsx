import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Inter, Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { SiteChrome } from "@/components/site/site-chrome";
import { ProductCatalogProvider } from "@/lib/product-catalog-context";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";

// Brand-matched theming for Clerk's prebuilt <SignIn>/<SignUp>/<UserButton>
// components (see src/app/sign-in, src/app/sign-up).
const clerkAppearance = {
  variables: {
    colorPrimary: "#B5531E",
    colorBackground: "#F8F6F2",
    colorText: "#2D2D2D",
    colorTextOnPrimaryBackground: "#FFFFFF",
    borderRadius: "14px",
    fontFamily: "var(--font-inter)",
  },
  elements: {
    card: "shadow-none border border-black/10",
    headerTitle: "font-display",
  },
};

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HEIDIZ Essentialz | Luxury Beauty & Lifestyle",
  description:
    "HEIDIZ Essentialz is a global luxury brand for perfumes, beauty, skincare, cosmetics, hair care, and fashion accessories. Luxury, elegance & beauty in every detail.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${cormorant.variable} ${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ivory text-charcoal font-sans">
        <ClerkProvider appearance={clerkAppearance}>
          <ProductCatalogProvider>
            <CartProvider>
              <WishlistProvider>
                <SiteChrome>{children}</SiteChrome>
              </WishlistProvider>
            </CartProvider>
          </ProductCatalogProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
