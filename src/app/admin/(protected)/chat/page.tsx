"use client";

// Staff chat inbox (2026-08-15). Client component throughout, needs
// continuous polling for both the conversation list and the open thread,
// same reasoning as the customer widget (see chat-widget.tsx). The API
// routes re-check isStaffEmail server-side regardless of this page only
// being reachable through the already-gated /admin layout, same defense
// in depth as the rest of /admin.

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

const LIST_POLL_MS = 5000;
const THREAD_POLL_MS = 4000;

type ConversationSummary = {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  status: "OPEN" | "CLOSED";
  lastMessageAt: string;
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

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
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

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col p-8 md:p-10">
      <h1 className="font-display text-2xl text-brand-black">Live Chat</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        Customer messages from the storefront chat widget. Refreshes automatically every few seconds.
      </p>

      <div className="mt-6 flex flex-1 overflow-hidden rounded-[4px] border border-brand-black/10 bg-white">
        <div className="w-80 shrink-0 overflow-y-auto border-r border-brand-black/10">
          {conversations.length === 0 ? (
            <p className="p-6 text-sm text-charcoal/50">No conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`flex w-full flex-col gap-1 border-b border-brand-black/5 px-4 py-3 text-left transition-colors hover:bg-ivory ${
                  selectedId === c.id ? "bg-ivory" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium text-brand-black">
                    {c.customerName || c.customerEmail || "Guest"}
                  </span>
                  {c.unreadCount > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-burnt-orange px-1.5 text-xs font-semibold text-white">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <span className="truncate text-xs text-charcoal/50">
                  {c.lastMessage
                    ? `${c.lastMessage.sender === "STAFF" ? "You: " : ""}${c.lastMessage.body}`
                    : "No messages yet"}
                </span>
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
              <div className="border-b border-brand-black/10 px-5 py-3">
                <p className="text-sm font-medium text-brand-black">
                  {selected.customerName || selected.customerEmail || "Guest"}
                </p>
                {selected.customerEmail && (
                  <p className="text-xs text-charcoal/50">{selected.customerEmail}</p>
                )}
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
                    </div>
                  </div>
                ))}
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
                  placeholder="Reply…"
                  className="flex-1 rounded-button border border-brand-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-burnt-orange"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="rounded-full bg-burnt-orange p-2.5 text-white disabled:opacity-40"
                  aria-label="Send reply"
                >
                  <Send className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
