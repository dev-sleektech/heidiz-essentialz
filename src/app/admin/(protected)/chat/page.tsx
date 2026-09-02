"use client";

// Staff chat inbox (2026-08-15). Client component throughout, needs
// continuous polling for both the conversation list and the open thread,
// same reasoning as the customer widget (see chat-widget.tsx). The API
// routes re-check isStaffEmail server-side regardless of this page only
// being reachable through the already-gated /admin layout, same defense
// in depth as the rest of /admin.
//
// Reworked 2026-09-02: every guest thread used to render as an
// indistinguishable "Guest" with no timestamps, and on 2026-09-02 a reply
// went into the wrong one while the customer who had actually written in
// got nothing. Threads now carry the name and email collected before the
// chat starts, when each one started and last moved, and anything waiting
// on a reply sorts to the top. Staff can also end a resolved conversation.

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, CheckCircle2, RotateCcw, Mail, Loader2 } from "lucide-react";

const LIST_POLL_MS = 5000;
const THREAD_POLL_MS = 4000;

type ConversationSummary = {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  status: "OPEN" | "CLOSED";
  lastMessageAt: string;
  createdAt: string;
  lastMessage: { body: string; sender: "CUSTOMER" | "STAFF" } | null;
  unreadCount: number;
};

type ChatMessage = {
  id: string;
  sender: "CUSTOMER" | "STAFF";
  senderName: string | null;
  body: string;
  createdAt: string;
};

type StatusFilter = "OPEN" | "CLOSED" | "ALL";

// Short, unambiguous stamp for a support inbox: same-day threads show a
// time, older ones a date, so two "Guest" rows are never confusable again.
function formatStamp(iso: string): string {
  const date = new Date(iso);
  const sameDay = new Date().toDateString() === date.toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { day: "numeric", month: "short" });
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("OPEN");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(() => {
    fetch("/api/admin/chat")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.conversations) setConversations(data.conversations);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, LIST_POLL_MS);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const fetchThread = useCallback((id: string) => {
    fetch(`/api/admin/chat/${id}/messages`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.messages) setMessages(data.messages);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetchThread(selectedId);
    const interval = setInterval(() => fetchThread(selectedId), THREAD_POLL_MS);
    return () => clearInterval(interval);
  }, [selectedId, fetchThread]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending || !selectedId) return;
    setSending(true);
    setDraft("");

    try {
      const res = await fetch(`/api/admin/chat/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        fetchConversations();
      } else {
        setDraft(text);
      }
    } catch {
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  async function handleSetStatus(status: "OPEN" | "CLOSED") {
    if (!selectedId || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/chat/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchConversations();
    } catch {
      // the list poll will show the real state on its next tick
    } finally {
      setUpdatingStatus(false);
    }
  }

  const visible = conversations.filter((c) => filter === "ALL" || c.status === filter);
  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const openCount = conversations.filter((c) => c.status === "OPEN").length;

  return (
    <div className="flex h-full flex-col p-8 md:p-10">
      <h1 className="font-display text-2xl text-brand-black">Live Chat</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        Customer messages from the storefront chat widget. Refreshes automatically every few
        seconds. Threads waiting on a reply are listed first.
      </p>

      <div className="mt-4 flex items-center gap-2">
        {(["OPEN", "CLOSED", "ALL"] as StatusFilter[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-button px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === value
                ? "bg-brand-black text-white"
                : "border border-brand-black/15 text-charcoal/70 hover:border-burnt-orange hover:text-burnt-orange"
            }`}
          >
            {value === "OPEN" ? `Open (${openCount})` : value === "CLOSED" ? "Ended" : "All"}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-1 overflow-hidden rounded-[4px] border border-brand-black/10 bg-white">
        <div className="w-80 shrink-0 overflow-y-auto border-r border-brand-black/10">
          {visible.length === 0 ? (
            <p className="p-6 text-sm text-charcoal/50">
              {filter === "OPEN" ? "No open conversations." : "Nothing here."}
            </p>
          ) : (
            visible.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`flex w-full flex-col gap-1 border-b border-brand-black/5 px-4 py-3 text-left transition-colors hover:bg-ivory ${
                  selectedId === c.id ? "bg-ivory" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-brand-black">
                    {c.customerName || c.customerEmail || "Guest"}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="text-xs text-charcoal/40">{formatStamp(c.lastMessageAt)}</span>
                    {c.unreadCount > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-burnt-orange px-1.5 text-xs font-semibold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </span>
                </div>
                {c.customerEmail && (
                  <span className="truncate text-xs text-charcoal/40">{c.customerEmail}</span>
                )}
                <span className="truncate text-xs text-charcoal/50">
                  {c.lastMessage
                    ? `${c.lastMessage.sender === "STAFF" ? "You: " : ""}${c.lastMessage.body}`
                    : "No messages yet"}
                </span>
                {c.status === "CLOSED" && (
                  <span className="w-fit rounded-full bg-ivory px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-charcoal/50">
                    Ended
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex flex-1 flex-col">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center text-sm text-charcoal/40">
              Select a conversation to view it
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-brand-black/10 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-brand-black">
                    {selected.customerName || selected.customerEmail || "Guest"}
                    {selected.status === "CLOSED" && (
                      <span className="ml-2 rounded-full bg-ivory px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-charcoal/50">
                        Ended
                      </span>
                    )}
                  </p>
                  {selected.customerEmail && (
                    <a
                      href={`mailto:${selected.customerEmail}`}
                      className="inline-flex items-center gap-1 text-xs text-charcoal/50 hover:text-burnt-orange"
                    >
                      <Mail className="h-3 w-3" strokeWidth={1.5} />
                      {selected.customerEmail}
                    </a>
                  )}
                  <p className="text-xs text-charcoal/40">
                    Started {formatStamp(selected.createdAt)}, last message{" "}
                    {formatStamp(selected.lastMessageAt)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSetStatus(selected.status === "OPEN" ? "CLOSED" : "OPEN")}
                  disabled={updatingStatus}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-button border border-brand-black/15 px-3 py-1.5 text-xs font-medium text-charcoal transition-colors hover:border-burnt-orange hover:text-burnt-orange disabled:opacity-50"
                >
                  {updatingStatus ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
                  ) : selected.status === "OPEN" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                  )}
                  {selected.status === "OPEN" ? "End chat" : "Reopen"}
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-ivory px-5 py-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "STAFF" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-button px-3 py-2 text-sm ${
                        m.sender === "STAFF" ? "bg-burnt-orange text-white" : "bg-white text-charcoal shadow-sm"
                      }`}
                    >
                      {m.body}
                      <span
                        className={`mt-1 block text-[0.65rem] ${
                          m.sender === "STAFF" ? "text-white/60" : "text-charcoal/40"
                        }`}
                      >
                        {formatStamp(m.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
                {selected.status === "CLOSED" && (
                  <p className="pt-2 text-center text-xs text-charcoal/45">
                    This conversation has ended. Sending a reply reopens it.
                  </p>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 border-t border-brand-black/10 p-4"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Reply to ${selected.customerName || "this customer"}...`}
                  maxLength={2000}
                  className="flex-1 rounded-button border border-brand-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-burnt-orange"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="rounded-full bg-burnt-orange p-2.5 text-white disabled:opacity-40"
                  aria-label="Send reply"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                  ) : (
                    <Send className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
