import React from "react";
import { Plus } from "lucide-react";
import { Button } from "../shared/Button";
import { useChatStore } from "../../store/chatStore";
import { useGroupStore } from "../../store/groupStore";
import { useAuthStore } from "../../store/authStore";

export const SidebarHeader: React.FC = () => {
  const { activeTab, setActiveTab, fetchUsers } = useChatStore();
  const { setIsModalOpen } = useGroupStore();
  const { user: currentUser } = useAuthStore();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (currentUser) {
      fetchUsers(currentUser.id, tab === 'All messages' ? undefined : tab);
    }
  };

  return (
    <div className="pt-6 px-6 pb-2 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Messages</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl text-primary hover:bg-primary/5 transition-colors"
          title="New Group"
        >
          <Plus size={20} />
        </Button>
      </div>

      <div className="flex gap-3.5 overflow-x-auto pb-4 no-scrollbar border-b border-slate-50 mb-4">
        {["All messages", "Unread", "Favorites", "Groups"].map((tab) => (
          <span
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`whitespace-nowrap text-sm font-medium cursor-pointer transition-all pb-1
              ${activeTab === tab ? "text-primary border-b-2 border-primary" : "text-slate-400 hover:text-slate-600"}`}
          >
            {tab}
          </span>
        ))}
      </div>
    </div>
  );
};
