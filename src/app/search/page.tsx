import type { Metadata } from "next";
import { Search as SearchIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";
import { ProductGrid } from "@/components/shop/product-grid";
import { searchProducts } from "@/lib/products";
import { inputClass } from "@/lib/form-styles";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the HEIDIZ Essentialz catalog.",
  // Query-driven results pages are thin/duplicate content by nature — real
  // product/category pages are what should rank, not search result lists.
  robots: { index: false, follow: true },
};


export default async function SearchPage(props: PageProps<"/search">) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const results = query ? await searchProducts(query) : [];

  return (
    <>
      <CollectionHeader
        eyebrow="Search"
        title={query ? `Results for "${query}"` : "Search"}
        description={query ? undefined : "Find products by name, category, or description."}
        crumbs={[{ label: "Search" }]}
      />
      <Container className="py-12 md:py-16">
        <form method="GET" className="mx-auto flex max-w-xl items-center gap-2">
          <input
            type="text"
            name="q"
            defaultValue={query}
            autoFocus
            className={inputClass}
            placeholder="Search perfumes, skincare, shoes..."
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-button bg-brand-black text-white hover:bg-burnt-orange"
          >
            <SearchIcon className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </form>

        {query && (
          <p className="mt-6 text-center text-xs text-charcoal/70">
            {results.length} {results.length === 1 ? "result" : "results"}
          </p>
        )}

        {query && results.length === 0 && (
          <p className="mt-16 text-center text-sm text-charcoal/80">
            No products matched &quot;{query}&quot;. Try a different word, or browse the shop
            instead.
          </p>
        )}

        {results.length > 0 && (
          <div className="mt-10">
            <ProductGrid products={results} />
          </div>
        )}
      </Container>
    </>
  );
}
