import { Container } from "@/components/ui/container";
import { ProductVisual } from "@/components/ui/product-visual";
import { InstagramIcon } from "@/components/ui/social-icons";
import { instagramHandle, instagramPosts } from "@/lib/placeholder-data";

export function InstagramGallery() {
  return (
    <section className="bg-ivory">
      <Container className="py-20 md:py-28">
        <div className="flex flex-col items-center gap-3 text-center">
          <InstagramIcon className="h-6 w-6 text-burnt-orange" />
          <h2 className="font-display text-3xl text-brand-black md:text-4xl">
            Follow the Journey
          </h2>
          <a
            href="https://www.instagram.com/heidizessentialz/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-burnt-orange hover:underline"
          >
            {instagramHandle}
          </a>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-3 md:grid-cols-6">
          {instagramPosts.map((post) => (
            <ProductVisual
              key={post.id}
              icon={post.icon}
              className="aspect-square w-full"
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
