// Shared delivery pricing logic, kept in one place so the promo banner,
// cart, and checkout summary can't drift out of sync.
export const FREE_DELIVERY_THRESHOLD = 150000;
export const STANDARD_DELIVERY_FEE = 3500;

export function getDeliveryFee(subtotal: number) {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
}
