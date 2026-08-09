import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a HEIDIZ Essentialz account.",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <>
      <CollectionHeader eyebrow="My Account" title="Create Account" crumbs={[{ label: "Create Account" }]} />
      <Container className="flex justify-center py-12 md:py-16">
        <SignUp signInUrl="/sign-in" fallbackRedirectUrl="/account" />
      </Container>
    </>
  );
}
