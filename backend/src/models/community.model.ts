import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICommunity extends Document {
  name: string;
  description: string;
  icon: string;
  owner: mongoose.Types.ObjectId;
  admins: mongoose.Types.ObjectId[];
  workspaces: mongoose.Types.ObjectId[]; // Linked groups
}

const communitySchema = new Schema<ICommunity>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admins: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    workspaces: [{
      type: Schema.Types.ObjectId,
      ref: "Workspace",
    }],
  },
  { timestamps: true }
);

const Community: Model<ICommunity> = mongoose.models.Community || mongoose.model<ICommunity>("Community", communitySchema);

export default Community;
