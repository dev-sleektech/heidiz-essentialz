import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";

export const metadata: Metadata = {
  title: "Sign In | HEIDIZ Essentialz",
  description: "Sign in to your HEIDIZ Essentialz account.",
};

export default function SignInPage() {
  return (
    <>
      <CollectionHeader eyebrow="My Account" title="Sign In" crumbs={[{ label: "Sign In" }]} />
      <Container className="flex justify-center py-12 md:py-16">
        <SignIn signUpUrl="/sign-up" fallbackRedirectUrl="/account" />
      </Container>
    </>
  );
}
