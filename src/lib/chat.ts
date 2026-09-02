// Server-side only (imports `prisma`, doesn't belong in client bundles,
// same convention as products.ts). Data layer for the live chat feature
// (2026-08-15), shared by both the customer-facing /api/chat routes and
// the staff-facing /api/admin/chat routes so the two sides can't drift
// out of sync.

import { prisma } from "@/lib/prisma";

export async function findConversation(id: string) {
  return prisma.chatConversation.findUnique({ where: { id } });
}

// Creates the conversation and its first message together. The widget used
// to POST an empty conversation and only then send the message, which left
// an orphaned, message-less thread behind whenever the second call failed
// or the visitor closed the tab — and those empty "Guest" rows sat in the
// staff inbox looking exactly like real ones (2026-09-02: a reply was sent
// into one, so the customer who had actually written in never got an
// answer). Creating both at once means a conversation can't exist without
// a message in it.
export async function startConversation(params: {
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  body: string;
}) {
  // A nested create rather than prisma.$transaction: nested writes run in
  // one implicit, server-side transaction, so this is a single round trip.
  // The interactive-transaction form failed intermittently here with P2028
  // ("unable to start a transaction in the given time") — an interactive
  // transaction has to hold a session open across round trips, which Neon's
  // pooled connection can't grant fast enough on a cold start. That failure
  // landed on the very first message a customer ever sends, the worst
  // possible place for it.
  const conversation = await prisma.chatConversation.create({
    data: {
      userId: params.userId ?? null,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      messages: {
        create: {
          sender: "CUSTOMER",
          senderName: params.customerName,
          body: params.body,
          readByStaff: false,
          readByCustomer: true,
        },
      },
    },
    include: { messages: true },
  });

  return { conversation, message: conversation.messages[0] };
}

export async function listMessages(conversationId: string) {
  return prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function addMessage(params: {
  conversationId: string;
  sender: "CUSTOMER" | "STAFF";
  senderName?: string | null;
  body: string;
}) {
  const message = await prisma.chatMessage.create({
    data: {
      conversationId: params.conversationId,
      sender: params.sender,
      senderName: params.senderName ?? null,
      body: params.body,
      // A customer message starts unread by staff; a staff reply starts
      // unread by the customer. Never both, each message has exactly one
      // "other side" that hasn't seen it yet.
      readByStaff: params.sender === "STAFF",
      readByCustomer: params.sender === "CUSTOMER",
    },
  });

  // A new message from either side reopens an ended thread: whoever wrote
  // in clearly has more to say, and a reply that landed in a conversation
  // still marked CLOSED would never resurface in the staff inbox's open
  // filter.
  await prisma.chatConversation.update({
    where: { id: params.conversationId },
    data: { lastMessageAt: message.createdAt, status: "OPEN" },
  });

  return message;
}

// Marks the other side's messages as read once a side has actually looked
// at the thread. Called by both widgets on open/poll.
export async function markRead(conversationId: string, reader: "CUSTOMER" | "STAFF") {
  if (reader === "STAFF") {
    await prisma.chatMessage.updateMany({
      where: { conversationId, sender: "CUSTOMER", readByStaff: false },
      data: { readByStaff: true },
    });
  } else {
    await prisma.chatMessage.updateMany({
      where: { conversationId, sender: "STAFF", readByCustomer: false },
      data: { readByCustomer: true },
    });
  }
}

/** Ends (or reopens) a conversation. Either side can end one: the customer
 *  from the widget's "End chat", staff from the inbox. */
export async function setConversationStatus(id: string, status: "OPEN" | "CLOSED") {
  return prisma.chatConversation.update({ where: { id }, data: { status } });
}

// Read *without* marking anything read, so the customer widget can show an
// unread badge on the closed bubble. The regular messages GET can't be used
// for this: it marks staff replies read-by-customer, which would clear the
// badge for a reply the customer never actually saw.
export async function unreadForCustomer(conversationId: string) {
  return prisma.chatMessage.count({
    where: { conversationId, sender: "STAFF", readByCustomer: false },
  });
}

export async function listConversationsForStaff() {
  const conversations = await prisma.chatConversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: { messages: { where: { sender: "CUSTOMER", readByStaff: false } } },
      },
    },
  });

  return (
    conversations
      // Message-less threads are leftovers from the old two-step create
      // (see startConversation) — nothing was ever said in them, and
      // showing them alongside real ones is how a reply ended up in the
      // wrong thread. New conversations always start with a message.
      .filter((c) => c.messages.length > 0)
      .map((c) => ({
        id: c.id,
        customerName: c.customerName,
        customerEmail: c.customerEmail,
        status: c.status,
        lastMessageAt: c.lastMessageAt,
        createdAt: c.createdAt,
        lastMessage: c.messages[0] ?? null,
        unreadCount: c._count.messages,
      }))
      // Anything waiting on a reply floats to the top; the rest stay in
      // most-recent-activity order.
      .sort((a, b) => {
        if (a.unreadCount > 0 !== b.unreadCount > 0) return a.unreadCount > 0 ? -1 : 1;
        return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
      })
  );
}

export async function unreadCountForStaff() {
  return prisma.chatMessage.count({ where: { sender: "CUSTOMER", readByStaff: false } });
}
