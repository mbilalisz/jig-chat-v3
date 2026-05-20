import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { saveMessage, saveGroupMessage } from '../services/message.service';
import { handleRooms } from './socket.rooms';
import { prisma } from '../lib/prisma';

export const setupSocketHandlers = (io: Server) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log('⚡ New Connection:', socket.id);

    handleRooms(io, socket);

    // DM message
    socket.on('send_message', async (data) => {
      const { senderId, receiverId, content, type } = data;
      console.log(`✉️ Processing message from ${senderId} to ${receiverId}`);
      try {
        const message = await saveMessage({ senderId, receiverId, content, type: type || 'text' });
        console.log(`✅ Message saved to DB: ${message.id}`);
        // Un-hide the receiver if the sender previously removed them
        if (senderId !== receiverId) {
          try {
            await prisma.hiddenContact.deleteMany({
              where: { hiderId: senderId, hiddenId: receiverId },
            });
          } catch {
            // non-critical cleanup, don't block message delivery
          }
          io.to(receiverId).emit('receive_message', message);
        }
        io.to(senderId).emit('receive_message', message);
      } catch (error) {
        console.error('❌ Error saving message:', error);
      }
    });

    // Group message
    socket.on('send_group_message', async (data) => {
      const { senderId, groupId, content, type } = data;
      console.log(`👥 Group message from ${senderId} to group ${groupId}`);
      try {
        const membership = await prisma.groupMember.findUnique({
          where: { groupId_userId: { groupId, userId: senderId } },
        });
        if (!membership) {
          socket.emit('group_send_error', { groupId, message: 'You are no longer a member of this group' });
          return;
        }
        const message = await saveGroupMessage({ senderId, groupId, content, type: type || 'text' });
        io.to(`group:${groupId}`).emit('receive_group_message', message);
      } catch (error) {
        console.error('❌ Error saving group message:', error);
      }
    });

    // Typing events (DM only)
    socket.on('typing', ({ senderId, receiverId }) => {
      io.to(receiverId).emit('user_typing', senderId);
    });

    socket.on('stop_typing', ({ senderId, receiverId }) => {
      io.to(receiverId).emit('user_stop_typing', senderId);
    });
  });
};
