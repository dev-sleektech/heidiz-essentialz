import { Star } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { testimonials } from "@/lib/placeholder-data";

export function Testimonials() {
  return (
    <section className="bg-brand-black text-white">
      <Container className="py-20 md:py-28">
        <SectionHeading
          eyebrow="Customer Reviews"
          title="Trusted by Discerning Clients"
          dark
        />

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="flex flex-col gap-4 rounded-[4px] border border-white/10 bg-white/[0.03] p-8"
            >
              <div className="flex gap-1 text-champagne">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" strokeWidth={0} />
                ))}
              </div>
              <p className="font-serif-alt text-lg italic text-white/85">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-2 flex flex-col">
                <span className="text-sm font-medium">{t.name}</span>
                <span className="text-xs text-white/50">{t.location}</span>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
