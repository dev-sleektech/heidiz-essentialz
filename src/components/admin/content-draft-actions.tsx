"use client";

// Status control + copy-to-clipboard for one row on /admin/content. The
// status select follows the same optimistic-update pattern as
// OrderStatusSelect (src/components/staff/order-status-select.tsx): update
// local state immediately, roll back on failure, refresh on success.
//
// "Copy" exists because there's nowhere else for this text to go. No
// social API, no campaign sender is wired up on purpose (see the
// ContentDraft comment in prisma/schema.prisma). A human pastes it
// wherever it's actually going to be posted or sent.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Copy, Check } from "lucide-react";

type Status = "DRAFT" | "APPROVED" | "DISMISSED";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "DRAFT", label: "Needs Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "DISMISSED", label: "Dismissed" },
];

export function ContentDraftActions({ id, body, currentStatus }: { id: string; body: string; currentStatus: Status }) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  function handleStatusChange(next: Status) {
    setError(null);
    const previous = status;
    setStatus(next);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/content/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        const data = await res.json();
        if (!data.updated) {
          setStatus(previous);
          setError(data.message ?? "Update failed.");
        } else {
          router.refresh();
        }
      } catch {
        setStatus(previous);
        setError("Update failed.");
      }
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Select the text and copy it manually.");
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-button border border-brand-black/15 bg-white px-3 py-2 text-xs text-charcoal transition-colors hover:border-burnt-orange hover:text-burnt-orange"
        >
          {copied ? <Check className="h-3.5 w-3.5" strokeWidth={1.5} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <select
          value={status}
          disabled={isPending}
          onChange={(e) => handleStatusChange(e.target.value as Status)}
          className="cursor-pointer rounded-button border border-brand-black/15 bg-white px-3 py-2 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-burnt-orange disabled:opacity-50"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-charcoal/70" strokeWidth={1.5} />}
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
