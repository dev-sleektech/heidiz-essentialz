import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Inter, Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { SiteChrome } from "@/components/site/site-chrome";
import { ProductCatalogProvider } from "@/lib/product-catalog-context";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { jsonLdScript } from "@/lib/json-ld";

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

// Falls back to the live production URL if the env var is somehow unset —
// metadataBase must always resolve to a real absolute URL (Next throws
// without one whenever a page's metadata uses a relative image/OG path).
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://heidiz-essentialz.vercel.app";

const siteDescription =
  "HEIDIZ Essentialz is a global luxury destination for perfumes, beauty, skincare, cosmetics, hair care, and fashion accessories, curated in FCT-Abuja, Nigeria. Shop luxury and niche perfumes, oil perfumes, skincare, makeup, shoes, and home fragrance with nationwide delivery.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HEIDIZ Essentialz | Luxury Beauty & Lifestyle",
    template: "%s | HEIDIZ Essentialz",
  },
  description: siteDescription,
  keywords: [
    "luxury perfumes Nigeria",
    "perfume shop Abuja",
    "oil perfumes",
    "niche perfumes Nigeria",
    "luxury skincare Nigeria",
    "beauty store Abuja",
    "HEIDIZ Essentialz",
  ],
  authors: [{ name: "HEIDIZ Essentialz" }],
  openGraph: {
    type: "website",
    siteName: "HEIDIZ Essentialz",
    title: "HEIDIZ Essentialz | Luxury Beauty & Lifestyle",
    description: siteDescription,
    url: "/",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "HEIDIZ Essentialz | Luxury Beauty & Lifestyle",
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

// Organization schema — helps Google understand the business identity
// (name, logo, contact, social profiles) independent of any one page,
// e.g. for a knowledge panel. Real contact info matches the footer.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "HEIDIZ Essentialz",
  url: siteUrl,
  logo: `${siteUrl}/brand/logo-mark.png`,
  image: `${siteUrl}/brand/logo-mark.png`,
  description: siteDescription,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Shop GF-31, Block C, Mabushi Ultra Modern Market, Jahi",
    addressLocality: "Abuja",
    addressRegion: "FCT",
    addressCountry: "NG",
  },
  telephone: "+2348158851166",
  email: "info@heidizstores.com",
  sameAs: ["https://www.instagram.com/heidizessentialz/", "https://facebook.com/HeidizEssentialz"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${cormorant.variable} ${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ivory text-charcoal font-sans">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd)}
        />
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
