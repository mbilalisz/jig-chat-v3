import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { useGroupStore } from "../store/groupStore";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const useSocket = () => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const addMessage = useChatStore((state) => state.addMessage);
  const removeMessage = useChatStore((state) => state.removeMessage);

  useEffect(() => {
    if (!user || !token) return;

    if (!socket || !socket.connected) {
      socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ["websocket", "polling"],
        auth: { token },
      });
    }

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket?.id);
      socket?.emit("join_room");
      // Rejoin all group rooms on (re)connect in case the server-side join_room
      // handler hasn't fired yet or the socket reconnected after groups were loaded
      const { groups } = useGroupStore.getState();
      groups.forEach((g) => socket?.emit("join_group_room", g.id));
    });

    if (socket.connected) {
      socket.emit("join_room");
    }

    socket.off("receive_message");
    socket.off("receive_group_message");
    socket.off("message_deleted");
    socket.off("member_removed");
    socket.off("group_member_removed");
    socket.off("member_added");
    socket.off("user_online");
    socket.off("user_offline");
    socket.off("user_typing");
    socket.off("user_stop_typing");

    socket.on("message_deleted", ({ messageId }: { messageId: string }) => {
      removeMessage(messageId);
    });

    socket.on("receive_message", (message) => {
      console.log("📩 Received message:", message.id);
      const { selectedUser, incrementUnreadCount, markAsRead, bumpUserToTop, users, fetchUsers } =
        useChatStore.getState();

      const isSelfMessage = message.senderId === message.receiverId;

      if (!isSelfMessage) {
        const bumpId =
          message.senderId === user.id ? message.receiverId : message.senderId;

        const isInList = users.some((u) => u.id === bumpId);
        if (isInList) {
          bumpUserToTop(bumpId, {
            content: message.content,
            createdAt: message.createdAt,
          });
        } else {
          fetchUsers(user.id);
        }

        if (message.senderId !== user.id) {
          if (selectedUser?.id === message.senderId) {
            markAsRead(message.senderId, user.id);
          } else {
            incrementUnreadCount(message.senderId);
          }
        }
      }

      const isCurrentConversation =
        (message.senderId === user.id &&
          message.receiverId === selectedUser?.id) ||
        (message.senderId === selectedUser?.id &&
          message.receiverId === user.id);

      if (isCurrentConversation) {
        addMessage(message);
      }
    });

    socket.on("receive_group_message", (message) => {
      console.log("👥 Received group message:", message.id);
      const { selectedGroup, addGroupMessage, incrementGroupUnreadCount, bumpGroupLastMessage } =
        useChatStore.getState();

      bumpGroupLastMessage(message.groupId, {
        content: message.content,
        createdAt: message.createdAt,
        senderName: message.sender?.name,
      });

      if (selectedGroup?.id === message.groupId) {
        addGroupMessage(message);
      } else {
        incrementGroupUnreadCount(message.groupId);
      }
    });

    // Only the removed user receives this — guard with userId check so accidental
    // broadcasts never wipe the group from other users' sidebars.
    socket.on("member_removed", ({ groupId, userId }: { groupId: string; userId: string }) => {
      if (userId !== user.id) return;
      useGroupStore.getState().removeGroupLocally(groupId);
      const { selectedGroup, setSelectedGroup } = useChatStore.getState();
      if (selectedGroup?.id === groupId) setSelectedGroup(null);
    });

    // All remaining group members receive this to keep their member list in sync.
    socket.on("group_member_removed", ({ groupId, userId }: { groupId: string; userId: string }) => {
      useGroupStore.getState().removeMemberLocally(groupId, userId);
      const { selectedGroup, setSelectedGroup } = useChatStore.getState();
      if (selectedGroup?.id === groupId) {
        setSelectedGroup({
          ...selectedGroup,
          members: selectedGroup.members.filter((m) => m.userId !== userId),
        });
      }
    });

    socket.on("member_added", ({ group, systemMessage }: { group: any; systemMessage: any }) => {
      useGroupStore.getState().addGroupLocally(group);
      useChatStore.getState().bumpGroupLastMessage(group.id, {
        content: systemMessage.content,
        createdAt: systemMessage.createdAt,
      });
      socket?.emit("join_group_room", group.id);
    });

    socket.on("user_online", (userId) => {
      useChatStore.getState().updateUserStatus(userId, true);
    });

    socket.on("user_offline", (data) => {
      if (typeof data === "string") {
        useChatStore.getState().updateUserStatus(data, false);
      } else {
        useChatStore.getState().updateUserStatus(data.userId, false, data.lastSeen);
      }
    });

    socket.on("user_typing", (userId) => {
      useChatStore.getState().updateUserTypingStatus(userId, true);
    });

    socket.on("user_stop_typing", (userId) => {
      useChatStore.getState().updateUserTypingStatus(userId, false);
    });

    // Heartbeat: refresh Redis online TTL every 30s
    const heartbeat = setInterval(() => {
      if (socket?.connected) {
        socket.emit("join_room");
      }
    }, 30_000);

    return () => {
      clearInterval(heartbeat);
      socket?.off("message_deleted");
      socket?.off("receive_message");
      socket?.off("receive_group_message");
      socket?.off("member_removed");
      socket?.off("group_member_removed");
      socket?.off("member_added");
      socket?.off("user_online");
      socket?.off("user_offline");
      socket?.off("user_typing");
      socket?.off("user_stop_typing");
      socket?.off("connect");
    };
  }, [user, addMessage]);

  const sendMessage = (receiverId: string, content: string) => {
    if (!user || !socket) return;
    if (!socket.connected) socket.connect();
    socket.emit("send_message", {
      senderId: user.id,
      receiverId,
      content,
      type: "text",
    });
  };

  const sendGroupMessage = (groupId: string, content: string) => {
    if (!user || !socket) return;
    if (!socket.connected) socket.connect();
    socket.emit("send_group_message", {
      senderId: user.id,
      groupId,
      content,
      type: "text",
    });
  };

  const emitTyping = (receiverId: string) => {
    if (socket?.connected && user) {
      socket.emit("typing", { senderId: user.id, receiverId });
    }
  };

  const emitStopTyping = (receiverId: string) => {
    if (socket?.connected && user) {
      socket.emit("stop_typing", { senderId: user.id, receiverId });
    }
  };

  return { sendMessage, sendGroupMessage, emitTyping, emitStopTyping };
};

// Standalone export so non-hook code (e.g. groupStore) can join a group room immediately
export const joinGroupRoom = (groupId: string) => {
  if (socket?.connected) {
    socket.emit("join_group_room", groupId);
  }
};
