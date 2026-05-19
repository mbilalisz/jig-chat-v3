import { prisma } from '../lib/prisma';
import { encrypt, decrypt } from '../lib/crypto';

const decryptRow = <T extends { content: string }>(row: T): T => ({
  ...row,
  content: decrypt(row.content),
});

export const saveMessage = async ({
  senderId,
  receiverId,
  content,
  type = 'text',
}: {
  senderId: string;
  receiverId: string;
  content: string;
  type?: string;
}) => {
  const message = await prisma.message.create({
    data: { senderId, receiverId, content: encrypt(content), type },
  });
  return decryptRow(message);
};

export const getMessagesBetweenUsers = async (
  userAId: string,
  userBId: string,
) => {
  const rows = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userAId, receiverId: userBId },
        { senderId: userBId, receiverId: userAId },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(decryptRow);
};

export const saveGroupMessage = async ({
  senderId,
  groupId,
  content,
  type = 'text',
}: {
  senderId: string;
  groupId: string;
  content: string;
  type?: string;
}) => {
  const row = await prisma.message.create({
    data: { senderId, groupId, content: encrypt(content), type },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
  return decryptRow(row);
};

export const getGroupMessages = async (groupId: string) => {
  const rows = await prisma.message.findMany({
    where: { groupId },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(decryptRow);
};

export const deleteMessage = async (messageId: string, requesterId: string) => {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw new Error('NOT_FOUND');
  if (message.senderId !== requesterId) throw new Error('FORBIDDEN');
  await prisma.message.delete({ where: { id: messageId } });
  return message;
};

export const markMessagesAsRead = async (senderId: string, receiverId: string) => {
  return prisma.message.updateMany({
    where: {
      senderId,
      receiverId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
};

export const searchMessagesAndContacts = async (query: string, currentUserId: string) => {
  const q = query.trim();
  if (!q || q.length < 2) return { contacts: [], messages: [] };

  const contacts = await prisma.user.findMany({
    where: {
      name: { contains: q, mode: 'insensitive' },
      id: { not: currentUserId },
    },
    select: { id: true, name: true, avatarUrl: true },
    take: 5,
  });

  const rawMessages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
      groupId: null,
      type: 'text',
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      receiver: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const ql = q.toLowerCase();
  const messages = rawMessages
    .map((m) => ({ ...m, content: decrypt(m.content) }))
    .filter((m) => m.content.toLowerCase().includes(ql))
    .slice(0, 8)
    .map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      senderId: m.senderId,
      receiverId: m.receiverId,
      sender: m.sender,
      otherUser: m.senderId === currentUserId ? m.receiver : m.sender,
    }));

  return { contacts, messages };
};
