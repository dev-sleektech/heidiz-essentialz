// Brand 404. Next renders its own stock black-and-white page when this file
// is absent, which is jarring against the storefront and — worse for a shop
// — offers no way back in. Product and category URLs are the ones that go
// stale (a retired slug, an old WhatsApp or Instagram link), so this leads
// with routes back into the catalog rather than a bare "page not found".

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Container className="py-24 text-center md:py-32">
      <p className="text-xs uppercase tracking-wide text-charcoal/80">404</p>
      <h1 className="mt-3 font-display text-3xl text-brand-black md:text-4xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm text-charcoal/70">
        The link may be out of date, or the piece may have sold out and been retired from the
        collection. Everything currently in stock is still a tap away.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <ButtonLink href="/shop" variant="primary" size="md">
          Shop the Collection
        </ButtonLink>
        <ButtonLink href="/" variant="outline" size="md">
          Back to Home
        </ButtonLink>
      </div>
      <p className="mt-8 text-xs text-charcoal/70">
        Looking for something specific?{" "}
        <a href="/contact" className="text-burnt-orange underline underline-offset-4">
          Talk to us
        </a>{" "}
        and we&apos;ll track it down.
      </p>
    </Container>
  );
}
