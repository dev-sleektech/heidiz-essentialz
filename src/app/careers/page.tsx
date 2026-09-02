import type { Metadata } from "next";
import { Briefcase, Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the HEIDIZ Essentialz team in FCT-Abuja.",
};

export default function CareersPage() {
  return (
    <>
      <CollectionHeader eyebrow="Join Us" title="Careers" crumbs={[{ label: "Careers" }]} />

      <Container className="flex flex-col items-center gap-5 py-20 text-center md:py-28">
        <Briefcase className="h-12 w-12 text-burnt-orange" strokeWidth={1.5} />
        <h2 className="font-display text-2xl text-brand-black">No Open Positions Right Now</h2>
        <p className="max-w-md text-sm text-charcoal/70">
          We don&apos;t have current openings, but we&apos;re always glad to hear from people who love
          this space. If you&apos;re interested in working with HEIDIZ Essentialz, send your CV
          and a short note about yourself and we&apos;ll keep it on file.
        </p>
        <a
          href="mailto:info@heidizstores.com?subject=Careers%20Inquiry"
          className="mt-2 inline-flex items-center gap-2 rounded-button bg-burnt-orange px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-burnt-orange-dark"
        >
          <Mail className="h-4 w-4" strokeWidth={1.5} />
          info@heidizstores.com
        </a>
      </Container>
    </>
  );
}
