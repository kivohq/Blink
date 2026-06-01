import mongoose, { Document, Model, Schema } from "mongoose";
import { IMessage } from "../types/index.js";

export interface IMessageDocument extends IMessage, Document {
  _id: mongoose.Types.ObjectId;
}

const messageSchema = new Schema<IMessageDocument>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    text: {
      type: String,
      maxlength: 1024,
    },
    image: {
      type: String,
    },
    file: {
      url: { type: String },
      name: { type: String },
      type: { type: String },
      size: { type: Number },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    reactions: {
      type: Map,
      of: [Schema.Types.ObjectId],
      default: new Map(),
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    editHistory: [
      {
        text: String,
        editedAt: Date,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedAt: {
      type: Date,
      default: null,
    },
    pinnedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    forwardedFrom: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    viewOnce: {
      type: Boolean,
      default: false,
    },
    viewedOnce: {
      type: Boolean,
      default: false,
    },
    viewedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, createdAt: -1 });

const Message: Model<IMessageDocument> = mongoose.models.Message || mongoose.model<IMessageDocument>("Message", messageSchema);

export default Message;
