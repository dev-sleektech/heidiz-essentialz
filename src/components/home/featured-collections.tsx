import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductVisual } from "@/components/ui/product-visual";
import { getAllCategories } from "@/lib/categories";
import { groupForNav, type Category } from "@/lib/category-types";

// Restructured 2026-09-02 to mirror the header: one block per dropdown,
// Collections then Accessories, each listed alphabetically exactly as the
// menu does. Membership is Category.navGroup, set at /admin/categories, so
// the homepage and the menu can't drift apart — putting a new collection on
// a menu gives it a tile here in the same move.

function CollectionGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {categories.map((cat) => (
        <Link key={cat.slug} href={`/category/${cat.slug}`} className="group flex flex-col gap-3">
          <ProductVisual
            icon={cat.icon}
            src={cat.image}
            className="aspect-square w-full transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="flex flex-col items-center text-center">
            <span className="font-display text-lg text-brand-black">{cat.name}</span>
            <span className="text-xs text-charcoal/70">{cat.tagline}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export async function FeaturedCollections() {
  // "Show on homepage" filters the tiles here without taking a collection
  // off the header menu — the two are separate switches in
  // /admin/categories, and this is the one that decides the grid.
  const menus = groupForNav((await getAllCategories()).filter((c) => c.showOnHome));

  return (
    <section className="bg-ivory">
      <Container className="py-20 md:py-28">
        <SectionHeading
          eyebrow="Shop by Collection"
          title="Curated for Every Moment"
          subtitle="From signature fragrances to fine accessories, explore the world of HEIDIZ Essentialz."
        />

        <CollectionGrid categories={menus.collections} />

        <div className="mt-8 text-center">
          <Link
            href="/category/collections"
            className="text-xs uppercase tracking-luxury text-burnt-orange hover:underline"
          >
            View all collections
          </Link>
        </div>

        {menus.accessories.length > 0 && (
          <>
            <div className="mt-20 md:mt-24">
              <SectionHeading
                eyebrow="Accessories"
                title="The Finishing Pieces"
                subtitle="Shoes, bags, eyewear and fine jewelry, chosen to sit alongside the fragrance wardrobe."
              />
            </div>

            <CollectionGrid categories={menus.accessories} />

            <div className="mt-8 text-center">
              <Link
                href="/category/accessories"
                className="text-xs uppercase tracking-luxury text-burnt-orange hover:underline"
              >
                View all accessories
              </Link>
            </div>
          </>
        )}
      </Container>
    </section>
  );
}
