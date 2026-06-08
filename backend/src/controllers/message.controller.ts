import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Friendship from "../models/friendship.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import NotificationService from "../services/notification.service.js";
import multer from "multer";
import crypto from "crypto";
import { getLinkMetadata } from "../lib/linkPreview.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

const storage = multer.memoryStorage();

export const getLinkPreview = async (req: Request, res: Response): Promise<any> => {
  try {
    let { url } = req.query as { url?: string };
    if (!url) return res.status(400).json({ error: "URL query parameter is required" });

    // Handle cases where the URL might be "undefined" as a string or empty
    if (url === "undefined" || url === "null" || url.trim() === "") {
      return res.status(400).json({ error: "Invalid URL provided" });
    }

    // Ensure URL has protocol
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }

    const metadata = await getLinkMetadata(url);
    if (!metadata) {
      return res.status(404).json({ error: "Could not fetch metadata for the provided URL" });
    }

    res.status(200).json(metadata);
  } catch (error: any) {
    console.error("Error in getLinkPreview controller:", error.message);
    res.status(500).json({ error: "Internal server error during link preview generation" });
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    // Allow all file types, but check size
    cb(null, true);
  },
});

const hashPin = (pin: string): string =>
  crypto.createHash("sha256").update(pin).digest("hex");

export const deleteExpiredMessages = async (): Promise<void> => {
  try {
    const now = new Date();
    const expired = await Message.find({
      expiresAt: { $lte: now },
      isExpired: { $ne: true },
    });

    if (expired.length === 0) return;

    await Message.updateMany(
      { _id: { $in: expired.map((msg) => msg._id) } },
      {
        isExpired: true,
        text: "[Message expired]",
        image: null,
        file: null,
      }
    );

    console.log(`Expired ${expired.length} messages from automated cleanup`);
  } catch (error: any) {
    console.error("Failed to clean up expired messages:", error.message);
  }
};

export const getUsersForSidebar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loggedInUserId = req.user._id;

    // Get all messages from this user (both sent and received)
    const messages = await Message.find({
      $or: [
        { senderId: loggedInUserId },
        { receiverId: loggedInUserId },
      ],
      isExpired: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .populate("senderId", "fullName profilePic email")
      .populate("receiverId", "fullName profilePic email")
      .lean();

    // Get unique users from messages and organize by chat
    const userMap = new Map();
    messages.forEach((msg: any) => {
      if (!msg.senderId || !msg.receiverId) return; // Skip if user account was deleted

      const otherUser = msg.senderId._id.toString() === loggedInUserId.toString() ? msg.receiverId : msg.senderId;
      if (otherUser && !userMap.has(otherUser._id.toString())) {
        userMap.set(otherUser._id.toString(), {
          ...otherUser,
          lastMessage: msg,
        });
      }
    });

    // Get all other users and add them if not in recent chats
    const allUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password").lean();
    allUsers.forEach((user: any) => {
      if (!userMap.has(user._id.toString())) {
        userMap.set(user._id.toString(), {
          ...user,
          lastMessage: null,
        });
      }
    });

    const users = Array.from(userMap.values()).sort((a: any, b: any) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    res.status(200).json(users);
  } catch (error: any) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const searchUsers = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { query } = req.query as { query?: string };
    const loggedInUserId = req.user._id;

    if (!query || query.trim() === "") {
      return res.status(200).json([]);
    }

    const searchResults = await User.find({
      _id: { $ne: loggedInUserId },
      $or: [
        { fullName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).select("-password");

    res.status(200).json(searchResults);
  } catch (error: any) {
    console.error("Error in searchUsers: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id: userToChatId } = req.params;
    const { limit = "30", before } = req.query as { limit?: string; before?: string };
    const myId = req.user._id;

    // Validate incoming id to avoid casting strings like 'locked' to ObjectId
    if (!mongoose.Types.ObjectId.isValid(userToChatId as string)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const query: any = {
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      isExpired: { $ne: true },
    };

    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .populate("replyTo");

    // Reverse to maintain chronological order for the frontend
    res.status(200).json(messages.reverse());
  } catch (error: any) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    // Mark all messages from userId to myId as read
    await Message.updateMany(
      {
        senderId: userId as string,
        receiverId: myId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Emit read receipt to sender
    const senderSocketId = getReceiverSocketId(userId as string);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesReadReceipt", myId);
    }

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error: any) {
    console.log("Error in markMessagesAsRead: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = [
  upload.single("file"),
  async (req: any, res: Response): Promise<any> => {
    try {
      const { text, image, replyTo, viewOnce, expiresAt } = req.body;
      const { id: receiverId } = req.params;
      const senderId = req.user._id;

      if (text && text.length > 1024) {
        return res.status(400).json({ error: "Message must be 1024 characters or less" });
      }

      // Check if users are friends (unless they are messaging themselves or one is the Help Center)
      if (senderId.toString() !== receiverId.toString()) {
        const helpCenterEmail = process.env.HELP_CENTER_EMAIL || "pansiluco@gmail.com";
        const isHelpCenterSender = req.user.email === helpCenterEmail;
        let isHelpCenterReceiver = false;

        const receiverUser = await User.findById(receiverId);
        if (receiverUser && receiverUser.email === helpCenterEmail) {
          isHelpCenterReceiver = true;
        }

        if (!isHelpCenterSender && !isHelpCenterReceiver) {
          const friendship = await Friendship.findOne({
            status: "accepted",
            $or: [
              { requesterId: senderId, receiverId: receiverId },
              { requesterId: receiverId, receiverId: senderId }
            ]
          });

          if (!friendship) {
            return res.status(403).json({ error: "You can only message users you are friends with" });
          }
        }
      }

      let imageUrl;
      if (image) {
        // Upload base64 image to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
      }

      let fileData = null;
      if (req.file) {
        // Upload file to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
          resource_type: "auto",
          public_id: `file_${Date.now()}_${req.file.originalname}`,
        });
        fileData = {
          url: uploadResponse.secure_url,
          name: req.file.originalname,
          type: req.file.mimetype,
          size: req.file.size,
        };
      }

      const newMessage = new Message({
        senderId,
        deliveredAt: new Date(),
        text,
        image: imageUrl,
        file: fileData,
        isRead: false,
        replyTo: replyTo || null,
        viewOnce: viewOnce === "true" || viewOnce === true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });

      await newMessage.save();
      await newMessage.populate("replyTo");

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        // Emit delivery status to sender
        const senderSocketId = getReceiverSocketId(senderId.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageDelivered", { messageId: newMessage._id, deliveredAt: newMessage.deliveredAt });
        }
      const sender = req.user;
      NotificationService.createNotification({
        recipient: receiverId,
        actor: senderId,
        type: "direct_message",
        title: sender.fullName,
        body: text || (image ? "Sent an image" : "Sent a file"),
        metadata: {
          messageId: newMessage._id,
          conversationId: senderId,
        },
      });

      // Handle mentions (@username)
      if (text) {
        const mentionRegex = /@(\w+)/g;
        const mentions = text.match(mentionRegex);
        if (mentions) {
          for (const mention of mentions) {
            const username = mention.substring(1);
            const mentionedUser = await User.findOne({ fullName: { $regex: new RegExp(`^${username}$`, "i") } });
            if (mentionedUser && mentionedUser._id.toString() !== senderId.toString() && mentionedUser._id.toString() !== receiverId.toString()) {
              NotificationService.createNotification({
                recipient: mentionedUser._id,
                actor: senderId,
                type: "mention",
                title: "Mentioned you",
                body: text,
                metadata: {
                  messageId: newMessage._id,
                  conversationId: senderId,
                },
              });
            }
          }
        }
      }

      // Handle reply
      if (replyTo) {
        const originalMessage = await Message.findById(replyTo);
        if (originalMessage && originalMessage.senderId.toString() !== senderId.toString() && originalMessage.senderId.toString() !== receiverId.toString()) {
          NotificationService.createNotification({
            recipient: originalMessage.senderId.toString() as any,
            actor: senderId,
            type: "reply",
            title: "Replied to your message",
            body: text,
            metadata: {
              messageId: newMessage._id,
              conversationId: senderId,
            },
          });
        }
      }

      res.status(201).json(newMessage);
    } catch (error: any) {
      console.log("Error in sendMessage controller: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
];

// Add reaction to message
export const addReaction = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (!message.reactions) {
      message.reactions = new Map();
    }

    if (!message.reactions.has(emoji)) {
      message.reactions.set(emoji, []);
    }

    const usersWithReaction = message.reactions.get(emoji);
    if (usersWithReaction && !usersWithReaction.some((id: any) => id.toString() === userId.toString())) {
      usersWithReaction.push(userId);
      message.markModified("reactions");
    }

    await message.save();

    // Send notification to message sender
    if (message.senderId.toString() !== userId.toString()) {
      NotificationService.createNotification({
        recipient: message.senderId.toString() as any,
        actor: userId,
        type: "reaction",
        title: "Reacted to your message",
        body: emoji,
        metadata: {
          messageId: message._id,
          reactionType: emoji,
        },
      });
    }

    // Emit to both users
    const receiverId = message.receiverId;
    const senderId = message.senderId;
    const otherUserId = userId.toString() === senderId.toString() ? receiverId : senderId;

    const otherUserSocketId = getReceiverSocketId(otherUserId.toString());
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit("messageReactionAdded", {
        messageId,
        emoji,
        userId,
        reactions: Object.fromEntries(message.reactions),
      });
    }

    res.status(200).json({ reactions: Object.fromEntries(message.reactions) });
  } catch (error: any) {
    console.log("Error in addReaction: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Remove reaction from message
export const removeReaction = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.reactions && message.reactions.has(emoji)) {
      const usersWithReaction = message.reactions.get(emoji);
      if (usersWithReaction) {
        const index = usersWithReaction.findIndex((id: any) => id.toString() === userId.toString());
        if (index !== -1) {
          usersWithReaction.splice(index, 1);
          if (usersWithReaction.length === 0) {
            message.reactions.delete(emoji);
          }
          message.markModified("reactions");
          await message.save();
        }
      }
    }

    // Emit to other user
    const receiverId = message.receiverId;
    const senderId = message.senderId;
    const otherUserId = userId.toString() === senderId.toString() ? receiverId : senderId;

    const otherUserSocketId = getReceiverSocketId(otherUserId.toString());
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit("messageReactionRemoved", {
        messageId,
        emoji,
        userId,
        reactions: Object.fromEntries(message.reactions || new Map()),
      });
    }

    res.status(200).json({ reactions: Object.fromEntries(message.reactions || new Map()) });
  } catch (error: any) {
    console.log("Error in removeReaction: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Edit message
export const editMessage = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (text && text.length > 1024) {
      return res.status(400).json({ error: "Message must be 1024 characters or less" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Can only edit your own messages" });
    }

    // Add to edit history
    if (!message.editHistory) {
      message.editHistory = [];
    }
    message.editHistory.push({
      text: message.text || "",
      editedAt: new Date(),
    });

    message.text = text;
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    // Emit to other user
    const receiverId = message.receiverId;
    const otherUserSocketId = getReceiverSocketId(receiverId.toString());
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit("messageEdited", {
        messageId,
        text,
        isEdited: true,
        editedAt: message.editedAt,
      });
    }

    res.status(200).json(message);
  } catch (error: any) {
    console.log("Error in editMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete message
export const deleteMessage = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Can only delete your own messages" });
    }

    const sender = await User.findById(message.senderId);
    const senderName = sender ? sender.fullName : "User";
    const deletionText = `This message was deleted by ${senderName}`;

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.text = deletionText;
    message.image = null;
    message.file = null;
    message.replyTo = null;
    message.reactions = new Map();
    message.isPinned = false;

    await message.save();

    // Emit to other user
    const receiverId = message.receiverId;
    if (receiverId) {
      const otherUserSocketId = getReceiverSocketId(receiverId.toString());
      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit("messageDeleted", { messageId, text: deletionText });
      }
    }

    res.status(200).json({ message: "Message deleted successfully", text: deletionText });
  } catch (error: any) {
    console.log("Error in deleteMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Pin/Unpin message
export const togglePinMessage = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    message.isPinned = !message.isPinned;
    message.pinnedAt = message.isPinned ? new Date() : undefined;
    message.pinnedBy = message.isPinned ? userId : null;

    await message.save();

    // Emit to both users
    const receiverId = message.receiverId;
    const senderId = message.senderId;
    const otherUserId = userId.toString() === senderId.toString() ? receiverId : senderId;

    const otherUserSocketId = getReceiverSocketId(otherUserId.toString());
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit("messagePinToggled", {
        messageId,
        isPinned: message.isPinned,
      });
    }

    res.status(200).json(message);
  } catch (error: any) {
    console.log("Error in togglePinMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get pinned messages
export const getPinnedMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    const pinnedMessages = await Message.find({
      isPinned: true,
      $or: [
        { senderId: myId, receiverId: userId as string },
        { senderId: userId as string, receiverId: myId },
      ],
    })
      .populate("senderId", "fullName profilePic")
      .populate("receiverId", "fullName profilePic")
      .sort({ pinnedAt: -1 });

    res.status(200).json(pinnedMessages);
  } catch (error: any) {
    console.log("Error in getPinnedMessages: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Search messages
export const searchMessages = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const { query, sender, startDate, endDate, fileType } = req.query as { 
      query?: string; 
      sender?: string;
      startDate?: string;
      endDate?: string;
      fileType?: string;
    };
    const myId = req.user._id;

    const filterObj: any = {
      $or: [
        { senderId: myId, receiverId: userId as string },
        { senderId: userId as string, receiverId: myId },
      ],
      isDeleted: false,
      isExpired: { $ne: true },
    };

    if (query) {
      filterObj.text = { $regex: query, $options: "i" };
    }

    if (sender) {
      filterObj.senderId = sender === "me" ? myId : (userId as string);
    }

    if (startDate || endDate) {
      filterObj.createdAt = {};
      if (startDate) filterObj.createdAt.$gte = new Date(startDate);
      if (endDate) filterObj.createdAt.$lte = new Date(endDate);
    }

    if (fileType) {
      filterObj["file.type"] = { $regex: fileType, $options: "i" };
    }

    const results = await Message.find(filterObj)
      .populate("senderId", "fullName profilePic")
      .populate("receiverId", "fullName profilePic")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(results);
  } catch (error: any) {
    console.log("Error in searchMessages: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const setChatDisappearing = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const { expiryLabel, expiresAt } = req.body;
    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ error: "User not found" });

    const settings = me.chatSettings || new Map();
    settings.set(userId as string, {
      expiryLabel,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
    me.chatSettings = settings;
    await me.save();

    res.status(200).json({ expiryLabel, expiresAt });
  } catch (error: any) {
    console.log("Error in setChatDisappearing: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLockedChats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const me = await User.findById(req.user._id).select("lockedChats");
    const lockedIds = me?.lockedChats || [];
    const chats = await User.find({ _id: { $in: lockedIds } }).select("fullName email profilePic");
    res.status(200).json(chats);
  } catch (error: any) {
    console.log("Error in getLockedChats: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const lockChat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const { pin } = req.body;
    if (!pin || pin.length < 4) {
      return res.status(400).json({ error: "PIN must be at least 4 digits" });
    }

    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ error: "User not found" });

    if (!me.lockedChats) me.lockedChats = [];
    if (!me.lockPins) me.lockPins = new Map();

    if (!me.lockedChats.some((id: any) => id.toString() === (userId as string))) {
      me.lockedChats.push(userId as string);
    }
    me.lockPins.set(userId as string, hashPin(pin));
    me.markModified("lockPins");
    await me.save();

    res.status(200).json({ locked: true });
  } catch (error: any) {
    console.log("Error in lockChat: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unlockChat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const { pin } = req.body;

    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ error: "User not found" });

    const storedHash = me.lockPins?.get(userId as string);
    if (!storedHash || storedHash !== hashPin(pin)) {
      return res.status(403).json({ error: "Invalid PIN" });
    }

    res.status(200).json({ unlocked: true });
  } catch (error: any) {
    console.log("Error in unlockChat: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markViewOnceOpened = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (!message.viewOnce || message.viewedOnce) {
      return res.status(200).json(message);
    }

    message.viewedOnce = true;
    message.viewedAt = new Date();
    await message.save();

    res.status(200).json(message);
  } catch (error: any) {
    console.log("Error in markViewOnceOpened: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Forward message
export const forwardMessage = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { messageId } = req.params;
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ error: "Receiver ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(messageId as string) || !mongoose.Types.ObjectId.isValid(receiverId as string)) {
      return res.status(400).json({ error: "Invalid message or receiver ID" });
    }

    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({ error: "Cannot forward a message to yourself" });
    }

    // Check if users are friends (unless one is the Help Center)
    const helpCenterEmail = process.env.HELP_CENTER_EMAIL || "pansiluco@gmail.com";
    const isHelpCenterSender = req.user.email === helpCenterEmail;
    let isHelpCenterReceiver = false;

    const receiverUser = await User.findById(receiverId);
    if (!receiverUser) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    if (receiverUser.email === helpCenterEmail) {
      isHelpCenterReceiver = true;
    }

    if (!isHelpCenterSender && !isHelpCenterReceiver) {
      const friendship = await Friendship.findOne({
        status: "accepted",
        $or: [
          { requesterId: senderId, receiverId: receiverId },
          { requesterId: receiverId, receiverId: senderId }
        ]
      });

      if (!friendship) {
        return res.status(403).json({ error: "You can only message users you are friends with" });
      }
    }

    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    const forwardedMessage = new Message({
      senderId,
      receiverId,
      text: originalMessage.text,
      image: originalMessage.image,
      file: originalMessage.file,
      forwardedFrom: originalMessage._id,
      isRead: false,
    });

    await forwardedMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", forwardedMessage);
    }

    res.status(201).json(forwardedMessage);
  } catch (error: any) {
    console.error("Error in forwardMessage: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update user status
export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { status, statusMessage } = req.body;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        status,
        statusMessage: statusMessage || "",
        lastSeen: new Date(),
      },
      { new: true }
    ).select("-password");

    // Broadcast status change
    io.emit("userStatusChanged", {
      userId,
      status,
      statusMessage,
    });

    res.status(200).json(user);
  } catch (error: any) {
    console.log("Error in updateUserStatus: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get user status
export const getUserStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("status statusMessage lastSeen");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error: any) {
    console.log("Error in getUserStatus: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Archive chat
export const getCommunityData = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const me = await User.findById(req.user._id).select("communityIds subscribedChannels") as any;
    res.status(200).json({ communityIds: me?.communityIds || [], subscribedChannels: me?.subscribedChannels || [] });
  } catch (error: any) {
    console.log("Error in getCommunityData: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const toggleArchiveChat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    const user = await User.findById(myId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.archivedChats) {
      user.archivedChats = [];
    }

    const chatIndex = user.archivedChats.findIndex(id => id.toString() === (userId as string));

    if (chatIndex > -1) {
      user.archivedChats.splice(chatIndex, 1);
    } else {
      user.archivedChats.push(userId as string as any);
    }

    await user.save();
    res.status(200).json({ archived: chatIndex === -1 });
  } catch (error: any) {
    console.log("Error in toggleArchiveChat: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Pin chat
export const togglePinChat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    const user = await User.findById(myId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.pinnedChats) {
      user.pinnedChats = [];
    }

    const chatIndex = user.pinnedChats.findIndex(id => id.toString() === (userId as string));

    if (chatIndex > -1) {
      user.pinnedChats.splice(chatIndex, 1);
    } else {
      user.pinnedChats.push(userId as string as any);
    }

    await user.save();
    res.status(200).json({ pinned: chatIndex === -1 });
  } catch (error: any) {
    console.log("Error in togglePinChat: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mute chat
export const toggleMuteChat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    const user = await User.findById(myId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.mutedChats) {
      user.mutedChats = [];
    }

    const chatIndex = user.mutedChats.findIndex(id => id.toString() === (userId as string));

    if (chatIndex > -1) {
      user.mutedChats.splice(chatIndex, 1);
    } else {
      user.mutedChats.push(userId as string as any);
    }

    await user.save();
    res.status(200).json({ muted: chatIndex === -1 });
  } catch (error: any) {
    console.log("Error in toggleMuteChat: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Clear chat history
export const clearChatHistory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: userId as string },
        { senderId: userId as string, receiverId: myId },
      ],
    });

    // Emit to other user
    const otherUserSocketId = getReceiverSocketId(userId as string);
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit("chatCleared");
    }

    res.status(200).json({ message: "Chat history cleared" });
  } catch (error: any) {
    console.log("Error in clearChatHistory: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update theme
export const updateTheme = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { theme } = req.body;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { theme },
      { new: true }
    ).select("-password");

    res.status(200).json(user);
  } catch (error: any) {
    console.log("Error in updateTheme: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Set chat background
export const setChatBackground = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { chatUserId, backgroundUrl } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId) as any;
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.chatBackgrounds) {
      user.chatBackgrounds = new Map();
    }

    user.chatBackgrounds.set(chatUserId, backgroundUrl);
    user.markModified("chatBackgrounds");
    await user.save();

    res.status(200).json({ message: "Background updated" });
  } catch (error: any) {
    console.log("Error in setChatBackground: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Export chat history
export const exportChat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const { format = 'json', includeDeleted = false } = req.query as { format?: string; includeDeleted?: string | boolean };
    const loggedInUserId = req.user._id;

    // Verify the user is part of this chat
    if (loggedInUserId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: "You can only export your own chats" });
    }

    // Get all messages between these users
    const messages = await Message.find({
      $or: [
        { senderId: loggedInUserId, receiverId: userId as string },
        { senderId: userId as string, receiverId: loggedInUserId },
      ],
      ...(includeDeleted === 'true' || includeDeleted === true ? {} : { isDeleted: false }),
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "fullName email")
      .populate("receiverId", "fullName email")
      .populate("replyTo", "text senderId")
      .populate("forwardedFrom", "text senderId");

    // Get user info for the chat
    const chatUser = await User.findById(userId).select("fullName email");
    if (!chatUser) return res.status(404).json({ error: "Chat partner not found" });

    const exportData: any = {
      exportedAt: new Date().toISOString(),
      chatWith: {
        id: chatUser._id,
        name: chatUser.fullName,
        email: chatUser.email,
      },
      totalMessages: messages.length,
      messages: messages.map((msg: any) => ({
        id: msg._id,
        timestamp: msg.createdAt,
        sender: {
          id: msg.senderId._id,
          name: msg.senderId.fullName,
          email: msg.senderId.email,
        },
        text: msg.text,
        image: msg.image,
        file: msg.file,
        isEdited: msg.isEdited,
        editedAt: msg.editedAt,
        editHistory: msg.editHistory,
        isDeleted: msg.isDeleted,
        deletedAt: msg.deletedAt,
        isPinned: msg.isPinned,
        pinnedAt: msg.pinnedAt,
        reactions: Object.fromEntries(msg.reactions || new Map()),
        replyTo: msg.replyTo ? {
          id: msg.replyTo._id,
          text: msg.replyTo.text,
          sender: msg.replyTo.senderId?.fullName,
        } : null,
        forwardedFrom: msg.forwardedFrom ? {
          id: msg.forwardedFrom._id,
          text: msg.forwardedFrom.text,
          sender: msg.forwardedFrom.senderId?.fullName,
        } : null,
        isRead: msg.isRead,
        readAt: msg.readAt,
      })),
    };

    // Format the response based on requested format
    if (format === 'text') {
      const textContent = formatChatAsText(exportData);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="chat-${chatUser.fullName.replace(/\s+/g, '_')}.txt"`);
      return res.send(textContent);
    }

    if (format === 'csv') {
      const csvContent = formatChatAsCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="chat-${chatUser.fullName.replace(/\s+/g, '_')}.csv"`);
      return res.send(csvContent);
    }

    // Default JSON format
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="chat-${chatUser.fullName.replace(/\s+/g, '_')}.json"`);
    res.json(exportData);

  } catch (error: any) {
    console.log("Error in exportChat: ", error.message);
    res.status(500).json({ error: "Failed to export chat" });
  }
};

// Helper function to format chat as text
function formatChatAsText(data: any): string {
  let text = `Chat Export - ${data.chatWith.name}\n`;
  text += `Exported on: ${new Date(data.exportedAt).toLocaleString()}\n`;
  text += `Total messages: ${data.totalMessages}\n\n`;
  text += '='.repeat(50) + '\n\n';

  data.messages.forEach((msg: any) => {
    const timestamp = new Date(msg.timestamp).toLocaleString();
    const sender = msg.sender.name;
    const isEdited = msg.isEdited ? ' (edited)' : '';
    const isDeleted = msg.isDeleted ? ' (deleted)' : '';

    text += `[${timestamp}] ${sender}${isEdited}${isDeleted}:\n`;

    if (msg.text) {
      text += `${msg.text}\n`;
    }

    if (msg.image) {
      text += `[Image: ${msg.image}]\n`;
    }

    if (msg.file) {
      text += `[File: ${msg.file.name} (${msg.file.size} bytes)]\n`;
    }

    if (msg.replyTo) {
      text += `┌─ Replying to: "${msg.replyTo.text}"\n`;
    }

    if (msg.forwardedFrom) {
      text += `┌─ Forwarded from: ${msg.forwardedFrom.sender}\n`;
    }

    if (msg.reactions && Object.keys(msg.reactions).length > 0) {
      const reactions = Object.entries(msg.reactions)
        .map(([emoji, users]: any) => `${emoji}(${users.length})`)
        .join(' ');
      text += `Reactions: ${reactions}\n`;
    }

    if (msg.isPinned) {
      text += '📌 Pinned message\n';
    }

    text += '\n';
  });

  return text;
}

// Helper function to format chat as CSV
function formatChatAsCSV(data: any): string {
  let csv = 'Timestamp,Sender,Message,Image,File,IsEdited,IsDeleted,IsPinned,Reactions,ReplyTo,ForwardedFrom\n';

  data.messages.forEach((msg: any) => {
    const timestamp = new Date(msg.timestamp).toISOString();
    const sender = msg.sender.name;
    const text = msg.text ? `"${msg.text.replace(/"/g, '""')}"` : '';
    const image = msg.image || '';
    const file = msg.file ? `${msg.file.name} (${msg.file.size} bytes)` : '';
    const isEdited = msg.isEdited ? 'Yes' : 'No';
    const isDeleted = msg.isDeleted ? 'Yes' : 'No';
    const isPinned = msg.isPinned ? 'Yes' : 'No';
    const reactions = msg.reactions ? Object.entries(msg.reactions).map
    (([emoji, users]: any) => `${emoji}(${users.length})`).join('; ') : '';
    const replyTo = msg.replyTo ? `"${msg.replyTo.text?.replace(/"/g, '""') || ''}"`:'';
    const forwardedFrom = msg.forwardedFrom ? msg.forwardedFrom.sender || '' : '';

    csv += `${timestamp},${sender},${text},${image},${file},${isEdited},${isDeleted},${isPinned},"${reactions}",${replyTo},${forwardedFrom}\n`;
  });

  return csv;
}
