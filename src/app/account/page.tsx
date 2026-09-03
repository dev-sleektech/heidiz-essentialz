import type { Metadata } from "next";
import { UserCircle2, MessageCircle, LogOut, Package, ChevronRight } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";
import { ButtonLink } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in or manage your HEIDIZ Essentialz account.",
};

export default async function AccountPage() {
  const user = await currentUser();

  if (!user) {
    return (
      <>
        <CollectionHeader eyebrow="My Account" title="Account" crumbs={[{ label: "Account" }]} />

        <Container className="flex flex-col items-center gap-5 py-20 text-center md:py-28">
          <UserCircle2 className="h-12 w-12 text-burnt-orange" strokeWidth={1.5} />
          <h2 className="font-display text-2xl text-brand-black">Sign In to Your Account</h2>
          <p className="max-w-md text-sm text-charcoal/70">
            Create an account to save your details for next time, or continue as a guest, every
            order can still be placed and confirmed instantly over WhatsApp, no sign-in
            required.
          </p>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <ButtonLink href="/sign-in" variant="primary" size="md">
              Sign In
            </ButtonLink>
            <ButtonLink href="/sign-up" variant="outline" size="md">
              Create Account
            </ButtonLink>
          </div>
          <a
            href="https://wa.me/2347053220268"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-2 text-xs text-charcoal/70 hover:text-burnt-orange"
          >
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
            Or chat with us to place an order as a guest
          </a>
        </Container>
      </>
    );
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "there";
  const email = user.primaryEmailAddress?.emailAddress ?? "";

  return (
    <>
      <CollectionHeader eyebrow="My Account" title={`Welcome, ${name}`} crumbs={[{ label: "Account" }]} />

      <Container className="py-12 md:py-16">
        <div className="mx-auto flex max-w-md flex-col gap-6 rounded-[4px] border border-brand-black/10 bg-white p-8">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-charcoal/70">Signed in as</span>
            <span className="font-display text-lg text-brand-black">{email}</span>
          </div>

          <div className="hairline" />

          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-charcoal/70">Order History</span>
            <p className="text-sm text-charcoal/70">
              Track every order placed on this account, from confirmation through delivery.
            </p>
            <Link
              href="/account/orders"
              className="mt-1 inline-flex w-fit items-center gap-2 text-sm text-burnt-orange hover:underline"
            >
              <Package className="h-4 w-4" strokeWidth={1.5} />
              View Order History
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
            {/* External link, so a plain anchor is correct here. */}
            <a
              href="https://wa.me/2347053220268"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex w-fit items-center gap-2 text-sm text-charcoal/80 hover:text-burnt-orange"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
              Or check an order on WhatsApp
            </a>
          </div>

          <div className="hairline" />

          <SignOutButton redirectUrl="/">
            <button
              type="button"
              className="inline-flex w-fit items-center gap-2 text-sm text-charcoal/80 hover:text-burnt-orange"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </Container>
    </>
  );
}
