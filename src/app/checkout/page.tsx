"use client";

import { useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, MessageCircle, ShieldCheck } from "lucide-react";
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
import { inputClass, labelClass } from "@/lib/form-styles";

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

// Three customer-facing choices. Which card processor runs is an internal
// detail: offering "Paystack" and "Monnify" as separate options asked the
// customer to pick between two things they can't tell apart, at the most
// anxious moment in the flow. Both are still wired up - `cardProvider`
// picks one, and a failure offers the other as a retry.
const PAYMENT_METHODS = [
  { id: "card", label: "Pay with Card" },
  { id: "transfer", label: "Bank Transfer / Moniepoint" },
  { id: "delivery", label: "Pay on Delivery" },
];

const POD_STATE = "FCT - Abuja";


function makeOrderNumber() {
  return `HE-${Date.now().toString().slice(-8)}`;
}

export default function CheckoutPage() {
  const { lines, totalItems, subtotal, clear } = useCart();
  const { getProduct, loading: catalogLoading } = useProductCatalog();
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id);
  // Which processor the "Pay with Card" option actually uses. Starts on
  // Paystack and flips to Monnify when the customer retries after a
  // Paystack failure, so a bad provider day doesn't cost the sale.
  const [cardProvider, setCardProvider] = useState<"paystack" | "monnify">("paystack");
  // Every card attempt this page has opened, newest last. Before starting
  // another one we re-verify these, because a customer who was charged and
  // then shown an error will tap Place Order again — and did, twice for
  // the same NGN 513,900 order, 90 seconds apart, on 2026-09-03. A failure
  // between "the bank debited them" and "we recorded the order" must never
  // cost them a second charge.
  const attemptedPayments = useRef<{ ref: string; provider: "paystack" | "monnify" }[]>([]);
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
  const isCardPayment = paymentMethod === "card";
  const podAvailable = state === POD_STATE;

  function completeOrder(form: HTMLFormElement, orderNumber: string, sendEmailReceipt: boolean) {
    const data = new FormData(form);
    // The stored label keeps naming the processor, so /admin/transactions
    // still shows which one took the money even though the customer only
    // ever chose "Pay with Card".
    const baseLabel = PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label ?? paymentMethod;
    const methodLabel =
      paymentMethod === "card"
        ? `${baseLabel} (${cardProvider === "paystack" ? "Paystack" : "Monnify"})`
        : baseLabel;

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

    if (paymentMethod === "delivery" && !podAvailable) {
      setError(`Pay on Delivery is only available for ${POD_STATE} deliveries.`);
      return;
    }

    if (paymentMethod !== "card") {
      // Bank transfer / pay on delivery: record the order intent and hand
      // off to WhatsApp for manual follow-up. The receipt still goes out
      // whenever we have an email — nothing has been paid yet, but the
      // order number is the only key /order-tracking accepts, and it used
      // to exist nowhere but this page's React state. Closing the tab lost
      // it for good.
      completeOrder(form, makeOrderNumber(), true);
      return;
    }

    const providerLabel = cardProvider === "paystack" ? "Paystack" : "Monnify";
    const configured = cardProvider === "paystack" ? isPaystackConfigured() : isMonnifyConfigured();
    const otherConfigured = cardProvider === "paystack" ? isMonnifyConfigured() : isPaystackConfigured();
    if (!configured) {
      // Fall through to the other processor rather than dead-ending, when
      // only one of the two has keys in this environment.
      if (otherConfigured) {
        setCardProvider(cardProvider === "paystack" ? "monnify" : "paystack");
        setError("Switching card processor - please tap Place Order again.");
        return;
      }
      setError(
        "Card payments aren't configured yet. Choose Bank Transfer or Pay on Delivery for now."
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

    // Idempotency gate. Anything already paid for wins over charging again:
    // if one of this page's earlier references now verifies, the money is
    // in and the only thing that failed was our bookkeeping, so finish the
    // order from that reference instead of opening a new checkout.
    setStatus("verifying");
    for (const attempt of attemptedPayments.current) {
      const verify =
        attempt.provider === "paystack" ? verifyPaystackTransaction : verifyMonnifyTransaction;
      try {
        if (await verify(attempt.ref, verifyLines, state)) {
          completeOrder(form, attempt.ref, true);
          return;
        }
      } catch {
        // Couldn't reach the verify route for this one. Fall through and
        // check the rest; a network blip here must not block the customer
        // from paying, and the worst case is the behaviour we had before.
      }
    }

    const paymentRef = makeOrderNumber();
    attemptedPayments.current.push({ ref: paymentRef, provider: cardProvider });

    setStatus("processing");
    try {
      if (cardProvider === "paystack") {
        await openPaystackCheckout({
          email,
          amount: Math.round(total * 100), // kobo
          currency: "NGN",
          ref: paymentRef,
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
          ref: paymentRef,
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
    // Read off the stored order rather than current form state: this screen
    // outlives the form, and only a card order has actually been paid by
    // the time it renders.
    const paidUpFront = completedOrder.paymentMethodLabel.startsWith("Pay with Card");
    return (
      <Container className="py-20 md:py-28">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-burnt-orange" strokeWidth={1.5} />
          {/* "Confirmed" is only true once money has actually moved. Bank
              transfer and pay-on-delivery reach this screen with nothing
              paid, so they say "Received" and are told what happens next
              instead of being congratulated. */}
          <h1 className="font-display text-3xl text-brand-black">
            {paidUpFront ? "Order Confirmed" : "Order Received"}
          </h1>
          <p className="text-sm text-charcoal/70">
            {paidUpFront
              ? "Thank you for shopping with HEIDIZ Essentialz. Your payment has been confirmed."
              : "Thank you for shopping with HEIDIZ Essentialz. We'll confirm your order and payment details on WhatsApp."}
          </p>
          <div className="mt-1 w-full rounded-button bg-champagne/20 px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-charcoal/80">Your order number</p>
            <p className="mt-1 font-display text-2xl text-brand-black">
              {completedOrder.orderNumber}
            </p>
            <p className="mt-1.5 text-xs text-charcoal/70">
              Save this — it&apos;s what you&apos;ll need to track your order.
            </p>
          </div>
          <a
            href={buildOrderWhatsAppLink(completedOrder)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-button bg-[#25D366] px-7 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
            {paidUpFront ? "Confirm Order via WhatsApp" : "Get Payment Details on WhatsApp"}
          </a>
          <p className="text-xs text-charcoal/70">
            {paidUpFront
              ? "One tap sends your order details to our team so we can confirm delivery right away, much faster than waiting for us to reach out."
              : "One tap sends your order to our team, who will reply with the account details and confirm your delivery."}
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

  // Same guard as the cart page: never claim an empty cart while the
  // catalog that resolves its lines is still in flight.
  if (catalogLoading && lines.length > 0) {
    return (
      <Container className="py-20">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-burnt-orange" strokeWidth={1.5} />
          <p className="text-sm text-charcoal/70">Loading your order...</p>
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
                  onChange={(e) => {
                    setState(e.target.value);
                    // Pay on Delivery is FCT-Abuja only. Picking it and then
                    // switching to a state we don't cover would otherwise
                    // leave an order the business can't fulfil, so the
                    // selection falls back to card the moment it stops
                    // being valid.
                    if (e.target.value !== POD_STATE) {
                      setPaymentMethod((current) => (current === "delivery" ? "card" : current));
                    }
                    setError(null);
                  }}
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

            {/* Promoted above the choice, not below it. This sentence is the
                only reassurance on the page at the moment a first-time buyer
                decides whether to trust an unfamiliar store with a card, and
                it used to render at text-xs/50 - smaller and lower contrast
                than the form labels around it. In Nigeria "Paystack" is a
                stronger trust signal than most store brands; it should not be
                the quietest thing here. */}
            <div className="flex items-start gap-2.5 rounded-button bg-champagne/20 p-3.5 text-sm text-charcoal/80">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-burnt-orange" strokeWidth={1.5} />
              <span>
                Card payments are processed securely by{" "}
                <span className="font-medium text-brand-black">Paystack</span>. HEIDIZ Essentialz
                never sees or stores your card details.
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {PAYMENT_METHODS.map((method) => {
                const disabled = method.id === "delivery" && !podAvailable;
                return (
                  <label
                    key={method.id}
                    className={`flex flex-col gap-1 rounded-button border border-brand-black/15 bg-white px-4 py-3 text-sm has-[:checked]:border-burnt-orange has-[:checked]:bg-champagne/20 ${
                      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        disabled={disabled}
                        checked={paymentMethod === method.id}
                        onChange={() => {
                          setPaymentMethod(method.id);
                          setError(null);
                        }}
                        className="accent-burnt-orange"
                      />
                      {method.label}
                    </span>
                    {/* Each method says what happens next. Bank transfer in
                        particular used to end on a confirmation screen with
                        no account details and no explanation. */}
                    {method.id === "transfer" && (
                      <span className="pl-7 text-xs text-charcoal/70">
                        We send you the account details on WhatsApp to complete the transfer.
                      </span>
                    )}
                    {method.id === "delivery" && (
                      <span className="pl-7 text-xs text-charcoal/70">
                        {podAvailable
                          ? "Pay the rider in cash or by transfer when your order arrives."
                          : `Available for ${POD_STATE} deliveries only. Pick that state above to use it.`}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
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
