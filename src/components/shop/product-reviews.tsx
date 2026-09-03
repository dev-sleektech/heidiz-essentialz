import { MessageCircle } from "lucide-react";
import { STORE_WHATSAPP_NUMBER } from "@/lib/whatsapp";
import type { Product } from "@/lib/product-types";

// Honest empty state, replacing the rotating placeholder reviews that used
// to render here (2026-09-03).
//
// There is no Review model in the schema, so nothing on this page could ever
// have been a real customer review. What shipped instead was a pool of three
// invented quotes with invented names and Nigerian cities, offset by slug
// length — so any customer who opened two product pages saw the same person
// praising both. That is the exact pattern shoppers are trained to read as a
// scam, and it discredited the genuinely verifiable trust signals elsewhere
// on the site (RC number, the Mabushi address, the WhatsApp line).
//
// The seeded `rating`/`reviewCount` columns are deliberately not shown here
// either, and no longer feed the page's aggregateRating JSON-LD: emitting
// review markup for reviews that don't exist is a structured-data violation
// Google can act on manually.
//
// When real reviews exist, this is the component to replace.
export function ProductReviews({ product }: { product: Product }) {
  const askUrl = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi HEIDIZ Essentialz, I'd like to ask about ${product.name}.`
  )}`;

  return (
    <div className="flex flex-col items-center gap-4 rounded-[4px] border border-brand-black/10 bg-white px-6 py-12 text-center">
      <p className="font-display text-xl text-brand-black">No reviews yet</p>
      <p className="max-w-md text-sm text-charcoal/70">
        This piece hasn&apos;t been reviewed yet. If you&apos;ve bought it, we&apos;d love to hear
        how you found it. If you&apos;re deciding, ask us anything about the scent before you buy.
      </p>
      <a
        href={askUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center gap-2 rounded-button bg-[#25D366] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
        Ask About This Scent
      </a>
    </div>
  );
}
