import type { Metadata } from "next";
import { Leaf, Recycle, Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";

export const metadata: Metadata = {
  title: "Sustainability | HEIDIZ Essentialz",
  description: "How HEIDIZ Essentialz sources responsibly and supports the FCT-Abuja community.",
};

const COMMITMENTS = [
  {
    icon: Leaf,
    title: "Responsible Sourcing",
    description:
      "We work with authorized distributors and brand houses, choosing suppliers who can account for how their products are made.",
  },
  {
    icon: Recycle,
    title: "Considered Packaging",
    description:
      "We're moving toward recyclable and reusable packaging across our shipments, reducing single-use plastic where we can.",
  },
  {
    icon: Users,
    title: "Local First",
    description:
      "Based in Mabushi, FCT-Abuja, we hire locally and reinvest in the community that built us.",
  },
];

export default function SustainabilityPage() {
  return (
    <>
      <CollectionHeader
        eyebrow="Our Commitment"
        title="Sustainability"
        description="Luxury and responsibility aren't opposites. Here's how we try to hold both."
        crumbs={[{ label: "Sustainability" }]}
      />

      <Container className="py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {COMMITMENTS.map((item) => (
            <div key={item.title} className="flex flex-col items-center gap-3 text-center">
              <item.icon className="h-8 w-8 text-burnt-orange" strokeWidth={1.5} />
              <h2 className="font-display text-lg text-brand-black">{item.title}</h2>
              <p className="text-sm text-charcoal/70">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-2xl text-center text-sm leading-relaxed text-charcoal/70">
          <p>
            This is early work for us, and we're building it thoughtfully rather than
            quickly. If sustainability in fragrance and beauty retail matters to you, we'd
            genuinely like to hear from you, reach out at info@heidizstores.com.
          </p>
        </div>
      </Container>
    </>
  );
}
