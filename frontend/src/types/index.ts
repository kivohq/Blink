export interface IUser {
  _id: string;
  fullName: string;
  email: string;
  profilePic?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  statusMessage?: string;
  lastSeen?: string;
  blockedUsers?: string[];
  pinnedChats?: string[];
  archivedChats?: string[];
  mutedChats?: string[];
  lockedChats?: string[];
  theme?: 'light' | 'dark';
  notificationPreferences?: {
    directMessages: boolean;
    mentions: boolean;
    workspaceActivity: boolean;
  };
  createdAt: string;
  updatedAt: string;
  // New fields for profile management
  username?: string;
  handle?: string;
  publicProfile?: {
    bio?: string;
    avatar?: string;
  };
  privateProfile?: {
    bio?: string;
    avatar?: string;
  };
  allowedViewers?: string[];
}

export interface IMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string;
  file?: {
    url: string;
    name: string;
    type: string;
    size: number;
  };
  isRead: boolean;
  readAt?: string;
  replyTo?: string | IMessage;
  forwardedFrom?: string | IMessage;
  isEdited: boolean;
  editedAt?: string;
  editHistory?: { text: string; editedAt: string }[];
  isDeleted: boolean;
  deletedAt?: string;
  isPinned: boolean;
  pinnedAt?: string;
  reactions?: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
}

export interface IWorkspace {
  _id: string;
  name: string;
  icon?: string;
  description?: string;
  owner: string;
  admins: string[];
  members: (string | IUser)[];
  channels: IChannel[];
  maxMembers: number;
  pendingApproval: boolean;
  joinRequests: string[];
  permissions: {
    canEditInfo: 'admins' | 'everyone';
    canSendMessages: 'admins' | 'everyone';
    canAddMembers: 'admins' | 'everyone';
  };
  disappearingMessages: {
    enabled: boolean;
    duration: number;
  };
  communityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IChannel {
  _id: string;
  name: string;
  type: 'chat' | 'polls' | 'resources';
  topic?: string;
  isPrivate?: boolean;
}
