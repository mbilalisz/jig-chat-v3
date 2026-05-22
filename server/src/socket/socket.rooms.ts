import { Server, Socket } from 'socket.io';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';

// How long (ms) to wait after the last socket closes before declaring a user offline.
// Absorbs page-refreshes which briefly disconnect then reconnect.
const OFFLINE_GRACE_MS = 1500;

export const handleRooms = (io: Server, socket: Socket) => {
  // join_room is used both on initial connect and as a heartbeat (every 30s from the client).
  // JWT-verified userId is stored in socket.data; we never trust the client payload.
  socket.on('join_room', async () => {
    const userId = socket.data.userId as string | undefined;
    if (!userId) return;

    socket.join(userId);

    try {
      // Track this socket ID in a per-user set.
      // SADD returns 1 when the member is new, 0 when it already existed (heartbeat).
      const isNewSocket = await redis.sadd(`sockets:${userId}`, socket.id);
      // Refresh TTL on every join/heartbeat so the set survives as long as any tab is open.
      await redis.expire(`sockets:${userId}`, 90);
      await redis.set(`online:${userId}`, '1', 'EX', 90);

      if (isNewSocket === 1) {
        // A genuinely new socket — check if this is the user's first active connection.
        const socketCount = await redis.scard(`sockets:${userId}`);
        if (socketCount === 1) {
          console.log(`✅ User ${userId} is now online`);
          io.emit('user_online', userId);
        }
      }
      // Heartbeat (isNewSocket === 0): socket.id already in set — only TTL was refreshed, no broadcast.
    } catch (err) {
      console.error('Redis join_room error:', err);
    }

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
      console.error('Error joining group rooms:', err);
    }
  });

  // Allow client to join a specific group room immediately (e.g. after creating a group)
  socket.on('join_group_room', (groupId: string) => {
    socket.join(`group:${groupId}`);
    console.log(`👥 Socket ${socket.id} joined group room ${groupId}`);
  });

  socket.on('disconnect', async () => {
    console.log('❌ Connection Closed:', socket.id);
    const userId = socket.data.userId as string | undefined;
    if (!userId) return;

    try {
      await redis.srem(`sockets:${userId}`, socket.id);
      const remaining = await redis.scard(`sockets:${userId}`);

      if (remaining === 0) {
        const offlineAt = new Date();

        // Short grace period: if the user is just refreshing the page their new socket will
        // reconnect within ~500ms and re-add itself to the set, preventing a false offline.
        setTimeout(async () => {
          try {
            const nowRemaining = await redis.scard(`sockets:${userId}`);
            if (nowRemaining > 0) return; // User reconnected — stay online

            await redis.del(`online:${userId}`);
            try {
              await prisma.user.update({
                where: { id: userId },
                data: { lastSeen: offlineAt },
              });
            } catch (err) {
              console.error('Error updating lastSeen:', err);
            }

            console.log(`🔴 User ${userId} is now offline`);
            io.emit('user_offline', { userId, lastSeen: offlineAt.toISOString() });
          } catch (err) {
            console.error('Redis delayed offline error:', err);
          }
        }, OFFLINE_GRACE_MS);
      }
    } catch (err) {
      console.error('Redis disconnect error:', err);
    }
  });
};
