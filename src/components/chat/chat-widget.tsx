"use client";

// Floating live-chat widget (2026-08-15). Polling-based, not a raw socket,
// see prisma/schema.prisma's comment above ChatConversation for why. Guest
// chat works like cart/wishlist: no account needed, the conversation id and
// the visitor's name/email are persisted to localStorage so a guest returns
// to the same thread, already identified, on a later visit.
//
// Reworked 2026-09-02, after staff replies were reaching nobody:
//
//  - A name and email are collected before the first message. Every guest
//    thread used to land in the staff inbox as an anonymous "Guest", so two
//    concurrent conversations were indistinguishable and a reply went into
//    the wrong one.
//  - While the panel is closed the widget polls a separate, read-only
//    unread endpoint and shows a badge on the bubble. It used to poll
//    nothing at all when closed, so a staff reply stayed invisible until
//    the customer happened to reopen the panel by chance. The unread poll
//    has to be its own route because the messages GET marks replies read.
//  - Either side can end a chat. An ended thread keeps its transcript and
//    offers to start a fresh one.

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistedState } from "@/lib/use-persisted-state";
import { useUser } from "@clerk/nextjs";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

const STORAGE_KEY = "heidiz-chat-conversation-v1";
const IDENTITY_KEY = "heidiz-chat-identity-v1";
const POLL_INTERVAL_MS = 4000;
// Slower than the open-panel poll: this only drives a badge, and it runs on
// every page of the site for the whole visit.
const UNREAD_POLL_INTERVAL_MS = 15000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type ChatMessage = {
  id: string;
  sender: "CUSTOMER" | "STAFF";
  senderName: string | null;
  body: string;
  createdAt: string;
};

type Identity = { name: string; email: string };

// Stable references for usePersistedState's "nothing stored" case.
const NO_CONVERSATION: string | null = null;
const NO_IDENTITY: Identity | null = null;

export function ChatWidget() {
  const { user } = useUser();

  const [open, setOpen] = useState(false);
  // Both survive a reload through the same store the cart and wishlist use
  // (src/lib/use-persisted-state.ts) — so a guest comes back to their own
  // thread, already identified, and a blocked-storage browser degrades to
  // session-only instead of throwing.
  const [conversationId, setConversationId, clearConversationId] = usePersistedState<string | null>(
    STORAGE_KEY,
    NO_CONVERSATION
  );
  const [identity, setIdentity] = usePersistedState<Identity | null>(IDENTITY_KEY, NO_IDENTITY);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<"OPEN" | "CLOSED">("OPEN");
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  // null until the staff check answers. Staff never get seeded from their
  // account, see the effect and the seed below.
  const [isStaff, setIsStaff] = useState<boolean | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Prefill from a previous visit, else from the signed-in Clerk account,
  // which saves a customer retyping what we already know. Derived during
  // render and applied as defaultValue on uncontrolled inputs rather than
  // pushed into state from an effect, so there is no render pass where the
  // fields are wrong. Clerk resolves asynchronously, so the form is keyed
  // on the seed and remounts once when the account arrives; anything typed
  // before that is preserved because the key only changes from empty.
  //
  // Staff are pointedly excluded. An admin browsing the storefront while
  // signed in was getting their own admin address prefilled into the
  // customer chat form, which is not what that seed is for and puts an
  // internal address one stray click away from a customer thread. Only seed
  // once the check has come back negative: while it is still unknown the
  // fields stay blank, so the admin address never appears even briefly.
  const seedFromAccount = isStaff === false;
  const seedName = identity?.name || (seedFromAccount ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() : "");
  const seedEmail = identity?.email || (seedFromAccount ? user?.primaryEmailAddress?.emailAddress ?? "" : "");

  // Resolve staff status lazily: only once a signed-in visitor with no
  // stored identity actually opens the panel. Doing it on mount would cost
  // the whole storefront a request per page load for a form most visitors
  // never open.
  useEffect(() => {
    if (!open || !user || identity || isStaff !== null) return;
    let cancelled = false;
    fetch("/api/staff/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setIsStaff(Boolean(data?.isStaff));
      })
      .catch(() => {
        // Fail closed. If the check cannot be reached, assume staff and
        // leave the fields blank: the cost of being wrong that way is one
        // retyped address, against seeding an internal address into a
        // customer conversation.
        if (!cancelled) setIsStaff(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, user, identity, isStaff]);

  const fetchMessages = useCallback((id: string) => {
    fetch(`/api/chat/${id}/messages`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.messages) {
          setMessages(data.messages);
          setUnread(0);
        }
        if (data?.status) setStatus(data.status);
      })
      .catch(() => {
        // silent, next poll tick retries
      });
  }, []);

  // Open panel: poll the full thread.
  useEffect(() => {
    if (!open || !conversationId) return;
    fetchMessages(conversationId);
    const interval = setInterval(() => fetchMessages(conversationId), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [open, conversationId, fetchMessages]);

  // Closed panel: poll only the unread count, which does not mark anything
  // read. This is what surfaces a staff reply to a customer who has the
  // widget shut.
  useEffect(() => {
    if (open || !conversationId) return;

    let cancelled = false;
    const check = () => {
      fetch(`/api/chat/${conversationId}/unread`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (cancelled || !data) return;
          if (typeof data.unread === "number") setUnread(data.unread);
          if (data.status) setStatus(data.status);
        })
        .catch(() => {});
    };

    check();
    const interval = setInterval(check, UNREAD_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [open, conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleIdentitySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();

    if (name.length < 2) {
      setFormError("Please enter your name.");
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    setFormError(null);
    setIdentity({ name, email });
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending || !identity) return;
    setSending(true);
    setError(null);
    setDraft("");

    try {
      // First message of a new thread creates the conversation and the
      // message in one request, so a conversation with nothing in it can
      // never reach the staff inbox.
      if (!conversationId) {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: identity.name, email: identity.email, body: text }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.conversationId) {
          setError(data.error ?? "Could not send. Please try again.");
          setDraft(text);
          return;
        }
        setConversationId(data.conversationId);
        setStatus("OPEN");
        setMessages(data.message ? [data.message] : []);
        return;
      }

      const res = await fetch(`/api/chat/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setStatus("OPEN");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not send. Please try again.");
        setDraft(text); // restore so the customer doesn't lose what they typed
      }
    } catch {
      setError("Could not send. Please check your connection.");
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  async function handleEndChat() {
    if (!conversationId || ending) return;
    setEnding(true);
    try {
      const res = await fetch(`/api/chat/${conversationId}/close`, { method: "POST" });
      if (res.ok) setStatus("CLOSED");
      else setError("Could not end the chat. Please try again.");
    } catch {
      setError("Could not end the chat. Please try again.");
    } finally {
      setEnding(false);
    }
  }

  // Clears the local thread only — the transcript stays with the store, the
  // customer just gets a fresh conversation next time they write in.
  function handleStartNewChat() {
    clearConversationId();
    setMessages([]);
    setStatus("OPEN");
    setUnread(0);
    setError(null);
  }

  const needsIdentity = !identity && !conversationId;
  const ended = status === "CLOSED";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[30rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[4px] border border-brand-black/10 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-brand-black px-4 py-3 text-white">
            <div>
              <p className="font-display text-sm tracking-wide">HEIDIZ Support</p>
              <p className="text-xs text-white/60">
                {identity ? `Chatting as ${identity.name}` : "We typically reply shortly"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {conversationId && !ended && (
                <button
                  type="button"
                  onClick={handleEndChat}
                  disabled={ending}
                  className="rounded-button px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  {ending ? "Ending..." : "End chat"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {needsIdentity ? (
            <form
              key={`${seedName}|${seedEmail}`}
              onSubmit={handleIdentitySubmit}
              className="flex flex-1 flex-col gap-3 overflow-y-auto bg-ivory px-4 py-5"
            >
              <p className="text-sm text-charcoal/70">
                Before we start, who are we speaking with? We use your email only to follow up on
                this conversation if we get disconnected.
              </p>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs uppercase tracking-wide text-charcoal/80">Your name</span>
                <input
                  type="text"
                  name="name"
                  defaultValue={seedName}
                  maxLength={80}
                  autoComplete="name"
                  className="rounded-button border border-brand-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-burnt-orange"
                  placeholder="Amaka Obi"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs uppercase tracking-wide text-charcoal/80">Email</span>
                <input
                  type="email"
                  name="email"
                  defaultValue={seedEmail}
                  maxLength={160}
                  autoComplete="email"
                  className="rounded-button border border-brand-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-burnt-orange"
                  placeholder="you@example.com"
                />
              </label>
              {formError && <p className="text-xs text-red-600">{formError}</p>}
              <button
                type="submit"
                className="mt-1 rounded-button bg-burnt-orange px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Start chat
              </button>
            </form>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-ivory px-4 py-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-charcoal/80">
                    Hi{identity ? ` ${identity.name.split(" ")[0]}` : ""}! Ask us anything about an
                    order, a product, or delivery. A real member of the HEIDIZ team will reply here.
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

                {ended && (
                  <p className="pt-2 text-center text-xs text-charcoal/70">
                    This chat has ended. Send a message below to pick it back up, or start a new
                    one.
                  </p>
                )}
              </div>

              {error && (
                <p className="border-t border-brand-black/10 bg-red-50 px-4 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}

              {ended ? (
                <div className="flex items-center gap-2 border-t border-brand-black/10 bg-white p-3">
                  <button
                    type="button"
                    onClick={handleStartNewChat}
                    className="flex-1 rounded-button bg-burnt-orange px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Start a new chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("OPEN")}
                    className="rounded-button border border-brand-black/10 px-3 py-2.5 text-sm text-charcoal hover:border-burnt-orange hover:text-burnt-orange"
                  >
                    Reply here
                  </button>
                </div>
              ) : (
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
                    placeholder="Type a message..."
                    maxLength={2000}
                    className="flex-1 rounded-button border border-brand-black/10 bg-ivory px-3 py-2 text-sm outline-none focus:border-burnt-orange"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    aria-label="Send message"
                    className="rounded-full bg-burnt-orange p-2.5 text-white transition-opacity disabled:opacity-40"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                    ) : (
                      <Send className="h-4 w-4" strokeWidth={1.5} />
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : unread > 0 ? `Open chat, ${unread} new replies` : "Open chat"}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-burnt-orange text-white shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" strokeWidth={1.5} /> : <MessageCircle className="h-6 w-6" strokeWidth={1.5} />}
        {!open && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ivory bg-brand-black px-1 text-xs font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}
