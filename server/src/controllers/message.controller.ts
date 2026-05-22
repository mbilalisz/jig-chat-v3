import { Request, Response } from "express";
import {
  getMessagesBetweenUsers,
  markMessagesAsRead,
  getGroupMessages as getGroupMessagesService,
  deleteMessage,
  searchMessagesAndContacts,
} from "../services/message.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { getIO } from "../lib/io";

export const getMessages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const senderId = req.params.senderId as string;
  const receiverId = req.params.receiverId as string;

  try {
    const messages = await getMessagesBetweenUsers(senderId, receiverId);
    res.json(messages);
  } catch (error) {
    console.error("Fetch messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getGroupMessagesController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const groupId = req.params.groupId as string;
  try {
    const messages = await getGroupMessagesService(groupId);
    res.json(messages);
  } catch (error) {
    console.error("Fetch group messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteMessageController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { messageId }: any = req.params;
  try {
    const message = await deleteMessage(messageId, req.userId!);
    const io = getIO();
    if (io) {
      const payload = { messageId };
      if (message.receiverId) {
        io.to(req.userId!).emit("message_deleted", payload);
        io.to(message.receiverId).emit("message_deleted", payload);
      } else if (message.groupId) {
        io.to(`group:${message.groupId}`).emit("message_deleted", payload);
      }
    }
    res.json({ message: "Deleted" });
  } catch (error: any) {
    if (error.message === "NOT_FOUND")
      res.status(404).json({ message: "Message not found" });
    else if (error.message === "FORBIDDEN")
      res.status(403).json({ message: "Cannot delete others' messages" });
    else {
      console.error("Delete message error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
};

export const searchController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = req.query.q as string;
  const currentUserId = req.query.currentUserId as string;
  if (!currentUserId) {
    res.status(400).json({ message: "currentUserId is required" });
    return;
  }
  try {
    const results = await searchMessagesAndContacts(query || "", currentUserId);
    res.json(results);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { senderId, receiverId } = req.body;

  if (!senderId || !receiverId) {
    res.status(400).json({ message: "Sender ID and Receiver ID are required" });
    return;
  }

  try {
    await markMessagesAsRead(senderId, receiverId);
    res.json({ message: "Messages marked as read" });
    // Notify the original sender so they can show a read receipt on their side
    getIO()?.to(senderId).emit('messages_read', { readerId: receiverId, senderId });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
