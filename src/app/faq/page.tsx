import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";
import { Accordion, type AccordionItem } from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "FAQ | HEIDIZ Essentialz",
  description: "Answers to common questions about ordering, delivery, returns, and authenticity at HEIDIZ Essentialz.",
};

const FAQ_ITEMS: AccordionItem[] = [
  {
    title: "Are your products authentic?",
    content: (
      <p>
        Yes. Every fragrance and accessory sold at HEIDIZ Essentialz is sourced through
        authorized channels. We do not sell counterfeit or "inspired by" products unless
        explicitly labeled as such.
      </p>
    ),
  },
  {
    title: "How long does delivery take?",
    content: (
      <p>
        Orders within FCT-Abuja typically arrive within 1 to 2 business days. Orders to Lagos,
        Rivers, and other major cities typically take 2 to 4 business days. Delivery is
        complimentary on orders over ₦150,000; otherwise a flat delivery fee applies at
        checkout.
      </p>
    ),
  },
  {
    title: "What payment methods do you accept?",
    content: (
      <p>
        We accept card payments via Paystack, bank transfer, Moniepoint, and pay on delivery
        for orders within FCT-Abuja. Card payments are processed securely; we never see or
        store your card details.
      </p>
    ),
  },
  {
    title: "Can I return or exchange a product?",
    content: (
      <p>
        Unopened, unused items in original packaging can be returned within 7 days of
        delivery. For hygiene reasons, opened perfumes, cosmetics, and skincare cannot be
        returned unless faulty. See our{" "}
        <a href="/shipping-returns" className="text-burnt-orange hover:underline">
          Shipping &amp; Returns
        </a>{" "}
        page for full details.
      </p>
    ),
  },
  {
    title: "How do I track my order?",
    content: (
      <p>
        After checkout, tap "Confirm Order via WhatsApp" to send your order details directly
        to our team. We will confirm and keep you updated on delivery status by WhatsApp or
        phone.
      </p>
    ),
  },
  {
    title: "Do you offer gift wrapping or gift sets?",
    content: (
      <p>
        Select fragrances are available as curated gift sets, and we're happy to arrange gift
        wrapping on request. Add a note at checkout or message us on WhatsApp.
      </p>
    ),
  },
  {
    title: "I'm not sure which fragrance to choose. Can you help?",
    content: (
      <p>
        Absolutely. Message us on WhatsApp with what you usually wear or the occasion you're
        shopping for, and our team will recommend a few options from the collection.
      </p>
    ),
  },
];

export default function FaqPage() {
  return (
    <>
      <CollectionHeader
        eyebrow="Support"
        title="Frequently Asked Questions"
        description="Can't find what you're looking for? Reach us on WhatsApp or the contact page."
        crumbs={[{ label: "FAQ" }]}
      />
      <Container className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <Accordion items={FAQ_ITEMS} defaultOpenIndex={null} />
        </div>
      </Container>
    </>
  );
}
