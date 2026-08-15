// Server-side only (imports `prisma`, doesn't belong in client bundles,
// same convention as products.ts). Data layer for the live chat feature
// (2026-08-15), shared by both the customer-facing /api/chat routes and
// the staff-facing /api/admin/chat routes so the two sides can't drift
// out of sync.

import { prisma } from "@/lib/prisma";

export async function findConversation(id: string) {
  return prisma.chatConversation.findUnique({ where: { id } });
}

export async function createConversation(params: {
  userId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
}) {
  return prisma.chatConversation.create({
    data: {
      userId: params.userId ?? null,
      customerName: params.customerName ?? null,
      customerEmail: params.customerEmail ?? null,
    },
  });
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

  return conversations.map((c) => ({
    id: c.id,
    customerName: c.customerName,
    customerEmail: c.customerEmail,
    status: c.status,
    lastMessageAt: c.lastMessageAt,
    lastMessage: c.messages[0] ?? null,
    unreadCount: c._count.messages,
  }));
}

export async function unreadCountForStaff() {
  return prisma.chatMessage.count({ where: { sender: "CUSTOMER", readByStaff: false } });
}
