import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";
import { decrypt } from "../lib/crypto";

export const getAllUsersWithStatus = async (
  currentUserId?: string,
  filter?: string,
) => {
  let userIdsToInclude: string[] | null = null;

  // Fetch IDs of contacts hidden by the current user
  let hiddenIds: string[] = [];
  if (currentUserId) {
    const hidden = await (prisma as any).hiddenContact.findMany({
      where: { hiderId: currentUserId },
      select: { hiddenId: true },
    });
    console.log("Hidden contacts for user", currentUserId, hidden);
    hiddenIds = hidden.map((h: { hiddenId: string }) => h.hiddenId);
  }

  if (currentUserId) {
    if (filter === "Unread") {
      const unreadMessages = await prisma.message.findMany({
        where: { receiverId: currentUserId, readAt: null },
        select: { senderId: true },
      });
      userIdsToInclude = Array.from(
        new Set(unreadMessages.map((m: { senderId: any }) => m.senderId)),
      ).filter((id) => !hiddenIds.includes(id));
    } else if (filter === "Favorites") {
      const favorites = await prisma.favorite.findMany({
        where: { userId: currentUserId },
        select: { favoriteId: true },
      });
      userIdsToInclude = favorites
        .map((f: { favoriteId: any }) => f.favoriteId)
        .filter((id: string) => !hiddenIds.includes(id));
    } else {
      // Default "All messages": only show users with at least one DM conversation
      const msgs = await prisma.message.findMany({
        where: {
          groupId: null,
          OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
        },
        select: { senderId: true, receiverId: true },
      });
      const contactSet = new Set<string>();
      for (const m of msgs) {
        const other: string | null =
          m.senderId === currentUserId ? m.receiverId : m.senderId;
        if (other && other !== currentUserId) contactSet.add(other);
      }
      userIdsToInclude = Array.from(contactSet).filter(
        (id) => !hiddenIds.includes(id),
      );
    }
  }

  const users = await prisma.user.findMany({
    where: userIdsToInclude
      ? { id: { in: userIdsToInclude } }
      : hiddenIds.length > 0
        ? { id: { notIn: hiddenIds } }
        : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      lastSeen: true,
    },
  });

  // Batch-fetch all online statuses in one Redis round trip
  const onlineKeys = users.map((u: { id: string }) => `online:${u.id}`);
  const onlineValues =
    onlineKeys.length > 0 ? await redis.mget(...onlineKeys) : [];
  const onlineMap = new Map(
    users.map((u: { id: string }, i: number) => [u.id, onlineValues[i]]),
  );

  // Check last message, and unread count for each user
  const usersWithStatus = await Promise.all(
    users.map(async (user: { id: string; avatarUrl: any }) => {
      const isOnline = onlineMap.get(user.id);

      let lastMessage = null;
      let unreadCount = 0;
      let isFavorite = false;

      if (currentUserId) {
        // Fetch last message
        if (user.id !== currentUserId) {
          const raw = await prisma.message.findFirst({
            where: {
              OR: [
                { senderId: currentUserId, receiverId: user.id },
                { senderId: user.id, receiverId: currentUserId },
              ],
            },
            orderBy: { createdAt: "desc" },
            select: { content: true, createdAt: true },
          });
          lastMessage = raw ? { ...raw, content: decrypt(raw.content) } : null;

          // Count unread messages
          unreadCount = await prisma.message.count({
            where: {
              senderId: user.id,
              receiverId: currentUserId,
              readAt: null,
            },
          });

          // Check if favorite
          const favorite = await prisma.favorite.findUnique({
            where: {
              userId_favoriteId: {
                userId: currentUserId,
                favoriteId: user.id,
              },
            },
          });
          isFavorite = !!favorite;
        }
      }

      return {
        ...user,
        isOnline: !!isOnline,
        status: isOnline ? "online" : "offline",
        avatar: user.avatarUrl,
        lastMessage,
        unreadCount,
        isFavorite,
      };
    }),
  );

  // Sort by last message time descending; contacts with no messages go to the bottom
  usersWithStatus.sort((a, b) => {
    const tA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const tB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return tB - tA;
  });

  return usersWithStatus;
};

export const hideContact = async (hiderId: string, hiddenId: string) => {
  await (prisma as any).hiddenContact.upsert({
    where: { hiderId_hiddenId: { hiderId, hiddenId } },
    update: {},
    create: { hiderId, hiddenId },
  });
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      bio: true,
      lastSeen: true,
    },
  });

  if (!user) return null;

  const isOnline = await redis.get(`online:${userId}`);

  return {
    ...user,
    isOnline: !!isOnline,
    status: isOnline ? 'online' : 'offline',
    avatar: user.avatarUrl,
  };
};

export const toggleFavorite = async (userId: string, favoriteId: string) => {
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_favoriteId: {
        userId,
        favoriteId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: {
        userId_favoriteId: {
          userId,
          favoriteId,
        },
      },
    });
    return { isFavorite: false };
  } else {
    await prisma.favorite.create({
      data: {
        userId,
        favoriteId,
      },
    });
    return { isFavorite: true };
  }
};
