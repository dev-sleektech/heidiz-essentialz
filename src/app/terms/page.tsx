import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";

// Generic, honest terms-of-service boilerplate. Placeholder copy standing
// in until the client has this reviewed by a lawyer, same treatment as
// other legal/policy pages on the site.
export const metadata: Metadata = {
  title: "Terms of Service | HEIDIZ Essentialz",
  description: "The terms that govern your use of the HEIDIZ Essentialz website and purchases.",
};

export default function TermsPage() {
  return (
    <>
      <CollectionHeader eyebrow="Legal" title="Terms of Service" crumbs={[{ label: "Terms of Service" }]} />

      <Container className="py-12 md:py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-8 text-sm leading-relaxed text-charcoal/70">
          <p>Last updated: August 2026</p>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl text-brand-black">1. About HEIDIZ Essentialz</h2>
            <p>
              HEIDIZ Essentialz is a luxury beauty, fragrance, and lifestyle retailer based at
              Shop GF-31, Block C, Mabushi Ultra Modern Market, Jahi, FCT-Abuja, Nigeria. By
              using this website or placing an order, you agree to the terms below.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl text-brand-black">2. Orders & Pricing</h2>
            <p>
              All prices are listed in Nigerian Naira (₦) and are subject to change without
              notice. We reserve the right to refuse or cancel an order, including in cases
              of pricing errors, suspected fraud, or stock unavailability.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl text-brand-black">3. Payment</h2>
            <p>
              We accept card payments via Paystack, bank transfer, Moniepoint, and pay on
              delivery within FCT-Abuja. Card payments are processed securely by Paystack; we
              do not store your card details.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl text-brand-black">4. Delivery</h2>
            <p>
              Delivery timelines are estimates, not guarantees, and may vary due to
              circumstances outside our control. See our{" "}
              <a href="/shipping-returns" className="text-burnt-orange hover:underline">
                Shipping &amp; Returns
              </a>{" "}
              page for details.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl text-brand-black">5. Product Authenticity</h2>
            <p>
              All products sold by HEIDIZ Essentialz are sourced through authorized channels.
              Any product marketed as "inspired by" a fragrance house will be clearly labeled
              as such.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl text-brand-black">6. Returns</h2>
            <p>
              Returns and exchanges are handled according to our{" "}
              <a href="/shipping-returns" className="text-burnt-orange hover:underline">
                Shipping &amp; Returns
              </a>{" "}
              policy.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl text-brand-black">7. Limitation of Liability</h2>
            <p>
              HEIDIZ Essentialz is not liable for indirect or consequential loss arising from
              use of this website or its products, beyond the value of the order in question.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl text-brand-black">8. Contact</h2>
            <p>
              Questions about these terms can be sent to info@heidizstores.com or via
              WhatsApp at +234 705 322 0268.
            </p>
          </section>
        </div>
      </Container>
    </>
  );
}
