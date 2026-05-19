import React, { useMemo, useState } from "react";
import { Star, Users, Info, UserX } from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { useGroupStore } from "../../store/groupStore";
import { Avatar } from "../shared/Avatar";
import type { Group, User } from "../../types";

type ListItem =
  | { kind: "user"; data: User }
  | { kind: "group"; data: Group; lastMessage?: { content: string; createdAt: string; senderName?: string }; unreadCount: number; isFavorite: boolean };

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true });

export const ContactList: React.FC = () => {
  const {
    users, setSelectedUser, selectedUser,
    selectedGroup, setSelectedGroup,
    markAsRead, groupUnreadCounts, groupLastMessages,
    activeTab, hideContact,
  } = useChatStore();
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
  const { user: currentUser } = useAuthStore();
  const { groups, setIsModalOpen, favoriteGroupIds, toggleGroupFavorite } = useGroupStore();

  const filteredUsers = useMemo(() => {
    switch (activeTab) {
      case "Unread":
        return users.filter((u) => (u.unreadCount || 0) > 0);
      case "Favorites":
        return users.filter((u) => u.isFavorite);
      case "Groups":
        return [];
      default:
        return users;
    }
  }, [users, activeTab]);

  const filteredGroups = useMemo(() => {
    switch (activeTab) {
      case "Unread":
        return groups.filter((g) => (groupUnreadCounts[g.id] || 0) > 0);
      case "Favorites":
        return groups.filter((g) => favoriteGroupIds.includes(g.id));
      default:
        return groups;
    }
  }, [groups, activeTab, groupUnreadCounts, favoriteGroupIds]);

  const items = useMemo<ListItem[]>(() => {
    const userItems: ListItem[] = filteredUsers.map((u) => ({ kind: "user", data: u }));
    const groupItems: ListItem[] = filteredGroups.map((g) => ({
      kind: "group",
      data: g,
      lastMessage: groupLastMessages[g.id],
      unreadCount: groupUnreadCounts[g.id] || 0,
      isFavorite: favoriteGroupIds.includes(g.id),
    }));
    return [...userItems, ...groupItems].sort((a, b) => {
      const tA = a.kind === "user"
        ? (a.data.lastMessage?.createdAt ? new Date(a.data.lastMessage.createdAt).getTime() : 0)
        : (a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0);
      const tB = b.kind === "user"
        ? (b.data.lastMessage?.createdAt ? new Date(b.data.lastMessage.createdAt).getTime() : 0)
        : (b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0);
      return tB - tA;
    });
  }, [filteredUsers, filteredGroups, groupLastMessages, groupUnreadCounts, favoriteGroupIds]);

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-40 text-slate-300 italic">
        <p className="text-sm">No messages yet</p>
      </div>
    );
  }

  const selfUser = currentUser
    ? {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        avatarUrl: currentUser.avatarUrl,
        isFavorite: false,
        isOnline: true,
      }
    : null;

  const isSelfSelected = selectedUser?.id === currentUser?.id;

  return (
    <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
      {/* Message Yourself entry */}
      {selfUser && (activeTab === "All messages" || activeTab === "Favorites") && (
        <div
          onClick={() => {
            setSelectedUser(selfUser as any);
          }}
          className={`flex items-center px-6 py-3 cursor-pointer transition-all border-b border-slate-50
            ${isSelfSelected ? "bg-primary/5" : "hover:bg-slate-50"}`}
        >
          <div className="relative">
            <Avatar
              src={selfUser.avatar}
              alt={selfUser.name}
              fallback={selfUser.name?.substring(0, 2).toUpperCase()}
              className="w-12 h-12 ring-2 ring-white"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <div className="flex-1 ml-4 min-w-0">
            <div className="flex justify-between items-baseline mb-0.5">
              <h3 className="text-[15px] font-bold text-slate-800 truncate">
                {selfUser.name} <span className="text-primary font-normal text-[12px]">(You)</span>
              </h3>
            </div>
            <p className="text-[13px] text-slate-400 truncate">Saved messages</p>
          </div>
        </div>
      )}
      {items.map((item) => {
        if (item.kind === "user") {
          const user = item.data;
          return (
            <div
              key={user.id}
              onClick={() => {
                setSelectedUser(user);
                if (user.unreadCount && user.unreadCount > 0) {
                  markAsRead(user.id, currentUser!.id);
                }
              }}
              onMouseEnter={() => setHoveredUserId(user.id)}
              onMouseLeave={() => setHoveredUserId(null)}
              className={`relative flex items-center px-6 py-3 cursor-pointer transition-all border-b border-slate-50
              ${selectedUser?.id === user.id ? "bg-primary/5" : "hover:bg-slate-50"}`}
            >
              <div className="relative">
                <Avatar
                  src={user.avatar}
                  alt={user.name}
                  fallback={user.name?.substring(0, 2).toUpperCase()}
                  className="w-12 h-12 ring-2 ring-white"
                />
                {user.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>

              <div className="flex-1 ml-4 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <div className="flex items-center gap-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-slate-800 truncate">
                      {user.id === currentUser?.id ? `${user.name} (You)` : user.name}
                    </h3>
                    {user.isFavorite && (
                      <Star size={10} className="text-yellow-400 fill-yellow-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    {user.lastMessage
                      ? formatTime(user.lastMessage.createdAt)
                      : user.lastSeen
                        ? formatTime(user.lastSeen)
                        : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[13px] text-slate-400 truncate pr-4">
                    {user.isTyping ? (
                      <span className="text-primary italic font-medium">Typing...</span>
                    ) : user.lastMessage ? (
                      user.lastMessage.content
                    ) : (
                      "No messages yet"
                    )}
                  </p>
                  {user.unreadCount && user.unreadCount > 0 ? (
                    <span className="bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                      {user.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>

              {hoveredUserId === user.id && user.id !== currentUser?.id && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); hideContact(user.id); }}
                  className="absolute right-4 p-1.5 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                  title="Remove contact"
                >
                  <UserX size={15} />
                </button>
              )}
            </div>
          );
        }

        const group = item.data;
        const isActive = selectedGroup?.id === group.id;
        const preview = item.lastMessage
          ? (() => {
              const shortName = item.lastMessage.senderName
                ? (item.lastMessage.senderName === currentUser?.name ? "You" : item.lastMessage.senderName.split(" ")[0])
                : null;
              return shortName ? `${shortName}: ${item.lastMessage.content}` : item.lastMessage.content;
            })()
          : group.description
          ?? group.members.slice(0, 3).map((m) => m.user.name.split(" ")[0]).join(", ");

        return (
          <div
            key={group.id}
            onClick={() => setSelectedGroup(group)}
            className={`flex items-center px-6 py-3 cursor-pointer transition-all border-b border-slate-50
            ${isActive ? "bg-primary/5" : "hover:bg-slate-50"}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isActive ? "bg-primary/20" : "bg-primary/10"
            }`}>
              <Users size={20} className="text-primary" />
            </div>

            <div className="flex-1 ml-4 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <div className="flex items-center gap-1 min-w-0">
                  <h3 className="text-[15px] font-bold text-slate-800 truncate">{group.name}</h3>
                  {item.isFavorite && (
                    <Star size={10} className="text-yellow-400 fill-yellow-400 shrink-0" />
                  )}
                </div>
                <span className="text-[10px] font-medium text-slate-400">
                  {item.lastMessage ? formatTime(item.lastMessage.createdAt) : `${group.members.length} members`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-[13px] text-slate-400 truncate pr-4">{preview}</p>
                <div className="flex items-center gap-1 shrink-0">
                  {item.unreadCount > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {item.unreadCount}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroupFavorite(group.id);
                    }}
                    className="p-1.5 rounded-xl text-slate-300 hover:text-yellow-400 hover:bg-yellow-50 transition-colors"
                    title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star
                      size={14}
                      className={item.isFavorite ? "text-yellow-400 fill-yellow-400" : ""}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsModalOpen(true, group);
                    }}
                    className="p-1.5 rounded-xl text-slate-300 hover:text-primary hover:bg-primary/5 transition-colors"
                    title="Group info"
                  >
                    <Info size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
