import Link from "next/link";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { InstagramIcon, FacebookIcon } from "@/components/ui/social-icons";
import { Logo } from "@/components/site/logo";
import { categories } from "@/lib/placeholder-data";

const shopLinks = categories.slice(0, 6);

const helpLinks = [
  { label: "Fragrance Finder", href: "/fragrance-finder" },
  { label: "Contact Us", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Shipping & Returns", href: "/shipping-returns" },
  { label: "Order Tracking", href: "/order-tracking" },
  { label: "Gift Cards", href: "/gift-cards" },
];

const aboutLinks = [
  { label: "Brand Story", href: "/about" },
  { label: "Beauty Journal", href: "/blog" },
  { label: "Sustainability", href: "/sustainability" },
  { label: "Careers", href: "/careers" },
];

export function Footer() {
  return (
    <footer className="bg-brand-black text-white">
      <Container className="grid grid-cols-1 gap-12 py-16 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col gap-4">
          <Logo markClassName="h-14" wordmarkColor="text-white" accentColor="text-champagne" />
          <p className="max-w-xs text-sm text-white/60">
            A global luxury destination for perfumes, beauty, skincare, and
            fashion accessories, curated in FCT-Abuja, Nigeria for those who
            appreciate timeless sophistication.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <a
              href="https://www.instagram.com/heidizessentialz/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-burnt-orange"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <Link
              href="https://facebook.com/HeidizEssentialz"
              aria-label="Facebook"
              className="hover:text-burnt-orange"
            >
              <FacebookIcon className="h-5 w-5" />
            </Link>
            <Link
              href="https://wa.me/2347053220268"
              aria-label="WhatsApp"
              className="hover:text-burnt-orange"
            >
              <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="text-xs tracking-luxury text-champagne">SHOP</h4>
          <ul className="flex flex-col gap-3 text-sm text-white/70">
            {shopLinks.map((cat) => (
              <li key={cat.slug}>
                <Link href={`/category/${cat.slug}`} className="hover:text-white">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="text-xs tracking-luxury text-champagne">SUPPORT</h4>
          <ul className="flex flex-col gap-3 text-sm text-white/70">
            {helpLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <h4 className="pt-2 text-xs tracking-luxury text-champagne">ABOUT</h4>
          <ul className="flex flex-col gap-3 text-sm text-white/70">
            {aboutLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="text-xs tracking-luxury text-champagne">VISIT & CONTACT</h4>
          <ul className="flex flex-col gap-3 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
              Shop GF-31, Block C, Mabushi Ultra Modern Market, Jahi, FCT-Abuja
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <Link href="tel:+2348158851166" className="hover:text-white">
                +234 (0) 815 885 1166
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <Link href="https://wa.me/2347053220268" className="hover:text-white">
                +234 (0) 705 322 0268 (WhatsApp)
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <Link href="mailto:info@heidizstores.com" className="hover:text-white">
                info@heidizstores.com
              </Link>
            </li>
            <li className="text-white/50">Mon - Sat, 9am - 6pm WAT</li>
          </ul>
        </div>
      </Container>

      <div className="hairline opacity-20" />

      <Container className="flex flex-col items-center justify-between gap-4 py-6 text-xs text-white/50 md:flex-row">
        <span className="flex flex-col items-center gap-1 text-center md:items-start md:text-left">
          <span>© {new Date().getFullYear()} HEIDIZ Essentialz. All rights reserved. RC: 9039036</span>
          <a
            href="https://dev-sleektech-website.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white"
          >
            Developed by Dev-Sleek Technologies
          </a>
        </span>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white">Terms of Service</Link>
        </div>
      </Container>
    </footer>
  );
}
