import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      bio: true,
      avatarUrl: true,
      lastSeen: true,
      createdAt: true,
    },
  });
  if (!user) throw new Error('User not found');
  return user;
};

export const updateProfile = async (
  userId: string,
  data: { name: string; bio?: string; avatarUrl?: string }
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      bio: data.bio ?? null,
      avatarUrl: data.avatarUrl || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      bio: true,
      avatarUrl: true,
    },
  });
  return user;
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw new Error('Current password is incorrect');

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hash },
  });
};
