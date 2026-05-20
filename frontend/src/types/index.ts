export interface User {
  isFavorite: any;
  id: string;
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  avatarUrl?: string;
  status?: "online" | "offline" | "away";
  isOnline?: boolean;
  lastSeen?: string;
  unreadCount?: number;
  isTyping?: boolean;
  lastMessage?: {
    content: string;
    createdAt: string;
  } | null;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  content: string;
  createdAt?: string;
  timestamp?: string;
  type: "text" | "image" | "file" | "system";
  status?: "sent" | "delivered" | "read";
  sender?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface GroupMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt?: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  createdBy: string;
  createdAt: string;
  isFavorite?: boolean;
  members: GroupMember[];
  messages?: Array<{ content: string; createdAt: string; sender?: { id: string; name: string } }>;
}

export interface UserSettings {
  userId: string;
  lastSeenVisibility: "everyone" | "contacts" | "nobody";
  onlineVisibility: "everyone" | "nobody";
  readReceiptsEnabled: boolean;
  typingIndicatorsEnabled: boolean;
  theme?: "light" | "dark" | "system";
  updatedAt?: string;
}
