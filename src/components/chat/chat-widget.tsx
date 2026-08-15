"use client";

// Floating live-chat widget (2026-08-15). Polling-based, not a raw socket,
// see prisma/schema.prisma's comment above ChatConversation for why. Guest
// chat works like cart/wishlist: no account needed, the conversation id
// itself is persisted to localStorage so a guest returns to the same
// thread on a later visit. Only polls while the panel is open, both to
// keep load down and because the messages GET route marks staff replies
// as read-by-customer on every call. Polling while closed would mark
// messages read that the customer never actually saw.

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

const STORAGE_KEY = "heidiz-chat-conversation-v1";
const POLL_INTERVAL_MS = 4000;

type ChatMessage = {
  id: string;
  sender: "CUSTOMER" | "STAFF";
  senderName: string | null;
  body: string;
  createdAt: string;
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setConversationId(stored);
    } catch {
      // ignore inaccessible storage
    }
  }, []);

  const fetchMessages = useCallback((id: string) => {
    fetch(`/api/chat/${id}/messages`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.messages) setMessages(data.messages);
      })
      .catch(() => {
        // silent, next poll tick retries
      });
  }, []);

  useEffect(() => {
    if (!open || !conversationId) return;
    fetchMessages(conversationId);
    const interval = setInterval(() => fetchMessages(conversationId), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [open, conversationId, fetchMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");

    try {
      let id = conversationId;
      if (!id) {
        const res = await fetch("/api/chat", { method: "POST" });
        const data = await res.json();
        id = data.conversationId;
        setConversationId(id);
        try {
          window.localStorage.setItem(STORAGE_KEY, id as string);
        } catch {
          // ignore inaccessible storage, chat still works for this session
        }
      }

      const res = await fetch(`/api/chat/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
      } else {
        setDraft(text); // restore so the customer doesn't lose what they typed
      }
    } catch {
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[4px] border border-brand-black/10 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-brand-black px-4 py-3 text-white">
            <div>
              <p className="font-display text-sm tracking-wide">HEIDIZ Support</p>
              <p className="text-xs text-white/60">We typically reply shortly</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-ivory px-4 py-4">
            {messages.length === 0 ? (
              <p className="text-sm text-charcoal/60">
                Hi! Ask us anything about an order, a product, or delivery. A real member of the
                HEIDIZ team will reply here.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === "CUSTOMER" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-button px-3 py-2 text-sm ${
                      m.sender === "CUSTOMER"
                        ? "bg-burnt-orange text-white"
                        : "bg-white text-charcoal shadow-sm"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-brand-black/10 bg-white p-3"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              maxLength={2000}
              className="flex-1 rounded-button border border-brand-black/10 bg-ivory px-3 py-2 text-sm outline-none focus:border-burnt-orange"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              aria-label="Send message"
              className="rounded-full bg-burnt-orange p-2.5 text-white transition-opacity disabled:opacity-40"
            >
              <Send className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-burnt-orange text-white shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" strokeWidth={1.5} /> : <MessageCircle className="h-6 w-6" strokeWidth={1.5} />}
      </button>
    </div>
  );
}
