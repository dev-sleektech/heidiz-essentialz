import { Container } from "@/components/ui/container";
import { Breadcrumbs, type Crumb } from "@/components/shop/breadcrumbs";

export function CollectionHeader({
  eyebrow,
  title,
  description,
  crumbs,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  crumbs: Crumb[];
}) {
  return (
    <div className="border-b border-brand-black/10 bg-white">
      <Container className="flex flex-col gap-4 py-10 md:py-14">
        <Breadcrumbs items={crumbs} />
        <span className="text-xs tracking-luxury uppercase text-burnt-orange">{eyebrow}</span>
        <h1 className="font-display text-3xl text-brand-black md:text-4xl">{title}</h1>
        {description && (
          <p className="max-w-2xl text-sm text-charcoal/70 md:text-base">{description}</p>
        )}
      </Container>
    </div>
  );
}
