import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const sessionKey = (userId: string) => `session:${userId}`;

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      bio: true,
      avatarUrl: true,
      lastSeen: true,
      createdAt: true,
      passwordHash: true,
    },
  });

  if (!user) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new Error('Invalid credentials');

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  await redis.set(sessionKey(user.id), token, 'EX', SESSION_TTL);

  return { user, token };
};

export const logoutUser = async (userId: string) => {
  await redis.del(sessionKey(userId));
};
