import { Types } from "mongoose";

export interface IUser {
  _id: string | Types.ObjectId;
  fullName: string;
  email: string;
  password?: string;
  profilePic?: string;
  pushSubscription?: any;
  chatSettings?: Map<string, any>;
  status?: 'online' | 'offline' | 'away' | 'busy';
  dnd?: boolean;
  statusMessage?: string;
  lastSeen?: Date;
  blockedUsers?: (string | Types.ObjectId)[];
  pinnedChats?: (string | Types.ObjectId)[];
  archivedChats?: (string | Types.ObjectId)[];
  mutedChats?: (string | Types.ObjectId)[];
  lockedChats?: (string | Types.ObjectId)[];
  lockPins?: Map<string, string>;
  theme?: string;
  notificationPreferences?: {
    directMessages: boolean;
    mentions: boolean;
    workspaceActivity: boolean;
  };
  // New fields for profile handling
  username: string;
  handle: string;
  publicProfile?: {
    bio?: string;
    avatar?: string;
  };
  privateProfile?: {
    isPrivate?: boolean;
    avatar?: string;
  };
  allowedViewers?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  _id: string | Types.ObjectId;
  senderId: string | Types.ObjectId | IUser;
  receiverId: string | Types.ObjectId | IUser;
  text?: string | null;
  image?: string | null;
  file?: {
    url: string;
    name: string;
    type: string;
    size: number;
  } | null;
  isRead: boolean;
  deliveredAt?: Date;
  readAt?: Date;
  replyTo?: string | Types.ObjectId | IMessage | null;
  forwardedFrom?: string | Types.ObjectId | IMessage | null;
  isEdited: boolean;
  editedAt?: Date;
  editHistory?: { text: string; editedAt: Date }[];
  isDeleted: boolean;
  deletedAt?: Date;
  isPinned: boolean;
  pinnedAt?: Date;
  pinnedBy?: string | Types.ObjectId;
  threadId?: string | Types.ObjectId | null;
  threadReplyCount?: number;
  isExpired?: boolean;
  expiresAt?: Date;
  viewOnce: boolean;
  viewedOnce: boolean;
  viewedAt?: Date;
  reactions?: Map<string, (string | Types.ObjectId)[]> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspace {
  _id: string | Types.ObjectId;
  name: string;
  handle?: string;
  icon?: string;
  description?: string;
  owner: string | Types.ObjectId;
  admins: (string | Types.ObjectId)[];
  members: (string | Types.ObjectId | IUser)[];
  channels: IChannel[];
  maxMembers: number;
  pendingApproval: boolean;
  joinRequests: (string | Types.ObjectId)[];
  permissions: {
    canEditInfo: 'admins' | 'everyone';
    canSendMessages: 'admins' | 'everyone';
    canAddMembers: 'admins' | 'everyone';
  };
  disappearingMessages: {
    enabled: boolean;
    duration: number;
  };
  communityId?: string | Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChannel {
  _id: string | Types.ObjectId;
  name: string;
  type: 'chat' | 'polls' | 'resources';
  topic?: string;
  isPrivate?: boolean;
}

export interface IFriendship {
  _id: string | Types.ObjectId;
  requesterId: string | Types.ObjectId | IUser;
  receiverId: string | Types.ObjectId | IUser;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  _id: string | Types.ObjectId;
  recipient: string | Types.ObjectId | IUser;
  actor: string | Types.ObjectId | IUser;
  type: 'direct_message' | 'group_message' | 'mention' | 'reply' | 'friend_request' | 'friend_accept' | 'follow' | 'reaction' | 'welcome' | 'announcement' | 'security';
  title: string;
  body: string;
  metadata?: {
    messageId?: string | Types.ObjectId;
    conversationId?: string | Types.ObjectId;
    groupId?: string | Types.ObjectId;
    reactionType?: string;
    link?: string;
  };
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroup {
  _id: string | Types.ObjectId;
  name: string;
  members: (string | Types.ObjectId | IUser)[];
  admin: string | Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspaceMessage {
  _id: string | Types.ObjectId;
  senderId: string | Types.ObjectId | IUser;
  workspaceId: string | Types.ObjectId | IWorkspace;
  channelId: string | Types.ObjectId;
  text?: string;
  image?: string;
  file?: {
    url: string;
    name: string;
    type: string;
    size: number;
  };
  reactions?: Map<string, (string | Types.ObjectId)[]>;
  isEdited: boolean;
  editedAt?: Date;
  replyTo?: string | Types.ObjectId | IWorkspaceMessage;
  threadId?: string | Types.ObjectId | null;
  threadReplyCount?: number;
  // Pinning fields
  isPinned?: boolean;
  pinnedAt?: Date;
  pinnedBy?: string | Types.ObjectId;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspacePoll {
  _id: string | Types.ObjectId;
  workspaceId: string | Types.ObjectId | IWorkspace;
  channelId: string | Types.ObjectId;
  question: string;
  options: {
    text: string;
    votes: (string | Types.ObjectId)[];
    _id?: string | Types.ObjectId;
  }[];
  creatorId: string | Types.ObjectId | IUser;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspaceResource {
  _id: string | Types.ObjectId;
  workspaceId: string | Types.ObjectId | IWorkspace;
  channelId: string | Types.ObjectId;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string | Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}
