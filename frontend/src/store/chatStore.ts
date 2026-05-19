import { create } from 'zustand';
import type { Group, Message, User } from '../types';
import apiClient from '../api/client';

interface ChatState {
  users: User[];
  messages: Message[];
  selectedUser: User | null;
  selectedGroup: Group | null;
  groupMessages: Message[];
  groupUnreadCounts: Record<string, number>;
  groupLastMessages: Record<string, { content: string; createdAt: string; senderName?: string }>;
  isLoading: boolean;
  activeTab: string;

  setUsers: (users: User[]) => void;
  setSelectedUser: (user: User | null) => void;
  setSelectedGroup: (group: Group | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  addGroupMessage: (message: Message) => void;
  fetchGroupMessages: (groupId: string) => Promise<void>;
  updateUserStatus: (userId: string, isOnline: boolean, lastSeen?: string) => void;
  updateUserTypingStatus: (userId: string, isTyping: boolean) => void;
  incrementUnreadCount: (userId: string) => void;
  clearUnreadCount: (userId: string) => void;
  markAsRead: (senderId: string, currentUserId: string) => Promise<void>;
  bumpUserToTop: (userId: string, lastMessage: { content: string; createdAt: string }) => void;
  incrementGroupUnreadCount: (groupId: string) => void;
  bumpGroupLastMessage: (groupId: string, lastMessage: { content: string; createdAt: string; senderName?: string }) => void;
  initGroupLastMessages: (groups: Group[]) => void;
  setActiveTab: (tab: string) => void;
  toggleFavorite: (userId: string, favoriteId: string) => Promise<void>;

  fetchUsers: (currentUserId?: string, filter?: string) => Promise<void>;
  fetchMessages: (currentUserId: string, otherUserId: string) => Promise<void>;

  deleteMessage: (messageId: string) => Promise<void>;
  removeMessage: (messageId: string) => void;
  hideContact: (userId: string) => Promise<void>;

  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;

  isProfileOpen: boolean;
  setIsProfileOpen: (isOpen: boolean) => void;

  profilePanelUser: User | null;
  setProfilePanelUser: (user: User | null) => void;

  highlightedMessageId: string | null;
  setHighlightedMessageId: (id: string | null) => void;

  ensureUserInList: (user: Pick<User, 'id' | 'name' | 'avatarUrl'>) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  users: [],
  messages: [],
  selectedUser: null,
  selectedGroup: null,
  groupMessages: [],
  groupUnreadCounts: {},
  groupLastMessages: {},
  isLoading: false,
  isSettingsOpen: false,
  isProfileOpen: false,
  activeTab: 'All messages',

  setUsers: (users) => set({ users }),
  setSelectedUser: (user) => set({ selectedUser: user, selectedGroup: null, profilePanelUser: null }),
  setSelectedGroup: (group) => set((state) => ({
    selectedGroup: group,
    selectedUser: null,
    profilePanelUser: null,
    groupUnreadCounts: group
      ? { ...state.groupUnreadCounts, [group.id]: 0 }
      : state.groupUnreadCounts,
  })),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  addGroupMessage: (message) => set((state) => ({
    groupMessages: [...state.groupMessages, message],
  })),
  fetchGroupMessages: async (groupId) => {
    try {
      const res = await apiClient.get(`/messages/group/${groupId}`);
      set({ groupMessages: res.data });
    } catch (error) {
      console.error('Fetch group messages error:', error);
    }
  },
  updateUserStatus: (userId, isOnline, lastSeen) => set((state) => ({
    users: state.users.map((u) => u.id === userId ? { ...u, isOnline, lastSeen: lastSeen || u.lastSeen } : u),
    selectedUser: state.selectedUser?.id === userId
      ? { ...state.selectedUser, isOnline, lastSeen: lastSeen || state.selectedUser.lastSeen }
      : state.selectedUser,
  })),
  updateUserTypingStatus: (userId, isTyping) => set((state) => ({
    users: state.users.map((u) => u.id === userId ? { ...u, isTyping } : u),
    selectedUser: state.selectedUser?.id === userId ? { ...state.selectedUser, isTyping } : state.selectedUser
  })),
  incrementUnreadCount: (userId) => set((state) => ({
    users: state.users.map((u) => u.id === userId ? { ...u, unreadCount: (u.unreadCount || 0) + 1 } : u)
  })),
  clearUnreadCount: (userId) => set((state) => ({
    users: state.users.map((u) => u.id === userId ? { ...u, unreadCount: 0 } : u)
  })),
  markAsRead: async (senderId, currentUserId) => {
    // Optimistically clear badge immediately
    set((state) => ({
      users: state.users.map((u) => u.id === senderId ? { ...u, unreadCount: 0 } : u),
    }));
    try {
      await apiClient.post('/messages/mark-read', { senderId, receiverId: currentUserId });
      // Remove from list when on Unread tab since they no longer have unread messages
      if (get().activeTab === 'Unread') {
        set((state) => ({
          users: state.users.filter((u) => u.id !== senderId),
        }));
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  },
  bumpUserToTop: (userId, lastMessage) => set((state) => {
    const idx = state.users.findIndex((u) => u.id === userId);
    if (idx === -1) return state;
    const updated = { ...state.users[idx], lastMessage };
    const rest = state.users.filter((u) => u.id !== userId);
    return { users: [updated, ...rest] };
  }),
  incrementGroupUnreadCount: (groupId) => set((state) => ({
    groupUnreadCounts: {
      ...state.groupUnreadCounts,
      [groupId]: (state.groupUnreadCounts[groupId] || 0) + 1,
    },
  })),
  bumpGroupLastMessage: (groupId, lastMessage) => set((state) => ({
    groupLastMessages: { ...state.groupLastMessages, [groupId]: lastMessage },
  })),
  initGroupLastMessages: (groups) => set((state) => {
    const fromApi: Record<string, { content: string; createdAt: string; senderName?: string }> = {};
    groups.forEach((g) => {
      if (g.messages?.[0]) {
        fromApi[g.id] = {
          content: g.messages[0].content,
          createdAt: g.messages[0].createdAt,
          senderName: g.messages[0].sender?.name,
        };
      }
    });
    // Real-time updates take precedence over API data
    return { groupLastMessages: { ...fromApi, ...state.groupLastMessages } };
  }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleFavorite: async (userId: string, favoriteId: string) => {
    try {
      const response = await apiClient.post('/users/favorite', { userId, favoriteId });
      const { isFavorite } = response.data;
      
      set((state) => ({
        users: state.users.map((u) => u.id === favoriteId ? { ...u, isFavorite } : u),
        selectedUser: state.selectedUser?.id === favoriteId ? { ...state.selectedUser, isFavorite } : state.selectedUser
      }));
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  },

  fetchUsers: async (currentUserId?: string, filter?: string) => {
    set({ isLoading: true });
    try {
      const activeFilter = filter || get().activeTab;
      const response = await apiClient.get('/users', {
        params: {
          currentUserId,
          filter: activeFilter === 'All messages' ? undefined : activeFilter,
        },
      });
      const sorted = [...response.data].sort((a: User, b: User) => {
        const tA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const tB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return tB - tA;
      });
      // Preserve any users added via ensureUserInList that the server doesn't know about yet
      // (e.g. a searched contact with no messages yet)
      const serverIds = new Set(sorted.map((u: User) => u.id));
      const localOnly = get().users.filter((u) => !serverIds.has(u.id));
      set({ users: [...sorted, ...localOnly], isLoading: false });
    } catch (error) {
      console.error('Fetch users error:', error);
      set({ isLoading: false });
    }
  },

  fetchMessages: async (currentUserId, otherUserId) => {
    try {
      const response = await apiClient.get(`/messages/${currentUserId}/${otherUserId}`);
      set({ messages: response.data });
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  },

  setIsSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  setIsProfileOpen: (isOpen) => set({ isProfileOpen: isOpen }),

  profilePanelUser: null,
  setProfilePanelUser: (user) => set({ profilePanelUser: user }),

  highlightedMessageId: null,
  setHighlightedMessageId: (id) => set({ highlightedMessageId: id }),

  ensureUserInList: (u) => set((state) => {
    if (state.users.some((existing) => existing.id === u.id)) return state;
    const newUser: User = {
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      avatar: u.avatarUrl,
      isFavorite: false,
      isOnline: false,
      unreadCount: 0,
    };
    return { users: [...state.users, newUser] };
  }),

  removeMessage: (messageId) => set((state) => ({
    messages: state.messages.filter((m) => m.id !== messageId),
    groupMessages: state.groupMessages.filter((m) => m.id !== messageId),
  })),

  deleteMessage: async (messageId) => {
    // Optimistic removal
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
      groupMessages: state.groupMessages.filter((m) => m.id !== messageId),
    }));
    try {
      await apiClient.delete(`/messages/${messageId}`);
    } catch (error) {
      console.error('Delete message error:', error);
    }
  },

  hideContact: async (userId) => {
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
      selectedUser: state.selectedUser?.id === userId ? null : state.selectedUser,
    }));
    try {
      await apiClient.post('/users/hide', { hiddenId: userId });
    } catch (error) {
      console.error('Hide contact error:', error);
    }
  },
}));
