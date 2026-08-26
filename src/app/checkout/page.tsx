"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { Button, ButtonLink } from "@/components/ui/button";
import { OrderSummary } from "@/components/shop/order-summary";
import { useCart } from "@/lib/cart-context";
import { useProductCatalog } from "@/lib/product-catalog-context";
import { getDeliveryFee, getDeliveryEstimate } from "@/lib/delivery";
import { isPaystackConfigured, openPaystackCheckout, verifyPaystackTransaction, type VerifyLine } from "@/lib/paystack";
import { isMonnifyConfigured, openMonnifyCheckout, verifyMonnifyTransaction } from "@/lib/monnify";
import { buildOrderWhatsAppLink, type OrderDetails } from "@/lib/whatsapp";

const NIGERIAN_STATES = [
  "FCT - Abuja",
  "Lagos",
  "Rivers",
  "Kano",
  "Oyo",
  "Kaduna",
  "Enugu",
  "Delta",
  "Ogun",
  "Anambra",
  "Other",
];

const PAYMENT_METHODS = [
  { id: "paystack", label: "Pay with Card (Paystack)" },
  { id: "monnify", label: "Pay with Card (Monnify)" },
  { id: "transfer", label: "Bank Transfer / Moniepoint" },
  { id: "delivery", label: "Pay on Delivery (FCT-Abuja only)" },
];

const inputClass =
  "w-full rounded-button border border-brand-black/15 bg-white px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-burnt-orange";
const labelClass = "text-xs uppercase tracking-wide text-charcoal/60";

function makeOrderNumber() {
  return `HE-${Date.now().toString().slice(-8)}`;
}

export default function CheckoutPage() {
  const { lines, totalItems, subtotal, clear } = useCart();
  const { getProduct } = useProductCatalog();
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id);
  const [email, setEmail] = useState("");
  const [completedOrder, setCompletedOrder] = useState<OrderDetails | null>(null);
  // "processing"/"verifying" drive the in-form submit button (payment in
  // flight). "orderPhase" takes over once payment succeeds: a brief,
  // full-page "processing your order" beat before the final confirmation,
  // so the transition doesn't feel instantaneous.
  const [status, setStatus] = useState<"idle" | "processing" | "verifying">("idle");
  const [orderPhase, setOrderPhase] = useState<"form" | "processingOrder" | "confirmed">("form");
  const [error, setError] = useState<string | null>(null);
  // Controlled (not just read from FormData at submit) so the delivery fee
  // and ETA in the order summary react live as the customer picks a state,
  // the same reactive pattern already used for per-size perfume pricing.
  const [state, setState] = useState("");

  const resolvedLines = lines
    .map((line) => ({ line, product: getProduct(line.slug) }))
    .filter((entry): entry is { line: (typeof lines)[number]; product: NonNullable<ReturnType<typeof getProduct>> } =>
      Boolean(entry.product)
    );

  // Before a state is picked, fall back to the plain flat-fee estimate
  // (matching the cart page) rather than defaulting into the worst-case
  // "other" zone — the real zone fee/ETA only kicks in once known.
  const { fee: delivery, etaLabel: deliveryEta } = state
    ? getDeliveryEstimate(subtotal, state)
    : { fee: getDeliveryFee(subtotal), etaLabel: "" };
  const total = subtotal + delivery;
  const isCardPayment = paymentMethod === "paystack" || paymentMethod === "monnify";

  function completeOrder(form: HTMLFormElement, orderNumber: string, sendEmailReceipt: boolean) {
    const data = new FormData(form);
    const methodLabel =
      PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label ?? paymentMethod;

    const order: OrderDetails = {
      orderNumber,
      customerName: String(data.get("fullName") ?? ""),
      email: email || undefined,
      phone: String(data.get("phone") ?? ""),
      address: String(data.get("address") ?? ""),
      city: String(data.get("city") ?? ""),
      state: String(data.get("state") ?? ""),
      notes: String(data.get("notes") ?? "") || undefined,
      paymentMethodLabel: methodLabel,
      lines: resolvedLines.map(({ product, line }) => ({
        product,
        quantity: line.quantity,
        size: line.size,
        color: line.color,
        unitPrice: line.unitPrice ?? product.price,
      })),
      subtotal,
      delivery,
      total,
    };

    // Save the order to the database regardless of payment method — this is
    // what makes /account/orders real. Fire-and-forget like the receipt
    // email below: never blocks the UI, and the WhatsApp handoff is the
    // reliable confirmation channel even if this fails.
    fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    }).catch(() => {});

    // Fire-and-forget: only after Paystack has actually confirmed and
    // verified payment (see the "paystack" branch below), never blocks the
    // UI, and failure here doesn't affect the order — the WhatsApp handoff
    // is the reliable confirmation channel regardless.
    if (sendEmailReceipt && order.email) {
      fetch("/api/orders/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      }).catch(() => {});
    }

    clear();
    setStatus("idle");
    setOrderPhase("processingOrder");
    // Brief, deliberate pause so "processing" reads as a real step rather
    // than a flash between payment and confirmation.
    window.setTimeout(() => {
      setCompletedOrder(order);
      setOrderPhase("confirmed");
    }, 1600);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;

    if (paymentMethod !== "paystack" && paymentMethod !== "monnify") {
      // Bank transfer / pay on delivery: record the order intent and hand
      // off to WhatsApp for manual follow-up. No email receipt here —
      // nothing's been paid/confirmed yet for these methods.
      completeOrder(form, makeOrderNumber(), false);
      return;
    }

    const providerLabel = paymentMethod === "paystack" ? "Paystack" : "Monnify";
    const configured = paymentMethod === "paystack" ? isPaystackConfigured() : isMonnifyConfigured();
    if (!configured) {
      setError(
        `Card payments aren't configured yet. Add a ${providerLabel} API key to enable this, or choose Bank Transfer / Pay on Delivery for now.`
      );
      return;
    }

    if (!email) {
      setError("An email address is required for card payments.");
      return;
    }

    // Sent alongside the payment reference so the verify route can
    // recompute the real total from the Product table and confirm the
    // amount actually charged matches it (see src/lib/order-pricing.ts) —
    // never trust this component's own client-computed `total` as proof of
    // what was paid.
    const verifyLines: VerifyLine[] = resolvedLines.map(({ product, line }) => ({
      slug: product.slug,
      quantity: line.quantity,
      size: line.size,
      color: line.color,
    }));

    // Shared between both providers: once their SDK confirms a charge
    // *appeared* to succeed, verify it server-side before treating the
    // order as paid — never trust the client-side callback alone.
    const onProviderSuccess = (
      reference: string,
      verify: (ref: string, items: VerifyLine[], state: string) => Promise<boolean>
    ) => {
      setStatus("verifying");
      verify(reference, verifyLines, state)
        .then((ok) => {
          if (ok) {
            completeOrder(form, reference, true);
          } else {
            setStatus("idle");
            setError("We couldn't confirm this payment. Please try again or contact us.");
          }
        })
        .catch(() => {
          setStatus("idle");
          setError("We couldn't confirm this payment. Please try again or contact us.");
        });
    };

    const onProviderClose = () => {
      setStatus((s) => (s === "verifying" ? s : "idle"));
    };

    setStatus("processing");
    try {
      if (paymentMethod === "paystack") {
        await openPaystackCheckout({
          email,
          amount: Math.round(total * 100), // kobo
          currency: "NGN",
          ref: makeOrderNumber(),
          metadata: { itemCount: totalItems },
          callback: (response) => onProviderSuccess(response.reference, verifyPaystackTransaction),
          onClose: onProviderClose,
        });
      } else {
        const customerName = String(new FormData(form).get("fullName") ?? "");
        await openMonnifyCheckout({
          email,
          amount: total, // naira, not kobo
          customerName,
          ref: makeOrderNumber(),
          callback: (response) => onProviderSuccess(response.reference, verifyMonnifyTransaction),
          onClose: onProviderClose,
        });
      }
    } catch {
      setStatus("idle");
      setError(`${providerLabel} isn't ready yet. Refresh the page and try again.`);
    }
  }

  if (orderPhase === "processingOrder") {
    return (
      <Container className="py-20 md:py-28">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-burnt-orange" strokeWidth={1.5} />
          <h1 className="font-display text-3xl text-brand-black">Processing Your Order</h1>
          <p className="text-sm text-charcoal/70">
            Just a moment while we confirm the details of your order.
          </p>
        </div>
      </Container>
    );
  }

  if (orderPhase === "confirmed" && completedOrder) {
    return (
      <Container className="py-20 md:py-28">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-burnt-orange" strokeWidth={1.5} />
          <h1 className="font-display text-3xl text-brand-black">Order Confirmed</h1>
          <p className="text-sm text-charcoal/70">
            Thank you for shopping with HEIDIZ Essentialz. Your order{" "}
            <span className="font-medium text-brand-black">{completedOrder.orderNumber}</span>{" "}
            has been confirmed.
          </p>
          <a
            href={buildOrderWhatsAppLink(completedOrder)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-button bg-[#25D366] px-7 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
            Confirm Order via WhatsApp
          </a>
          <p className="text-xs text-charcoal/50">
            One tap sends your order details to our team so we can confirm delivery right
            away, much faster than waiting for us to reach out.
          </p>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <ButtonLink href="/shop" variant="outline" size="md">
              Continue Shopping
            </ButtonLink>
            <ButtonLink
              href={`/order-tracking?order=${encodeURIComponent(completedOrder.orderNumber)}`}
              variant="outline"
              size="md"
            >
              Track This Order
            </ButtonLink>
          </div>
        </div>
      </Container>
    );
  }

  if (resolvedLines.length === 0) {
    return (
      <Container className="py-20 text-center">
        <p className="font-display text-xl text-brand-black">Your cart is empty</p>
        <ButtonLink href="/shop" variant="primary" size="md" className="mt-6 inline-flex">
          Shop the Collection
        </ButtonLink>
      </Container>
    );
  }

  return (
    <Container className="py-10 md:py-14">
      <Breadcrumbs items={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
      <h1 className="mt-4 font-display text-3xl text-brand-black md:text-4xl">Checkout</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]"
      >
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-xl text-brand-black">Delivery Details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Full Name</span>
                <input required name="fullName" type="text" className={inputClass} placeholder="Your full name" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Phone Number</span>
                <input required name="phone" type="tel" className={inputClass} placeholder="080X XXX XXXX" />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className={labelClass}>
                  Email{isCardPayment ? "" : " (optional)"}
                </span>
                <input
                  type="email"
                  required={isCardPayment}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={(e) => {
                    // Fire-and-forget abandoned-checkout snapshot — the
                    // earliest point in the funnel with both an email and
                    // cart contents. Never blocks the UI; see
                    // src/app/api/checkout/track for what happens with it.
                    if (!/^\S+@\S+\.\S+$/.test(e.target.value) || resolvedLines.length === 0) return;
                    const fullName = e.target.form?.elements.namedItem("fullName");
                    fetch("/api/checkout/track", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: e.target.value,
                        customerName: fullName instanceof HTMLInputElement ? fullName.value || undefined : undefined,
                        items: resolvedLines.map(({ product, line }) => ({
                          slug: product.slug,
                          name: product.name,
                          price: product.price,
                          quantity: line.quantity,
                        })),
                        subtotal,
                      }),
                    }).catch(() => {});
                  }}
                  className={inputClass}
                  placeholder="you@email.com"
                />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className={labelClass}>Delivery Address</span>
                <input required name="address" type="text" className={inputClass} placeholder="Street address" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>City</span>
                <input required name="city" type="text" className={inputClass} placeholder="City" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>State</span>
                <select
                  required
                  name="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select state
                  </option>
                  {NIGERIAN_STATES.map((stateOption) => (
                    <option key={stateOption} value={stateOption}>
                      {stateOption}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className={labelClass}>Order Notes (optional)</span>
                <textarea rows={3} name="notes" className={inputClass} placeholder="Delivery instructions, gift note, etc." />
              </label>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="font-display text-xl text-brand-black">Payment Method</h2>
            <div className="flex flex-col gap-3">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.id}
                  className="flex cursor-pointer items-center gap-3 rounded-button border border-brand-black/15 bg-white px-4 py-3 text-sm has-[:checked]:border-burnt-orange has-[:checked]:bg-champagne/20"
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={() => {
                      setPaymentMethod(method.id);
                      setError(null);
                    }}
                    className="accent-burnt-orange"
                  />
                  {method.label}
                </label>
              ))}
            </div>
            <p className="text-xs text-charcoal/50">
              Card payments are processed securely by Paystack or Monnify; HEIDIZ Essentialz
              never sees or stores your card details.
            </p>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <OrderSummary
            subtotal={subtotal}
            itemCount={totalItems}
            deliveryFeeOverride={delivery}
            deliveryEtaLabel={deliveryEta || undefined}
          >
            {error && (
              <div className="flex items-start gap-2 rounded-button bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span>{error}</span>
              </div>
            )}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="mt-2 w-full"
              disabled={status !== "idle"}
            >
              {status === "processing" || status === "verifying" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                  {status === "verifying" ? "Confirming Payment..." : "Processing..."}
                </>
              ) : (
                "Place Order"
              )}
            </Button>
          </OrderSummary>
        </div>
      </form>
    </Container>
  );
}
