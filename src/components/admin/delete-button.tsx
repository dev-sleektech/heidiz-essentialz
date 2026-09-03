"use client";

// Shared destructive-action button for /admin: deleting a product
// (/api/admin/products/[slug]) or a category (/api/admin/categories/[slug]).
// Both routes answer with { deleted, message }, so one component covers
// them and the refusal messages the category route sends back (e.g. "3
// products are still in Watches") surface as-is.
//
// Confirmation is a two-step inline swap rather than window.confirm: it
// keeps the whole interaction inside the page (window.confirm is easy to
// dismiss by reflex, and gets blocked outright in some embedded browsers).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, AlertCircle } from "lucide-react";

export function DeleteButton({
  endpoint,
  confirmLabel,
  redirectTo,
  compact = false,
}: {
  /** DELETE target, e.g. `/api/admin/products/lattafa-qaaed`. */
  endpoint: string;
  /** Shown in place of the button once armed, e.g. "Delete this product?". */
  confirmLabel: string;
  /** Where to go after a successful delete. Omit to just refresh in place. */
  redirectTo?: string;
  /** Row-sized variant for the list tables. */
  compact?: boolean;
}) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (json.deleted) {
        if (redirectTo) {
          router.push(redirectTo);
        }
        // Refresh either way: on a redirect it clears the stale list the
        // user is about to land back on, in place it drops the row.
        router.refresh();
        return;
      }
      setError(json.message ?? "Could not delete.");
      setArmed(false);
    } catch {
      setError("Could not delete.");
      setArmed(false);
    } finally {
      setDeleting(false);
    }
  }

  if (error) {
    return (
      <div className={compact ? "flex flex-col items-end gap-1" : "flex flex-col gap-1"}>
        <span className="inline-flex items-start gap-1.5 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          {error}
        </span>
        <button
          type="button"
          onClick={() => setError(null)}
          className="text-xs text-charcoal/70 hover:text-burnt-orange"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (armed) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-charcoal/70">{confirmLabel}</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 rounded-button bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {deleting && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />}
          {deleting ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => setArmed(false)}
          disabled={deleting}
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
      className={
        compact
          ? "inline-flex items-center gap-1.5 text-sm text-red-600 hover:underline"
          : "inline-flex items-center gap-2 rounded-button border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
      }
    >
      <Trash2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={1.5} />
      Delete
    </button>
  );
}
