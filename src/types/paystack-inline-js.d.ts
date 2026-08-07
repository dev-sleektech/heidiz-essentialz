// @paystack/inline-js ships no TypeScript declarations. Minimal shape for
// what src/lib/paystack.ts actually uses; see node_modules/@paystack/inline-js/README.md
// for the full API if more of it is needed later.
declare module "@paystack/inline-js" {
  export type PaystackTransactionOptions = {
    key: string;
    email: string;
    amount: number;
    currency?: string;
    reference?: string;
    metadata?: Record<string, unknown>;
    onSuccess?: (transaction: { id: number; reference: string; message: string }) => void;
    onLoad?: (transaction: { id: number; customer: unknown; accessCode: string }) => void;
    onCancel?: () => void;
    onError?: (error: { message: string }) => void;
  };

  export default class PaystackPop {
    newTransaction(options: PaystackTransactionOptions): unknown;
    resumeTransaction(accessCode: string, options?: Partial<PaystackTransactionOptions>): unknown;
  }
}
