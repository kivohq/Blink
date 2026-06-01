import mongoose, { Document, Model, Schema } from "mongoose";
import { IWorkspace } from "../types/index.js";

export interface IWorkspaceDocument extends IWorkspace, Document {
  _id: mongoose.Types.ObjectId;
}

const channelSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["chat", "polls", "resources", "voice"],
      default: "chat",
    },
    topic: {
      type: String,
      default: "",
    },
  }
);

const workspaceSchema = new Schema<IWorkspaceDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    maxMembers: {
      type: Number,
      default: 1024,
    },
    pendingApproval: {
      type: Boolean,
      default: false,
    },
    joinRequests: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    permissions: {
      canEditInfo: { type: String, enum: ["admins", "everyone"], default: "admins" },
      canSendMessages: { type: String, enum: ["admins", "everyone"], default: "everyone" },
      canAddMembers: { type: String, enum: ["admins", "everyone"], default: "everyone" },
    },
    disappearingMessages: {
      enabled: { type: Boolean, default: false },
      duration: { type: Number, default: 86400 }, // in seconds, default 24h
    },
    communityId: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      default: null,
    },
    channels: [channelSchema],
  },
  { timestamps: true }
);

const Workspace: Model<IWorkspaceDocument> = mongoose.models.Workspace || mongoose.model<IWorkspaceDocument>("Workspace", workspaceSchema);

export default Workspace;
