import React, { useEffect, useState } from "react";
import { Search, MoreVertical, Phone, Video, ArrowLeft, Star, Users, Info } from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { useGroupStore } from "../../store/groupStore";
import { useAuthStore } from "../../store/authStore";
import { Avatar } from "../shared/Avatar";
import { Button } from "../shared/Button";

function formatLastSeen(lastSeen?: string): string {
  if (!lastSeen) return "Last seen recently";
  const date = new Date(lastSeen);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const seenDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (seenDay.getTime() === today.getTime()) return `Last seen today at ${timeStr}`;
  if (seenDay.getTime() === yesterday.getTime()) return `Last seen yesterday at ${timeStr}`;
  return `Last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })} at ${timeStr}`;
}

export const ChatHeader: React.FC = () => {
  const { selectedUser, setSelectedUser, selectedGroup, setSelectedGroup, toggleFavorite, setProfilePanelUser } = useChatStore();
  const { setIsModalOpen } = useGroupStore();
  const { user: currentUser } = useAuthStore();
  const [showLastSeen, setShowLastSeen] = useState(true);

  useEffect(() => {
    if (!selectedUser || selectedUser.isOnline) {
      setShowLastSeen(true);
      return;
    }
    setShowLastSeen(true);
    const interval = setInterval(() => setShowLastSeen((prev) => !prev), 10000);
    return () => clearInterval(interval);
  }, [selectedUser?.id, selectedUser?.isOnline]);

  if (selectedGroup) {
    return (
      <div className="h-[75px] bg-white border-b border-slate-50 px-4 md:px-8 flex items-center justify-between z-30">
        <div className="flex items-center gap-3 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedGroup(null)}
            className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Users size={20} className="text-primary" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-[16px] font-bold text-slate-800 leading-tight">
              {selectedGroup.name}
            </h2>
            <span className="text-[12px] text-slate-400 font-medium">
              {selectedGroup.members.length} members
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsModalOpen(true, selectedGroup)}
            title="Group info"
            className="text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl"
          >
            <Info size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Search"
            className="text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl"
          >
            <Search size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Menu"
            className="text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl"
          >
            <MoreVertical size={20} />
          </Button>
        </div>
      </div>
    );
  }

  if (!selectedUser) return null;

  const handleToggleFavorite = () => {
    if (currentUser && selectedUser) {
      toggleFavorite(currentUser.id, selectedUser.id);
    }
  };

  return (
    <div className="h-[75px] bg-white border-b border-slate-50 px-4 md:px-8 flex items-center justify-between z-30">
      <div
        className="flex items-center gap-3 md:gap-4 cursor-pointer group"
        onClick={() => setProfilePanelUser(selectedUser)}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); setSelectedUser(null); }}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full transition-all"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="relative">
          <Avatar
            src={selectedUser.avatar}
            alt={selectedUser.name}
            fallback={selectedUser.name?.substring(0, 2).toUpperCase()}
            className="w-11 h-11 ring-2 ring-white shadow-sm"
          />
          {selectedUser.isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          )}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-slate-800 leading-tight">
              {selectedUser.id === currentUser?.id
                ? `${selectedUser.name} (You)`
                : selectedUser.name}
            </h2>
            {selectedUser.id !== currentUser?.id && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); handleToggleFavorite(); }}
                className={`h-6 w-6 rounded-full transition-colors ${selectedUser.isFavorite ? "text-yellow-400 hover:text-yellow-500" : "text-slate-300 hover:text-slate-400"}`}
              >
                <Star size={14} fill={selectedUser.isFavorite ? "currentColor" : "none"} />
              </Button>
            )}
          </div>
          <span className="text-[12px] text-primary font-medium">
            {selectedUser.isTyping
              ? "Typing..."
              : selectedUser.isOnline
                ? "Online"
                : showLastSeen
                  ? formatLastSeen(selectedUser.lastSeen)
                  : "Offline"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <Button variant="ghost" size="icon" title="Search" className="text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl">
          <Search size={20} />
        </Button>
        <Button variant="ghost" size="icon" title="Phone" className="text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl">
          <Phone size={19} />
        </Button>
        <Button variant="ghost" size="icon" title="Video" className="text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl">
          <Video size={20} />
        </Button>
        <Button variant="ghost" size="icon" title="Menu" className="text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl">
          <MoreVertical size={20} />
        </Button>
      </div>
    </div>
  );
};
