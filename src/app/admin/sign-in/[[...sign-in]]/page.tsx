import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/site/logo";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false },
};

// Dedicated admin login (2026-08-17): previously an unauthenticated visit
// to /admin just silently bounced to the storefront homepage with no
// prompt at all — real gap, not intended behavior. This page gives staff
// an actual place to sign in, and src/app/admin/layout.tsx now redirects
// here (rather than to "/") when there's no signed-in user at all.
// Dark, admin-branded appearance (distinct from the light customer-facing
// /sign-in) — this is an internal tool, not the storefront.
export default function AdminSignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-brand-black px-4 py-16">
      <Logo markClassName="h-10" showWordmark={false} />
      <div className="text-center">
        <p className="font-display text-2xl text-white">Admin Sign In</p>
        <p className="mt-1 text-sm text-white/50">HEIDIZ Essentialz staff only</p>
      </div>
      <SignIn
        path="/admin/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/admin"
        appearance={{
          variables: {
            colorPrimary: "#B5531E",
            colorBackground: "#141414",
            colorInput: "#1F1F1F",
            // Input *text*, which is a separate token from colorForeground.
            // Without it Clerk keeps its default near-black input text, so
            // on this dark card staff were typing invisibly into the email
            // and one-time-code fields.
            colorInputForeground: "#FFFFFF",
            colorForeground: "#FFFFFF",
            colorMutedForeground: "#A3A3A3",
            colorPrimaryForeground: "#FFFFFF",
            borderRadius: "14px",
          },
          elements: {
            card: "shadow-none border border-white/10",
            headerTitle: "font-display",
            socialButtonsBlockButton: { borderColor: "rgba(255,255,255,0.15)" },
            socialButtonsBlockButtonText: { color: "#FFFFFF" },
            dividerText: { color: "rgba(255,255,255,0.5)" },
            footerActionText: { color: "rgba(255,255,255,0.5)" },
            // Belt and braces over colorInputForeground above: the OTP
            // boxes are the field staff hit on every sign-in, and an
            // invisible one locks them out of the admin entirely.
            formFieldInput: { color: "#FFFFFF" },
            otpCodeFieldInput: { color: "#FFFFFF", borderColor: "rgba(255,255,255,0.2)" },
          },
        }}
      />
    </div>
  );
}
