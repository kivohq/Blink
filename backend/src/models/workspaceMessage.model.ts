import mongoose, { Document, Model, Schema } from "mongoose";
import { IWorkspaceMessage } from "../types/index.js";

export interface IWorkspaceMessageDocument extends IWorkspaceMessage, Document {
  _id: mongoose.Types.ObjectId;
}

const workspaceMessageSchema = new Schema<IWorkspaceMessageDocument>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    channelId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    text: {
      type: String,
      default: "",
      maxlength: 1024,
    },
    image: {
      type: String,
      default: "",
    },
    file: {
      url: { type: String, default: "" },
      name: { type: String, default: "" },
      type: { type: String, default: "" },
      size: { type: Number, default: 0 },
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
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "WorkspaceMessage",
      default: null,
    },
    threadId: {
      type: Schema.Types.ObjectId,
      ref: "WorkspaceMessage",
      default: null,
    },
    threadReplyCount: {
      type: Number,
      default: 0,
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
    expiresAt: {
      type: Date,
      default: null,
      index: { expires: 0 } // This will automatically delete the document at expiresAt
    },
  },
  { timestamps: true }
);

workspaceMessageSchema.index({ workspaceId: 1, channelId: 1, createdAt: 1 });

const WorkspaceMessage: Model<IWorkspaceMessageDocument> = mongoose.models.WorkspaceMessage || mongoose.model<IWorkspaceMessageDocument>("WorkspaceMessage", workspaceMessageSchema);

export default WorkspaceMessage;
