import React, { useEffect } from "react";
import { TopHeader } from "../components/chat/TopHeader";
import { ContactList } from "../components/chat/ContactList";
import { ChatHeader } from "../components/chat/ChatHeader";
import { MessageList } from "../components/chat/MessageList";
import { MessageInput } from "../components/chat/MessageInput";
import { WelcomeScreen } from "../components/chat/WelcomeScreen";
import { SidebarHeader } from "../components/chat/SidebarHeader";
import { UserProfilePanel } from "../components/chat/UserProfilePanel";
import { SettingsModal } from "../components/settings/SettingsModal";
import { GroupModal } from "../components/groups/GroupModal";
import { ProfileModal } from "../components/profile/ProfileModal";
import { useChatStore } from "../store/chatStore";
import { useGroupStore } from "../store/groupStore";
import { useAuthStore } from "../store/authStore";
import { useSocket } from "../hooks/useSocket";

export const ChatPage: React.FC = () => {

  const {
    selectedUser,
    selectedGroup,
    fetchUsers,
    fetchMessages,
    fetchGroupMessages,
    isSettingsOpen,
    setIsSettingsOpen,
    isProfileOpen,
    setIsProfileOpen,
    profilePanelUser,
  } = useChatStore();
  const { fetchGroups } = useGroupStore();
  const { user: currentUser } = useAuthStore();

  useSocket();

  useEffect(() => {
    if (currentUser) {
      fetchUsers(currentUser.id);
      fetchGroups(currentUser.id);
    }
  }, [fetchUsers, fetchGroups, currentUser]);

  // Re-fetch when the user returns to this tab after the browser suspended it.
  useEffect(() => {
    if (!currentUser) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUsers(currentUser.id);
        fetchGroups(currentUser.id);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUser, fetchUsers, fetchGroups]);

  useEffect(() => {
    if (currentUser && selectedUser) {
      fetchMessages(currentUser.id, selectedUser.id);
    }
  }, [currentUser, selectedUser, fetchMessages]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMessages(selectedGroup.id);
    }
  }, [selectedGroup, fetchGroupMessages]);

  const hasActiveChat = !!(selectedUser || selectedGroup);

  return (
    <div className="h-dvh w-full bg-white md:bg-[#F4F4F4] flex flex-col overflow-hidden">
      <div className={`${hasActiveChat ? "hidden md:block" : "block"}`}>
        <TopHeader />
      </div>

      <div className="flex-1 flex md:gap-6 p-0 md:p-4 overflow-hidden relative">
        {/* Sidebar */}
        <div
          className={`w-full md:w-85 shrink-0 flex flex-col bg-white md:rounded-3xl overflow-hidden md:jig-shadow transition-transform duration-300 ${hasActiveChat ? "hidden md:flex" : "flex"}`}
        >
          <SidebarHeader />
          <ContactList />
        </div>

        {/* Chat Area */}
        <div
          className={`flex-1 flex flex-col bg-white md:rounded-3xl overflow-hidden md:jig-shadow relative ${hasActiveChat ? "flex" : "hidden md:flex"}`}
        >
          {hasActiveChat ? (
            <>
              <ChatHeader />
              <div className="flex-1 overflow-hidden flex">
                <div className="flex-1 flex flex-col overflow-hidden">
                  <MessageList />
                  <MessageInput />
                </div>
                {profilePanelUser && <UserProfilePanel />}
              </div>
            </>
          ) : (
            <WelcomeScreen />
          )}
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
      <GroupModal />
    </div>
  );
};
