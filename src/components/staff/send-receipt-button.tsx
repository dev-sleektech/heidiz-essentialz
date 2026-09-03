"use client";

// Manual receipt push for /admin/orders. Talks to
// POST /api/staff/orders/[orderNumber]/receipt, which re-reads the order
// from the database and answers with the true { sent, message, email }.
//
// Confirmed in two steps, matching DeleteButton. A receipt goes to a real
// customer and cannot be recalled, so an accidental click on a busy order
// table should not be enough to send one.
//
// The result is shown in place and never auto-clears. Staff press this
// precisely because a receipt already went missing once, so "did that
// work?" has to stay answered on screen rather than flashing past.

import { useState } from "react";
import { Loader2, Mail, AlertCircle, Check } from "lucide-react";

type Result = { sent: boolean; message: string; email?: string };

export function SendReceiptButton({
  orderNumber,
  hasEmail,
}: {
  orderNumber: string;
  /** False for guest orders with no address, where sending is impossible. */
  hasEmail: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function handleSend() {
    setSending(true);
    try {
      const res = await fetch(`/api/staff/orders/${orderNumber}/receipt`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      setResult({
        sent: Boolean(json.sent),
        message: json.message ?? "Could not send the receipt.",
        email: json.email,
      });
    } catch {
      setResult({ sent: false, message: "Could not reach the server." });
    } finally {
      setSending(false);
      setArmed(false);
    }
  }

  // Nothing to send to, and no amount of retrying changes that. Say it up
  // front instead of offering a button that can only fail.
  if (!hasEmail) {
    return <span className="text-xs text-charcoal/70">No email on file</span>;
  }

  if (result) {
    return (
      <div className="flex flex-col items-start gap-1">
        {result.sent ? (
          <span className="inline-flex items-start gap-1.5 text-xs text-green-700">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            Sent to {result.email}
          </span>
        ) : (
          <span className="inline-flex items-start gap-1.5 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            {result.message}
          </span>
        )}
        <button
          type="button"
          onClick={() => setResult(null)}
          className="text-xs text-charcoal/70 hover:text-burnt-orange"
        >
          {result.sent ? "Send again" : "Try again"}
        </button>
      </div>
    );
  }

  if (armed) {
    return (
      <span className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="inline-flex items-center gap-1.5 rounded-button bg-burnt-orange px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {sending && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />}
          {sending ? "Sending..." : "Yes, send"}
        </button>
        <button
          type="button"
          onClick={() => setArmed(false)}
          disabled={sending}
          className="text-xs text-charcoal/70 hover:text-charcoal"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setArmed(true)}
      className="inline-flex items-center gap-1.5 text-sm text-burnt-orange hover:underline"
    >
      <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
      Send receipt
    </button>
  );
}
