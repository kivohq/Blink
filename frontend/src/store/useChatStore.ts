import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";
import { useErrorStore } from "./useErrorStore.js";
import { IMessage, IUser, IWorkspace } from "../types/index.js";
import { encryptMessage } from "../lib/crypto.js";

interface ChatState {
  messages: IMessage[];
  users: IUser[];
  searchResults: IUser[];
  selectedUser: IUser | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  isLoadingMoreMessages: boolean;
  typingUsers: string[];
  searchQuery: string;
  pinnedMessages: IMessage[];
  searchMessageResults: IMessage[];
  userStatus: Record<string, { status: string; statusMessage: string }>;
  editingMessageId: string | null;
  replyingToMessage: IMessage | null;
  selectedMessagesForBulk: string[];
  chatSettings: Record<string, any>;
  lockedChats: string[];
  drafts: Record<string, string>;
  isMoreMessagesAvailable: boolean;
  isCommandPaletteOpen: boolean;
  lightboxImage: string | null;
  setLightboxImage: (img: string | null) => void;

  workspaces: IWorkspace[];
  selectedWorkspace: IWorkspace | null;
  selectedChannelId: string | null;
  workspaceMessages: Record<string, IMessage[]>;
  workspacePolls: Record<string, any[]>;
  workspaceResources: Record<string, any[]>;
  channelTypingUsers: string[];
  groupKeys: Record<string, CryptoKey>;

  setGroupKey: (groupId: string, key: CryptoKey) => void;
  getUsers: () => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  getMessages: (userId: string, isLoadMore?: boolean) => Promise<void>;
  sendMessage: (messageData: any) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  togglePinMessage: (messageId: string) => Promise<void>;
  setChatExpiry: (userId: string, expiryLabel: string, expiresAt: Date | null) => Promise<void>;
  getLockedChats: () => Promise<void>;
  lockChat: (userId: string, pin: string) => Promise<void>;
  unlockChat: (userId: string, pin: string) => Promise<boolean>;
  markViewOnceOpened: (messageId: string) => Promise<void>;
  getPinnedMessages: (userId: string) => Promise<void>;
  searchMessages: (userId: string, query: string, sender?: string) => Promise<void>;
  forwardMessage: (messageId: string, receiverId: string) => Promise<any>;
  toggleArchiveChat: (userId: string) => Promise<void>;
  togglePinChat: (userId: string) => Promise<void>;
  toggleMuteChat: (userId: string) => Promise<void>;
  clearChatHistory: (userId: string) => Promise<void>;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  setSelectedUser: (user: IUser | null) => void;
  clearSearch: () => void;
  setEditingMessage: (messageId: string | null) => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  toggleCommandPalette: () => void;
  setPendingAttachment: (attachment: File | null) => void;
  markAsUnread: (userId: string) => void;
  setReplyingToMessage: (message: IMessage | null) => void;
  exportChat: (userId: string, format?: string, includeDeleted?: boolean) => Promise<any>;
  initWorkspaces: () => Promise<void>;
  setSelectedWorkspace: (workspace: IWorkspace | null) => Promise<void>;
  setSelectedChannelId: (channelId: string | null) => Promise<void>;
  fetchChannelData: (workspaceId: string, channelId: string) => Promise<void>;
  createWorkspace: (name: string, icon?: string) => Promise<void>;
  createChannel: (workspaceId: string, name: string, type?: string) => Promise<void>;
  sendChannelMessage: (workspaceId: string, channelId: string, text: string, file?: File | null) => Promise<void>;
  addChannelReaction: (channelId: string, messageId: string, emoji: string) => Promise<void>;
  createPoll: (workspaceId: string, channelId: string, question: string, optionLabels: string[]) => Promise<void>;
  voteInPoll: (workspaceId: string, channelId: string, pollId: string, optionId: string) => Promise<void>;
  uploadResource: (workspaceId: string, channelId: string, file: File) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  promoteToAdmin: (workspaceId: string, userId: string) => Promise<void>;
  demoteFromAdmin: (workspaceId: string, userId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  users: [],
  searchResults: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isLoadingMoreMessages: false,
  typingUsers: [],
  searchQuery: "",
  pinnedMessages: [],
  searchMessageResults: [],
  userStatus: {},
  editingMessageId: null,
  replyingToMessage: null,
  selectedMessagesForBulk: [],
  chatSettings: (() => {
    try {
      const raw = localStorage.getItem('chatSettings');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  })(),
  lockedChats: [],
  drafts: (() => {
    try {
      const raw = localStorage.getItem('chat-drafts');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  })(),
  isMoreMessagesAvailable: true,
  isCommandPaletteOpen: false,
  pendingAttachment: null,
  lightboxImage: null,
  

  workspaces: [],
  selectedWorkspace: null,
  selectedChannelId: null,
  workspaceMessages: {},
  workspacePolls: {},
  workspaceResources: {},
  channelTypingUsers: [],

  setDraft: (userId, text) => {
    const newDrafts = {
      ...get().drafts,
      [userId]: text,
    };
    localStorage.setItem('chat-drafts', JSON.stringify(newDrafts));
    set({
      drafts: newDrafts,
    });
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      const usersList = res.data;
      set({ users: usersList });

      // Auto-restore selected user from localStorage
      const savedUserId = localStorage.getItem("lastSelectedUserId");
      if (savedUserId) {
        const found = usersList.find((u: any) => u._id === savedUserId);
        if (found) {
          get().setSelectedUser(found);
        }
      }
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  searchUsers: async (query) => {
    set({ searchQuery: query });
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    try {
      const res = await axiosInstance.get(`/messages/search?query=${encodeURIComponent(query)}`);
      set({ searchResults: res.data });
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "search users");
    }
  },

  getMessages: async (userId, isLoadMore = false) => {
    if (!isLoadMore) {
      set({ isMessagesLoading: true, isMoreMessagesAvailable: true });
    } else {
      set({ isLoadingMoreMessages: true });
    }
    
    try {
      const { selectedUser } = get();
      if (!selectedUser || selectedUser._id !== userId) return;

      const { messages } = get();
      const before = isLoadMore && messages.length > 0 ? messages[0].createdAt : null;
      const limit = 30;

      const res = await axiosInstance.get(`/messages/${userId}`, {
        params: { limit, before }
      });

      if (get().selectedUser?._id !== userId) return;

      const newMessages = res.data;
      
      if (isLoadMore) {
        set({
          messages: [...newMessages, ...get().messages],
          isMoreMessagesAvailable: newMessages.length === limit,
        });
      } else {
        set({ 
          messages: newMessages,
          isMoreMessagesAvailable: newMessages.length === limit,
          users: get().users.map(u => u._id === userId ? { ...u, unreadCount: 0 } : (u as any))
        });
      }

      if (!isLoadMore) {
        try {
          await axiosInstance.patch(`/messages/${userId}/read`);
        } catch (error) {
          console.error("Failed to mark messages as read:", error);
        }
      }
    } catch (error: any) {
      if (get().selectedUser?._id === userId) {
        useErrorStore.getState().handleApiError(error, "load messages");
      }
    } finally {
      if (get().selectedUser?._id === userId) {
        if (isLoadMore) {
          set({ isLoadingMoreMessages: false });
        } else {
          set({ isMessagesLoading: false });
        }
      }
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return;
    const authUser = useAuthStore.getState().authUser;
    if (!authUser) return;

    const tempId = "temp-" + Date.now();
    let text = "";
    let filePreviewUrl = "";
    let fileName = "";
    let fileType = "";
    let fileSize = 0;
    let imagePreviewUrl = "";
    let replyTo = null;

    const isFormData = messageData && typeof messageData.append === "function";
    if (isFormData) {
      text = messageData.get("text") as string || "";
      const fileVal = messageData.get("file");
      if (fileVal && typeof fileVal !== "string") {
        fileName = (fileVal as File).name;
        fileType = (fileVal as File).type;
        fileSize = (fileVal as File).size;
        filePreviewUrl = URL.createObjectURL(fileVal as File);
      }
      const imageVal = messageData.get("image");
      if (imageVal) {
        if (typeof imageVal === "string") {
          imagePreviewUrl = imageVal;
        } else {
          imagePreviewUrl = URL.createObjectURL(imageVal as File);
        }
      }
      replyTo = messageData.get("replyTo") as string || null;
    } else {
      text = messageData.text || "";
      if (messageData.file) {
        fileName = messageData.file.name;
        fileType = messageData.file.type;
        fileSize = messageData.file.size;
        filePreviewUrl = URL.createObjectURL(messageData.file);
      }
      if (messageData.image) {
        if (typeof messageData.image === "string") {
          imagePreviewUrl = messageData.image;
        } else {
          imagePreviewUrl = URL.createObjectURL(messageData.image);
        }
      }
      replyTo = messageData.replyTo || null;
    }

    const tempMessage: IMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text,
      image: imagePreviewUrl || undefined,
      file: filePreviewUrl ? {
        url: filePreviewUrl,
        name: fileName,
        type: fileType,
        size: fileSize
      } : undefined,
      isRead: false,
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      reactions: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSending: true,
      replyTo: replyTo || undefined
    };

    set({
      messages: [...messages, tempMessage],
      replyingToMessage: null
    });

    try {
      let postData;
      if (isFormData) {
        postData = messageData;
      } else {
        const formData = new FormData();
        if (messageData.text) formData.append("text", messageData.text);
        if (messageData.image) formData.append("image", messageData.image);
        if (messageData.file) formData.append("file", messageData.file);
        if (messageData.replyTo) formData.append("replyTo", messageData.replyTo);
        if (messageData.viewOnce) formData.append("viewOnce", messageData.viewOnce);
        if (messageData.expiresAt) formData.append("expiresAt", messageData.expiresAt.toISOString());
        postData = formData;
      }

      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, postData);
      
      const updatedMessages = get().messages.map(msg => 
        msg._id === tempId ? res.data : msg
      );
      set({ 
        messages: updatedMessages, 
        users: get().users.map(u => u._id === selectedUser._id ? { ...u, lastMessage: res.data } : (u as any))
      });
    } catch (error: any) {
      set({
        messages: get().messages.filter(msg => msg._id !== tempId)
      });
      useErrorStore.getState().handleApiError(error, "send message");
    }
  },

  addReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/messages/reaction/${messageId}/add`, { emoji });
      set({
        messages: get().messages.map(msg =>
          msg._id === messageId ? { ...msg, reactions: res.data?.reactions || {} } : msg
        ),
      });
    } catch (error: any) {
      console.error("Error adding reaction:", error);
      useErrorStore.getState().handleApiError(error, "add reaction");
    }
  },

  removeReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/messages/reaction/${messageId}/remove`, { emoji });
      set({
        messages: get().messages.map(msg =>
          msg._id === messageId ? { ...msg, reactions: res.data?.reactions || {} } : msg
        ),
      });
    } catch (error: any) {
      console.error("Error removing reaction:", error);
      useErrorStore.getState().handleApiError(error, "remove reaction");
    }
  },

  editMessage: async (messageId, newText) => {
    try {
      const res = await axiosInstance.patch(`/messages/edit/${messageId}`, { text: newText });
      set({
        messages: get().messages.map(msg =>
          msg._id === messageId ? res.data : msg
        ),
        editingMessageId: null,
      });
      toast.success("Message edited");
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "edit message");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      const res = await axiosInstance.delete(`/messages/${messageId}`);
      const text = res.data.text || "This message was deleted by You";
      set({
        messages: get().messages.map(msg => {
          let updatedMsg = { ...msg };
          if (msg._id === messageId) {
            updatedMsg = {
              ...updatedMsg,
              isDeleted: true,
              text,
              image: undefined,
              file: undefined,
              replyTo: undefined,
              reactions: undefined,
              isPinned: false,
            };
          }
          return updatedMsg;
        }),
      });
      toast.success("Message deleted");
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "delete message");
    }
  },

  togglePinMessage: async (messageId) => {
    try {
      const res = await axiosInstance.patch(`/messages/pin/message/${messageId}`);
      set({
        messages: get().messages.map(msg =>
          msg._id === messageId ? { ...msg, ...res.data } : msg
        ),
      });
    } catch (error: any) {
      console.error("Error toggling pin:", error);
      useErrorStore.getState().handleApiError(error, "pin message");
    }
  },

  setChatExpiry: async (userId, expiryLabel, expiresAt) => {
    try {
      const res = await axiosInstance.patch(`/messages/settings/disappearing/${userId}`, {
        expiryLabel,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
      });
      set({
        chatSettings: {
          ...get().chatSettings,
          [userId]: res.data,
        },
      });
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "update chat expiry");
    }
  },

  getLockedChats: async () => {
    try {
      const res = await axiosInstance.get(`/messages/locked`);
      set({ lockedChats: res.data });
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "load locked chats");
    }
  },

  lockChat: async (userId, pin) => {
    try {
      await axiosInstance.patch(`/messages/lock/${userId}`, { pin });
      await get().getLockedChats();
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "lock chat");
    }
  },

  unlockChat: async (userId, pin) => {
    try {
      await axiosInstance.post(`/messages/unlock/${userId}`, { pin });
      return true;
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "unlock chat");
      return false;
    }
  },

  markViewOnceOpened: async (messageId) => {
    try {
      const res = await axiosInstance.patch(`/messages/view-once/${messageId}/open`);
      set({
        messages: get().messages.map(msg =>
          msg._id === messageId ? res.data : msg
        ),
      });
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "open media");
    }
  },

  getPinnedMessages: async (userId) => {
    try {
      const res = await axiosInstance.get(`/messages/pinned/${userId}`);
      set({ pinnedMessages: res.data });
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "load pinned messages");
    }
  },

  searchMessages: async (userId, query, sender, filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (query) params.append("query", query);
      if (sender) params.append("sender", sender);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.fileType) params.append("fileType", filters.fileType);

      const res = await axiosInstance.get(`/messages/search/${userId}?${params}`);
      set({ searchMessageResults: res.data });
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "search messages");
    }
  },

  forwardMessage: async (messageId, receiverId) => {
    try {
      const res = await axiosInstance.post(`/messages/forward/${messageId}`, { receiverId });
      toast.success("Message forwarded");
      return res.data;
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "forward message");
    }
  },

  toggleArchiveChat: async (userId) => {
    try {
      await axiosInstance.patch(`/messages/archive/${userId}`);
      toast.success("Chat archived");
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "archive chat");
    }
  },

  togglePinChat: async (userId) => {
    try {
      await axiosInstance.patch(`/messages/pin/${userId}`);
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "pin chat");
    }
  },

  toggleMuteChat: async (userId) => {
    try {
      await axiosInstance.patch(`/messages/mute/${userId}`);
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "mute chat");
    }
  },

  clearChatHistory: async (userId) => {
    try {
      await axiosInstance.delete(`/messages/clear/${userId}`);
      set({ messages: [] });
      toast.success("Chat history cleared");
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "clear chat");
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    get().unsubscribeFromMessages();

    socket.on("newMessage", async (newMessage: IMessage) => {
      const { selectedUser, messages, users } = get();
      const isForActiveChat = selectedUser && 
        (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id);

      if (isForActiveChat) {
        const isDuplicate = messages.some(msg => msg._id === newMessage._id);
        if (isDuplicate) return;

        const tempMsgIndex = messages.findIndex(msg => 
          msg.isSending && 
          msg.senderId === newMessage.senderId &&
          (newMessage.text ? msg.text === newMessage.text : true)
        );

        if (tempMsgIndex > -1) {
          const updated = [...messages];
          updated[tempMsgIndex] = newMessage;
          set({ messages: updated });
        } else {
          set({
            messages: [...messages, newMessage],
          });
        }

        try {
          await axiosInstance.patch(`/messages/${selectedUser._id}/read`);
          socket.emit("messageRead", { senderId: selectedUser._id, receiverId: useAuthStore.getState().authUser?._id });
        } catch (error) {
          console.error("Failed to mark message as read:", error);
        }
      } else {
        const sender = users.find(u => u._id === newMessage.senderId);
        const senderName = sender ? sender.fullName : "Someone";
        toast(`New message from ${senderName}`, { icon: "💬" });
      }

      set({
        users: users.map(user => {
          if (user._id === newMessage.senderId) {
            const isCurrentChat = selectedUser && selectedUser._id === user._id;
            return {
              ...user,
              lastMessage: newMessage,
              unreadCount: isCurrentChat ? 0 : ((user as any).unreadCount || 0) + 1
            } as IUser;
          }
          return user;
        })
      });
    });

    socket.on("userTyping", (userId: string) => {
      const { selectedUser } = get();
      if (selectedUser && userId === selectedUser._id) {
        const typingUsers = get().typingUsers;
        if (!typingUsers.includes(userId)) {
          set({ typingUsers: [...typingUsers, userId] });
        }
      }
    });

    socket.on("userStopTyping", (userId: string) => {
      const { selectedUser } = get();
      if (selectedUser && userId === selectedUser._id) {
        set({ typingUsers: get().typingUsers.filter(id => id !== userId) });
      }
    });

    socket.on("messagesReadReceipt", (userId: string) => {
      set({
        messages: get().messages.map(msg =>
          msg.receiverId === userId ? { ...msg, isRead: true } : msg
        ),
      });
    });

    socket.on("messageReactionAdded", (data: any) => {
      try {
        const { messageId, reactions } = data;
        if (!messageId || !reactions) return;
        set({
          messages: get().messages.map(msg =>
            msg._id === messageId ? { ...msg, reactions: reactions || {} } : msg
          ),
        });
      } catch (error) {
        console.error("Error handling messageReactionAdded:", error);
      }
    });

    socket.on("messageReactionRemoved", (data: any) => {
      try {
        const { messageId, reactions } = data;
        if (!messageId) return;
        set({
          messages: get().messages.map(msg =>
            msg._id === messageId ? { ...msg, reactions: reactions || {} } : msg
          ),
        });
      } catch (error) {
        console.error("Error handling messageReactionRemoved:", error);
      }
    });

    socket.on("messageEdited", (data: any) => {
      const { messageId, text, isEdited, editedAt } = data;
      set({
        messages: get().messages.map(msg =>
          msg._id === messageId ? { ...msg, text, isEdited, editedAt } : msg
        ),
      });
    });

    socket.on("messageDeleted", (data: any) => {
      const { messageId, text } = data;
      set({
        messages: get().messages.map(msg => {
          let updatedMsg = { ...msg };
          if (msg._id === messageId) {
            updatedMsg = {
              ...updatedMsg,
              isDeleted: true,
              text: text || "This message was deleted by User",
              image: undefined,
              file: undefined,
              replyTo: undefined,
              reactions: undefined,
              isPinned: false,
            };
          }
          return updatedMsg;
        }),
      });
    });

    socket.on("messagePinToggled", (data: any) => {
      try {
        const { messageId, isPinned } = data;
        if (!messageId) return;
        set({
          messages: get().messages.map(msg =>
            msg._id === messageId ? { ...msg, isPinned: Boolean(isPinned) } : msg
          ),
        });
      } catch (error) {
        console.error("Error handling messagePinToggled:", error);
      }
    });

    socket.on("userStatusChanged", (data: any) => {
      set({
        userStatus: {
          ...get().userStatus,
          [data.userId]: { status: data.status, statusMessage: data.statusMessage },
        },
      });
    });

    socket.on("chatCleared", () => {
      set({ messages: [] });
      toast.info("Chat history was cleared");
    });

    socket.on("newWorkspaceMessage", (newMessage: IMessage) => {
      const { workspaceMessages } = get();
      const channelId = (newMessage as any).channelId;
      const list = workspaceMessages[channelId] || [];
      if (list.some(msg => msg._id === newMessage._id)) return;
      set({
        workspaceMessages: {
          ...workspaceMessages,
          [channelId]: [...list, newMessage]
        }
      });
    });

    socket.on("workspaceReactionAdded", (data: any) => {
      const { messageId, reactions, channelId } = data;
      const { workspaceMessages } = get();
      const list = workspaceMessages[channelId] || [];
      set({
        workspaceMessages: {
          ...workspaceMessages,
          [channelId]: list.map(msg => msg._id === messageId ? { ...msg, reactions } : msg)
        }
      });
    });

    socket.on("workspaceReactionRemoved", (data: any) => {
      const { messageId, reactions, channelId } = data;
      const { workspaceMessages } = get();
      const list = workspaceMessages[channelId] || [];
      set({
        workspaceMessages: {
          ...workspaceMessages,
          [channelId]: list.map(msg => msg._id === messageId ? { ...msg, reactions } : msg)
        }
      });
    });

    socket.on("pollCreated", (newPoll: any) => {
      const { workspacePolls } = get();
      const channelId = newPoll.channelId;
      const list = workspacePolls[channelId] || [];
      if (list.some(p => p._id === newPoll._id)) return;
      set({
        workspacePolls: {
          ...workspacePolls,
          [channelId]: [newPoll, ...list]
        }
      });
    });

    socket.on("pollVoted", (updatedPoll: any) => {
      const { workspacePolls } = get();
      const channelId = updatedPoll.channelId;
      const list = workspacePolls[channelId] || [];
      set({
        workspacePolls: {
          ...workspacePolls,
          [channelId]: list.map(p => p._id === updatedPoll._id ? updatedPoll : p)
        }
      });
    });

    socket.on("resourceUploaded", (newRes: any) => {
      const { workspaceResources } = get();
      const channelId = newRes.channelId;
      const list = workspaceResources[channelId] || [];
      if (list.some(r => r._id === newRes._id)) return;
      set({
        workspaceResources: {
          ...workspaceResources,
          [channelId]: [newRes, ...list]
        }
      });
    });

    socket.on("channelCreated", (data: any) => {
      const { workspaceId, workspace } = data;
      const { workspaces, selectedWorkspace } = get();
      const updated = workspaces.map(w => w._id === workspaceId ? workspace : w);
      set({
        workspaces: updated,
        selectedWorkspace: selectedWorkspace && selectedWorkspace._id === workspaceId ? workspace : selectedWorkspace
      });
    });

    socket.on("userJoinedWorkspace", (data: any) => {
      const { workspaceId, workspace } = data;
      const { workspaces, selectedWorkspace } = get();
      const updated = workspaces.map(w => w._id === workspaceId ? workspace : w);
      set({
        workspaces: updated,
        selectedWorkspace: selectedWorkspace && selectedWorkspace._id === workspaceId ? workspace : selectedWorkspace
      });
    });

    socket.on("userChannelTyping", (data: any) => {
      const { userId, channelId } = data;
      const { selectedChannelId, channelTypingUsers } = get();
      if (selectedChannelId === channelId) {
        if (!channelTypingUsers.includes(userId)) {
          set({ channelTypingUsers: [...channelTypingUsers, userId] });
        }
      }
    });

    socket.on("userChannelStopTyping", (data: any) => {
      const { userId, channelId } = data;
      const { selectedChannelId, channelTypingUsers } = get();
      if (selectedChannelId === channelId) {
        set({ channelTypingUsers: channelTypingUsers.filter(id => id !== userId) });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("userTyping");
    socket.off("userStopTyping");
    socket.off("messagesReadReceipt");
    socket.off("messageReactionAdded");
    socket.off("messageReactionRemoved");
    socket.off("messageEdited");
    socket.off("messageDeleted");
    socket.off("messagePinToggled");
    socket.off("userStatusChanged");
    socket.off("chatCleared");
    socket.off("newWorkspaceMessage");
    socket.off("workspaceReactionAdded");
    socket.off("workspaceReactionRemoved");
    socket.off("pollCreated");
    socket.off("pollVoted");
    socket.off("resourceUploaded");
    socket.off("channelCreated");
    socket.off("userJoinedWorkspace");
    socket.off("userChannelTyping");
    socket.off("userChannelStopTyping");
  },

  setSelectedUser: (selectedUser) => {
    set({ 
      selectedUser, 
      messages: [], 
      isMoreMessagesAvailable: true,
      searchResults: [], 
      searchQuery: "", 
      editingMessageId: null, 
      replyingToMessage: null 
    });

    if (selectedUser) {
      localStorage.setItem("lastSelectedUserId", selectedUser._id);
    } else {
      localStorage.removeItem("lastSelectedUserId");
    }
  },

  clearSearch: () => {
    set({ searchQuery: "", searchResults: [] });
  },

  setEditingMessage: (messageId) => {
    set({ editingMessageId: messageId });
  },

  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
  toggleCommandPalette: () => set({ isCommandPaletteOpen: !get().isCommandPaletteOpen }),

  setPendingAttachment: (attachment) => set({ pendingAttachment: attachment }),
  setLightboxImage: (lightboxImage) => set({ lightboxImage }),

  markAsUnread: (userId) => {
    set({
      users: get().users.map(u => 
        u._id === userId ? { ...u, unreadCount: ((u as any).unreadCount || 0) + 1 } : (u as any)
      )
    });
  },



  setReplyingToMessage: (message) => {
    set({ replyingToMessage: message });
  },

  exportChat: async (userId, format = 'json', includeDeleted = false) => {
    try {
      const response = await axiosInstance.get(`/messages/export/${userId}`, {
        params: { format, includeDeleted },
        responseType: format === 'json' ? 'json' : 'blob',
      });

      if (format === 'json') {
        return response.data;
      } else {
        const blob = new Blob([response.data], {
          type: format === 'text' ? 'text/plain' : 'text/csv'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export.${format === 'text' ? 'txt' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return true;
      }
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "export chat");
      return false;
    }
  },

  initWorkspaces: async () => {
    try {
      const res = await axiosInstance.get("/workspaces");
      const workspaces = res.data;
      const socket = useAuthStore.getState().socket;
      if (socket) {
        workspaces.forEach((w: IWorkspace) => {
          socket.emit("joinWorkspace", w._id);
        });
      }
      set({ workspaces });
    } catch (e) {
      console.error("Failed to load workspaces:", e);
      toast.error("Failed to sync workspaces.");
    }
  },

  setSelectedWorkspace: async (workspace) => {
    const defaultChannel = workspace && workspace.channels.length > 0 ? workspace.channels[0]._id as string : null;
    const socket = useAuthStore.getState().socket;
    if (socket && workspace) {
      socket.emit("joinWorkspace", workspace._id);
    }
    set({
      selectedWorkspace: workspace,
      selectedChannelId: defaultChannel,
      selectedUser: null,
    });
    if (workspace && defaultChannel) {
      get().fetchChannelData(workspace._id as string, defaultChannel);
    }
  },

  setSelectedChannelId: async (channelId) => {
    const workspace = get().selectedWorkspace;
    set({ selectedChannelId: channelId });
    if (workspace && channelId) {
      get().fetchChannelData(workspace._id as string, channelId);
    }
  },

  fetchChannelData: async (workspaceId, channelId) => {
    const workspace = get().selectedWorkspace;
    if (!workspace) return;
    const channel = workspace.channels.find(c => c._id === channelId);
    if (!channel) return;
    try {
      if (channel.type === "chat") {
        const res = await axiosInstance.get(`/workspaces/${workspaceId}/messages/${channelId}`);
        set({ workspaceMessages: { ...get().workspaceMessages, [channelId]: res.data } });
      } else if (channel.type === "polls") {
        const res = await axiosInstance.get(`/workspaces/${workspaceId}/polls/${channelId}`);
        set({ workspacePolls: { ...get().workspacePolls, [channelId]: res.data } });
      } else if (channel.type === "resources") {
        const res = await axiosInstance.get(`/workspaces/${workspaceId}/resources/${channelId}`);
        set({ workspaceResources: { ...get().workspaceResources, [channelId]: res.data } });
      }
    } catch (error) {
      console.error("Failed to fetch channel data:", error);
    }
  },

  createWorkspace: async (name, icon) => {
    try {
      const res = await axiosInstance.post("/workspaces", { name, icon });
      const newWorkspace = res.data;
      const socket = useAuthStore.getState().socket;
      if (socket) socket.emit("joinWorkspace", newWorkspace._id);
      set({ workspaces: [...get().workspaces, newWorkspace] });
      get().setSelectedWorkspace(newWorkspace);
      toast.success(`Server "${name}" created!`);
    } catch (error) {
      console.error("Failed to create workspace:", error);
    }
  },

  createChannel: async (workspaceId, name, type = "chat") => {
    try {
      const res = await axiosInstance.post(`/workspaces/${workspaceId}/channels`, { name, type });
      const { workspace, channel } = res.data;
      const updated = get().workspaces.map(w => w._id === workspaceId ? workspace : w);
      set({ workspaces: updated });
      if (get().selectedWorkspace?._id === workspaceId) {
        set({ selectedWorkspace: workspace, selectedChannelId: channel._id });
        get().fetchChannelData(workspaceId, channel._id);
      }
      toast.success(`Channel #${channel.name} created!`);
    } catch (error) {
      console.error("Failed to create channel:", error);
    }
  },

  sendChannelMessage: async (workspaceId, channelId, text, file = null) => {
  try {
    const authUser = useAuthStore.getState().authUser;
    if (!authUser) return;
    const tempId = "temp-" + Date.now();
    const tempMessage: IMessage = {
      _id: tempId,
      senderId: authUser._id,
      text,
      image: undefined,
      file: file ? {
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
        size: file.size
      } : undefined,
      isRead: false,
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      reactions: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSending: true,
      // include channelId for workspace messages if needed
      // @ts-ignore
      channelId,
    } as any;
    // Optimistically add to UI
    set(state => {
      const list = state.workspaceMessages[channelId] || [];
      return {
        workspaceMessages: {
          ...state.workspaceMessages,
          [channelId]: [...list, tempMessage]
        }
      };
    });

    // Prepare form data for actual request
    const formData = new FormData();
    formData.append("text", text || "");
    if (file) formData.append("file", file);
    const res = await axiosInstance.post(`/workspaces/${workspaceId}/messages/${channelId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    const newMsg = res.data;
    // Replace optimistic message with server response
    set(state => {
      const list = state.workspaceMessages[channelId] || [];
      const idx = list.findIndex(m => m._id === tempId);
      const newList = idx > -1 ? [...list.slice(0, idx), newMsg, ...list.slice(idx + 1)] : [...list, newMsg];
      return { workspaceMessages: { ...state.workspaceMessages, [channelId]: newList } };
    });
  } catch (error) {
    // Remove optimistic message on failure
    set(state => {
      const list = state.workspaceMessages[channelId] || [];
      return { workspaceMessages: { ...state.workspaceMessages, [channelId]: list.filter(m => m._id !== tempId) } };
    });
    console.error("Failed to send channel message:", error);
  }
},

  addChannelReaction: async (channelId, messageId, emoji) => {
    try {
      const list = get().workspaceMessages[channelId] || [];
      const msg = list.find(m => m._id === messageId);
      if (!msg) return;
      const user = useAuthStore.getState().authUser;
      if (!user) return;
      const userReactions = (msg as any).reactions?.[emoji] || [];
      const hasReacted = userReactions.includes(user._id);
      const path = hasReacted ? "remove" : "add";
      const res = await axiosInstance.post(`/workspaces/messages/${messageId}/reaction/${path}`, { emoji });
      set({ workspaceMessages: { ...get().workspaceMessages, [channelId]: list.map(m => m._id === messageId ? res.data : m) } });
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    }
  },

  createPoll: async (workspaceId, channelId, question, optionLabels) => {
    try {
      const options = optionLabels.filter(lbl => lbl.trim() !== "");
      const res = await axiosInstance.post(`/workspaces/${workspaceId}/polls/${channelId}`, { question, options });
      const list = get().workspacePolls[channelId] || [];
      set({ workspacePolls: { ...get().workspacePolls, [channelId]: [res.data, ...list] } });
      toast.success("Poll launched!");
    } catch (error) {
      console.error("Failed to create poll:", error);
    }
  },

  voteInPoll: async (workspaceId, channelId, pollId, optionId) => {
    try {
      const res = await axiosInstance.post(`/workspaces/polls/${pollId}/vote`, { optionId });
      const list = get().workspacePolls[channelId] || [];
      set({ workspacePolls: { ...get().workspacePolls, [channelId]: list.map(p => p._id === pollId ? res.data : p) } });
    } catch (error) {
      console.error("Failed to cast vote:", error);
    }
  },

  uploadResource: async (workspaceId, channelId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axiosInstance.post(`/workspaces/${workspaceId}/resources/${channelId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const list = get().workspaceResources[channelId] || [];
      set({ workspaceResources: { ...get().workspaceResources, [channelId]: [res.data, ...list] } });
      toast.success(`Uploaded ${file.name}!`);
    } catch (error) {
      console.error("Failed to upload resource:", error);
    }
  },

  deleteWorkspace: async (workspaceId) => {
    try {
      await axiosInstance.delete(`/workspaces/${workspaceId}`);
      set({
        workspaces: get().workspaces.filter(w => w._id !== workspaceId),
        selectedWorkspace: get().selectedWorkspace?._id === workspaceId ? null : get().selectedWorkspace
      });
      toast.success("Group deleted successfully");
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "delete group");
    }
  },

  promoteToAdmin: async (workspaceId, userId) => {
    try {
      const res = await axiosInstance.put(`/workspaces/${workspaceId}/promote/${userId}`);
      set({
        workspaces: get().workspaces.map(w => w._id === workspaceId ? res.data : w),
        selectedWorkspace: get().selectedWorkspace?._id === workspaceId ? res.data : get().selectedWorkspace
      });
      toast.success("Member promoted to Admin");
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "promote member");
    }
  },

  demoteFromAdmin: async (workspaceId, userId) => {
    try {
      const res = await axiosInstance.put(`/workspaces/${workspaceId}/demote/${userId}`);
      set({
        workspaces: get().workspaces.map(w => w._id === workspaceId ? res.data : w),
        selectedWorkspace: get().selectedWorkspace?._id === workspaceId ? res.data : get().selectedWorkspace
      });
      toast.success("Admin demoted to member");
    } catch (error: any) {
      useErrorStore.getState().handleApiError(error, "demote admin");
    }
  },
}));
