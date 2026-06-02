export const togglePinWorkspaceMessage = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { messageId } = req.params;
  const userId = req.user?._id;

  const message = await WorkspaceMessage.findById(messageId);
  if (!message) return next(new AppError("Message not found", 404));

  message.isPinned = !message.isPinned;
  message.pinnedAt = message.isPinned ? new Date() : null;
  message.pinnedBy = message.isPinned ? userId : null;

  await message.save();

  const populated = await WorkspaceMessage.findById(messageId)
    .populate("senderId", "fullName email profilePic status")
    .populate("replyTo");

  io.to(message.workspaceId.toString()).emit("workspaceMessagePinToggled", {
    messageId,
    isPinned: message.isPinned,
    workspaceId: message.workspaceId,
    channelId: message.channelId,
    message: populated,
  });

  res.status(200).json(populated);
});
