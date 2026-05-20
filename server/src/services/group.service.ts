import { prisma } from '../lib/prisma';
import { decrypt } from '../lib/crypto';

export const createGroup = async (
  name: string,
  description: string | undefined,
  createdBy: string,
  memberIds: string[]
) => {
  const uniqueMembers = Array.from(new Set([createdBy, ...memberIds]));
  return prisma.group.create({
    data: {
      name,
      description,
      createdBy,
      members: {
        create: uniqueMembers.map((userId) => ({
          userId,
          role: userId === createdBy ? 'admin' : 'member',
        })),
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
    },
  });
};

export const getUserGroups = async (userId: string) => {
  const [groups, favoriteRows] = await Promise.all([
    prisma.group.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, createdAt: true, sender: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.groupFavorite.findMany({
      where: { userId },
      select: { groupId: true },
    }),
  ]);

  const favoriteSet = new Set(favoriteRows.map((r) => r.groupId));

  return groups.map((g) => ({
    ...g,
    isFavorite: favoriteSet.has(g.id),
    messages: g.messages.map((m) => ({ ...m, content: decrypt(m.content) })),
  }));
};

export const getGroup = async (groupId: string) => {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
    },
  });
};

export const updateGroup = async (
  groupId: string,
  requesterId: string,
  data: { name?: string; description?: string }
) => {
  const requester = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: requesterId } },
  });
  if (!requester || requester.role !== 'admin') throw new Error('Unauthorized');
  return prisma.group.update({
    where: { id: groupId },
    data,
    include: {
      members: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
    },
  });
};

export const addMember = async (groupId: string, requesterId: string, userId: string) => {
  const requester = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: requesterId } },
  });
  if (!requester || requester.role !== 'admin') throw new Error('Unauthorized');
  return prisma.groupMember.create({
    data: { groupId, userId, role: 'member' },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
};

export const removeMember = async (groupId: string, requesterId: string, userId: string) => {
  const requester = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: requesterId } },
  });
  if (!requester) throw new Error('Not a member');
  if (requester.role !== 'admin' && requesterId !== userId) throw new Error('Unauthorized');
  return prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });
};

export const toggleGroupFavorite = async (userId: string, groupId: string) => {
  const existing = await prisma.groupFavorite.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });

  if (existing) {
    await prisma.groupFavorite.delete({
      where: { userId_groupId: { userId, groupId } },
    });
    return { isFavorite: false };
  } else {
    await prisma.groupFavorite.create({ data: { userId, groupId } });
    return { isFavorite: true };
  }
};
