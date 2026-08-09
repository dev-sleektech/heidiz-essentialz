import type { Metadata } from "next";
import { Gift, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Gift Cards",
  description: "HEIDIZ Essentialz gift cards are coming soon.",
};

export default function GiftCardsPage() {
  return (
    <>
      <CollectionHeader eyebrow="Shop" title="Gift Cards" crumbs={[{ label: "Gift Cards" }]} />

      <Container className="flex flex-col items-center gap-5 py-20 text-center md:py-28">
        <Gift className="h-12 w-12 text-burnt-orange" strokeWidth={1.5} />
        <h2 className="font-display text-2xl text-brand-black">Gift Cards Are Coming Soon</h2>
        <p className="max-w-md text-sm text-charcoal/70">
          We're building a proper gift card experience. In the meantime, browse our{" "}
          <a href="/gift-sets" className="text-burnt-orange hover:underline">
            curated Gift Sets
          </a>
          , or message us on WhatsApp and we'll arrange a gift on your behalf, wrapped and
          ready.
        </p>
        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <ButtonLink href="/gift-sets" variant="primary" size="md">
            Shop Gift Sets
          </ButtonLink>
          <a
            href="https://wa.me/2347053220268"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-button border border-brand-black/70 px-7 py-3 text-sm font-medium text-brand-black transition-all hover:bg-brand-black hover:text-white"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
            Ask About a Gift
          </a>
        </div>
      </Container>
    </>
  );
}
