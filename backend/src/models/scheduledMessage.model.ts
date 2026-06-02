import mongoose, { Document, Model, Schema } from "mongoose";

export interface IScheduledMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  channelId: mongoose.Types.ObjectId;
  text: string;
  scheduledAt: Date;
  isSent: boolean;
}

const scheduledMessageSchema = new Schema<IScheduledMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    channelId: { type: Schema.Types.ObjectId, required: true },
    text: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    isSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ScheduledMessage: Model<IScheduledMessage> = mongoose.models.ScheduledMessage || mongoose.model<IScheduledMessage>("ScheduledMessage", scheduledMessageSchema);

export default ScheduledMessage;
