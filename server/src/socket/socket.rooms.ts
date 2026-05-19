import { Server, Socket } from 'socket.io';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';

export const handleRooms = (io: Server, socket: Socket) => {
  // join_room is used both on initial connect and as a heartbeat (every 30s from the client).
  // We ignore the client-supplied userId payload and use the JWT-verified socket.data.userId instead.
  socket.on('join_room', async () => {
    const userId = socket.data.userId as string | undefined;
    if (!userId) return;

    socket.join(userId);
    console.log(`👤 User ${userId} joined room ${userId}`);

    try {
      await redis.set(`online:${userId}`, '1', 'EX', 90);
    } catch (err) {
      console.error('Redis set online error:', err);
    }

    io.emit('user_online', userId);

    // Join all group rooms so the user receives group messages
    try {
      const memberships = await prisma.groupMember.findMany({
        where: { userId },
        select: { groupId: true },
      });
      for (const gm of memberships) {
        socket.join(`group:${gm.groupId}`);
      }
    } catch (err) {
      console.error('Error joining group rooms', err);
    }
  });

  // Allow client to join a specific group room immediately (e.g. after creating a group)
  socket.on('join_group_room', (groupId: string) => {
    socket.join(`group:${groupId}`);
    console.log(`👥 Socket ${socket.id} joined group room ${groupId}`);
  });

  socket.on('disconnect', async () => {
    console.log('❌ Connection Closed:', socket.id);
    if (socket.data.userId) {
      const userId = socket.data.userId;
      try {
        await redis.del(`online:${userId}`);
      } catch (err) {
        console.error('Redis del online error:', err);
      }

      const now = new Date();
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { lastSeen: now },
        });
      } catch (err) {
        console.error('Error updating last seen', err);
      }

      io.emit('user_offline', { userId, lastSeen: now.toISOString() });
    }
  });
};
