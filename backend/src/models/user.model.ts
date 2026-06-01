import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "../types/index.js";

export interface IUserDocument extends IUser, Document {
  _id: mongoose.Types.ObjectId;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["online", "away", "dnd", "offline"],
      default: "offline",
    },
    statusMessage: {
      type: String,
      default: "",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    archivedChats: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    pinnedChats: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    mutedChats: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lockedChats: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lockPins: {
      type: Map,
      of: String,
      default: new Map(),
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "dark",
    },
    notificationPreferences: {
      directMessages: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      workspaceActivity: { type: Boolean, default: true },
    },
    pushSubscription: {
      type: Schema.Types.Mixed,
      default: null,
    },
    chatSettings: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map(),
    },
    username: {
      type: String,
      unique: true,
      required: true,
      maxlength: 30,
    },
    handle: {
      type: String,
      unique: true,
      required: true,
      maxlength: 20,
    },
    publicProfile: {
      type: new Schema({
        bio: { type: String, default: '', maxlength: 500 },
        avatar: { type: String, default: '' },
      }, { _id: false }),
      default: {},
    },
    privateProfile: {
      type: new Schema({
      isPrivate: { type: Boolean, default: false },
        avatar: { type: String, default: '' },
      }, { _id: false }),
      default: {},
    },
    allowedViewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const User: Model<IUserDocument> = mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);

export default User;
