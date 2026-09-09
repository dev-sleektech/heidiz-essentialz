import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";
import { Accordion, type AccordionItem } from "@/components/ui/accordion";
import { jsonLdScript } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about ordering, delivery, returns, and authenticity at HEIDIZ Essentialz.",
  alternates: { canonical: "/faq" },
};

// Each entry carries the answer twice on purpose: `content` is the JSX
// rendered in the accordion, `answerText` is the same words as plain text
// for the FAQPage schema below. Google requires structured data to match
// what a visitor actually sees on the page, so keeping both right next to
// each other, authored together, is what keeps them from drifting apart.
// The alternative (deriving one from the other, or hand-copying separately)
// is exactly how a schema silently goes stale after the next copy edit.
const FAQ_ITEMS: (AccordionItem & { answerText: string })[] = [
  {
    title: "Are your products authentic?",
    answerText:
      "Yes. Every fragrance and accessory sold at HEIDIZ Essentialz is sourced through authorized channels. We do not sell counterfeit or \"inspired by\" products unless explicitly labeled as such.",
    content: (
      <p>
        Yes. Every fragrance and accessory sold at HEIDIZ Essentialz is sourced through
        authorized channels. We do not sell counterfeit or &quot;inspired by&quot; products unless
        explicitly labeled as such.
      </p>
    ),
  },
  {
    title: "How long does delivery take?",
    answerText:
      "Orders within FCT-Abuja typically arrive within 1 to 2 business days. Orders to Lagos, Rivers, and other major cities typically take 2 to 4 business days. Delivery is complimentary on orders over ₦150,000; otherwise a flat delivery fee applies at checkout.",
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
    answerText:
      "We accept card payments via Paystack, bank transfer, Moniepoint, and pay on delivery for orders within FCT-Abuja. Card payments are processed securely; we never see or store your card details.",
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
    answerText:
      "Unopened, unused items in original packaging can be returned within 7 days of delivery. For hygiene reasons, opened perfumes, cosmetics, and skincare cannot be returned unless faulty. See our Shipping & Returns page for full details.",
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
    answerText:
      "After checkout, tap \"Confirm Order via WhatsApp\" to send your order details directly to our team. We will confirm and keep you updated on delivery status by WhatsApp or phone.",
    content: (
      <p>
        After checkout, tap &quot;Confirm Order via WhatsApp&quot; to send your order details directly
        to our team. We will confirm and keep you updated on delivery status by WhatsApp or
        phone.
      </p>
    ),
  },
  {
    title: "Do you offer gift wrapping or gift sets?",
    answerText:
      "Select fragrances are available as curated gift sets, and we're happy to arrange gift wrapping on request. Add a note at checkout or message us on WhatsApp.",
    content: (
      <p>
        Select fragrances are available as curated gift sets, and we&apos;re happy to arrange gift
        wrapping on request. Add a note at checkout or message us on WhatsApp.
      </p>
    ),
  },
  {
    title: "I'm not sure which fragrance to choose. Can you help?",
    answerText:
      "Absolutely. Message us on WhatsApp with what you usually wear or the occasion you're shopping for, and our team will recommend a few options from the collection.",
    content: (
      <p>
        Absolutely. Message us on WhatsApp with what you usually wear or the occasion you&apos;re
        shopping for, and our team will recommend a few options from the collection.
      </p>
    ),
  },
];

// FAQPage rich-result eligibility: real support answers, already live on
// the page, mirrored verbatim rather than summarized.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.title,
    acceptedAnswer: { "@type": "Answer", text: item.answerText },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(faqJsonLd)} />
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
