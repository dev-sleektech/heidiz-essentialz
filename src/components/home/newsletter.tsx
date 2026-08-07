import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export function Newsletter() {
  return (
    <section className="bg-champagne/40">
      <Container className="flex flex-col items-center gap-6 py-20 text-center md:py-24">
        <span className="text-xs tracking-luxury uppercase text-burnt-orange">
          Stay In The Know
        </span>
        <h2 className="max-w-2xl font-display text-3xl leading-tight text-brand-black md:text-4xl">
          Be the First to Discover New Arrivals &amp; Exclusive Offers
        </h2>
        <p className="max-w-md text-sm text-charcoal/70">
          Join the HEIDIZ Essentialz inner circle for early access to
          launches, beauty tips, and members-only gifts.
        </p>

        <form className="mt-4 flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            placeholder="Enter your email"
            className="w-full rounded-button border border-brand-black/15 bg-white px-5 py-3 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-burnt-orange"
          />
          <Button type="submit" variant="dark" className="shrink-0">
            Subscribe
          </Button>
        </form>
      </Container>
    </section>
  );
}
