import type { Metadata } from "next";
import { Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CollectionHeader } from "@/components/shop/collection-header";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "Delivery timelines, fees, and our return policy at HEIDIZ Essentialz.",
};

export default function ShippingReturnsPage() {
  return (
    <>
      <CollectionHeader
        eyebrow="Policies"
        title="Shipping & Returns"
        crumbs={[{ label: "Shipping & Returns" }]}
      />

      <Container className="py-12 md:py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-12">
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Truck className="h-6 w-6 text-burnt-orange" strokeWidth={1.5} />
              <h2 className="font-display text-2xl text-brand-black">Delivery</h2>
            </div>
            <ul className="flex flex-col gap-3 text-sm leading-relaxed text-charcoal/70">
              <li>
                <span className="font-medium text-brand-black">FCT-Abuja:</span> 1 to 2
                business days.
              </li>
              <li>
                <span className="font-medium text-brand-black">Lagos, Rivers, and other major cities:</span>{" "}
                2 to 4 business days via our logistics partners.
              </li>
              <li>
                <span className="font-medium text-brand-black">Delivery fee:</span> Complimentary
                on orders over ₦150,000. A flat delivery fee applies to smaller orders, shown
                at checkout before you pay.
              </li>
              <li>
                <span className="font-medium text-brand-black">Pay on delivery:</span> Available
                for orders within FCT-Abuja only.
              </li>
              <li>
                Once your order is placed, confirm it on WhatsApp from the order confirmation
                screen so our team can begin processing right away.
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-6 w-6 text-burnt-orange" strokeWidth={1.5} />
              <h2 className="font-display text-2xl text-brand-black">Returns & Exchanges</h2>
            </div>
            <ul className="flex flex-col gap-3 text-sm leading-relaxed text-charcoal/70">
              <li>
                Unopened, unused items in their original packaging can be returned or
                exchanged within 7 days of delivery.
              </li>
              <li>
                For hygiene reasons, opened perfumes, cosmetics, skincare, and hair care
                products cannot be returned unless they arrived damaged, faulty, or incorrect.
              </li>
              <li>
                Watches, handbags, jewelry, and sunglasses can be returned unworn, with tags
                and original packaging intact.
              </li>
              <li>
                To start a return, message us on WhatsApp or email
                info@heidizstores.com with your order number and reason for return.
              </li>
              <li>
                Approved refunds are issued to the original payment method within 5 to 7
                business days of us receiving the returned item.
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-burnt-orange" strokeWidth={1.5} />
              <h2 className="font-display text-2xl text-brand-black">Damaged or Incorrect Items</h2>
            </div>
            <p className="text-sm leading-relaxed text-charcoal/70">
              If your order arrives damaged, faulty, or different from what you ordered,
              contact us within 48 hours of delivery with photos of the item and packaging.
              We'll arrange a replacement or full refund at no extra cost to you.
            </p>
          </section>
        </div>
      </Container>
    </>
  );
}
