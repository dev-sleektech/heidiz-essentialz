"use client";

// Route-level error boundary. Without one, an unhandled render error
// anywhere in the storefront falls through to Next's default screen — in
// production a bare "Application error: a client-side exception has
// occurred", which reads as a broken site rather than a recoverable hiccup.
//
// `reset()` re-renders the failed segment without a full page load, so a
// transient failure (a dropped DB connection on a product page, say) costs
// the customer one tap instead of the whole session.

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button, ButtonLink } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Next logs this server-side already; this puts the digest in the
    // browser console too, so a customer reporting a problem can read back
    // the id that identifies their specific failure in the logs.
    console.error("Storefront error:", error.digest ?? error.message);
  }, [error]);

  return (
    <Container className="py-24 text-center md:py-32">
      <AlertCircle className="mx-auto h-10 w-10 text-burnt-orange" strokeWidth={1.5} />
      <h1 className="mt-4 font-display text-3xl text-brand-black md:text-4xl">
        Something went wrong
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm text-charcoal/70">
        This one is on us, not you. Nothing has been charged and your cart is safe — try again,
        and if it keeps happening we&apos;d like to hear about it.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button variant="primary" size="md" onClick={reset}>
          Try Again
        </Button>
        <ButtonLink href="/" variant="outline" size="md">
          Back to Home
        </ButtonLink>
      </div>
      {error.digest && (
        <p className="mt-8 text-xs text-charcoal/70">
          Reference: <span className="font-mono">{error.digest}</span>
        </p>
      )}
    </Container>
  );
}
