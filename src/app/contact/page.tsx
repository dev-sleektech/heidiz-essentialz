import type { Metadata } from "next";
import { MapPin, Phone, Mail, MessageCircle, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass } from "@/lib/form-styles";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with HEIDIZ Essentialz. Visit our Abuja store, call, WhatsApp, or email us.",
  alternates: { canonical: "/contact" },
};


export default function ContactPage() {
  return (
    <>
      <CollectionHeader
        eyebrow="Get in Touch"
        title="Contact Us"
        description="Questions about an order, a fragrance, or a gift? Our team in FCT-Abuja is happy to help."
        crumbs={[{ label: "Contact Us" }]}
      />

      <Container className="grid grid-cols-1 gap-12 py-12 md:py-16 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-6">
          <h2 className="font-display text-xl text-brand-black">Send a Message</h2>
          <form className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Full Name</span>
              <input required type="text" className={inputClass} placeholder="Your full name" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Email</span>
              <input required type="email" className={inputClass} placeholder="you@email.com" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Phone (optional)</span>
              <input type="tel" className={inputClass} placeholder="080X XXX XXXX" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Message</span>
              <textarea required rows={5} className={inputClass} placeholder="How can we help?" />
            </label>
            <Button type="submit" variant="primary" size="md" className="mt-2 self-start">
              Send Message
            </Button>
          </form>
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="font-display text-xl text-brand-black">Visit or Reach Us</h2>
          <div className="flex flex-col gap-5 rounded-[4px] border border-brand-black/10 bg-white p-6">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-burnt-orange" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-brand-black">Store Address</p>
                <p className="text-sm text-charcoal/70">
                  Shop GF-31, Block C, Mabushi Ultra Modern Market, Jahi, FCT-Abuja
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-burnt-orange" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-brand-black">Hotline</p>
                <a href="tel:+2348158851166" className="text-sm text-charcoal/70 hover:text-burnt-orange">
                  +234 (0) 815 885 1166
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-burnt-orange" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-brand-black">WhatsApp</p>
                <a
                  href="https://wa.me/2347053220268"
                  className="text-sm text-charcoal/70 hover:text-burnt-orange"
                >
                  +234 (0) 705 322 0268
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-burnt-orange" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-brand-black">Email</p>
                <a href="mailto:info@heidizstores.com" className="text-sm text-charcoal/70 hover:text-burnt-orange">
                  info@heidizstores.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-burnt-orange" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-brand-black">Business Hours</p>
                <p className="text-sm text-charcoal/70">Monday to Saturday, 9am to 6pm WAT</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="aspect-video w-full overflow-hidden rounded-[4px] border border-brand-black/10">
              <iframe
                title="HEIDIZ Essentialz store location: Mabushi Ultra Modern Market, Jahi, FCT-Abuja"
                src="https://www.google.com/maps?q=Jahi+District,+Abuja,+Nigeria&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Mabushi+Ultra+Modern+Market,+Jahi,+Abuja,+Nigeria"
              target="_blank"
              rel="noopener noreferrer"
              className="self-start text-sm text-burnt-orange hover:underline"
            >
              Get Directions
            </a>
          </div>
        </div>
      </Container>
    </>
  );
}
