import { Response, NextFunction } from "express";
import WorkspaceMessage from "../models/workspaceMessage.model.js";
import { io } from "../lib/socket.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

// Get messages in a thread
export const getThreadMessages = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { messageId } = req.params;

  const messages = await WorkspaceMessage.find({ threadId: messageId })
    .populate("senderId", "fullName email profilePic status")
    .sort({ createdAt: 1 });

  res.status(200).json(messages);
});

// Reply in a thread
export const replyInThread = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { messageId } = req.params;
  const { text, image, file } = req.body;
  const senderId = req.user?._id;

  const parentMessage = await WorkspaceMessage.findById(messageId);
  if (!parentMessage) return next(new AppError("Parent message not found", 404));

  // Determine threadId: either the parent's threadId (if it's already in a thread) or the parent message's own ID
  const threadId = parentMessage.threadId || parentMessage._id;

  const reply = new WorkspaceMessage({
    senderId,
    workspaceId: parentMessage.workspaceId,
    channelId: parentMessage.channelId,
    text,
    image,
    file,
    threadId,
    replyTo: messageId,
  });

  await reply.save();

  // Increment thread reply count on parent
  await WorkspaceMessage.findByIdAndUpdate(threadId, { $inc: { threadReplyCount: 1 } });

  const populated = await WorkspaceMessage.findById(reply._id)
    .populate("senderId", "fullName email profilePic status");

  io.to(parentMessage.workspaceId.toString()).emit("newThreadMessage", {
    threadId,
    message: populated,
  });

  res.status(201).json(populated);
});
