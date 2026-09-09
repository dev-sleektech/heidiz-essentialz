import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";

// Generic, honest privacy policy boilerplate referencing Nigeria's NDPR.
// Placeholder copy standing in until the client has this reviewed by a
// lawyer, same treatment as other legal/policy pages on the site.
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How HEIDIZ Essentialz collects, uses, and protects your information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <CollectionHeader eyebrow="Legal" title="Privacy Policy" crumbs={[{ label: "Privacy Policy" }]} />

      <Container className="py-12 md:py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-8 text-sm leading-relaxed text-charcoal/70">
          <p>Last updated: August 2026</p>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl text-brand-black">1. Information We Collect</h2>
            <p>
              When you shop with HEIDIZ Essentialz, we collect information you provide
              directly, such as your name, phone number, email address, delivery address, and
              order details. We do not collect or store your card details; card payments are
              processed securely by Paystack.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl text-brand-black">2. How We Use Your Information</h2>
            <p>
              We use your information to process and deliver your orders, communicate with
              you about your purchases via WhatsApp, phone, or email, and improve our
              products and service. We do not sell your personal information to third
              parties.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl text-brand-black">3. Sharing Your Information</h2>
            <p>
              We share your information only with the parties necessary to fulfil your order:
              our payment processor (Paystack), delivery and logistics partners, and, where
              legally required, regulatory authorities.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl text-brand-black">4. Data Protection</h2>
            <p>
              We take reasonable technical and organizational measures to protect your
              information, in line with Nigeria&apos;s Data Protection Regulation (NDPR). We
              retain order information only as long as necessary for legal, accounting, and
              customer service purposes.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl text-brand-black">5. Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal
              information at any time by contacting us at info@heidizstores.com or via
              WhatsApp.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl text-brand-black">6. Contact Us</h2>
            <p>
              Questions about this policy can be sent to info@heidizstores.com or to our
              store at Shop GF-31, Block C, Mabushi Ultra Modern Market, Jahi, FCT-Abuja.
            </p>
          </section>
        </div>
      </Container>
    </>
  );
}
