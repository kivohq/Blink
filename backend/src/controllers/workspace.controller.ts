import { Response, NextFunction } from "express";
import Workspace from "../models/workspace.model.js";
import WorkspaceMessage from "../models/workspaceMessage.model.js";
import WorkspacePoll from "../models/workspacePoll.model.js";
import WorkspaceResource from "../models/workspaceResource.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import multer from "multer";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

export { togglePinWorkspaceMessage } from "./workspace-pin.js";
export { getThreadMessages, replyInThread } from "./workspace-thread.js";

const storage = multer.memoryStorage();
export const workspaceUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
}).single("file");

export const getWorkspaces = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id;
  let workspaces = await Workspace.find({ members: userId }).populate("members", "fullName email profilePic status");

  if (workspaces.length === 0) {
    console.log("Seeding default workspaces for user: ", userId);
    
    const seedWorkspaces = [
      {
        name: "Design Squad",
        icon: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
        description: "Collaboration space for UX/UI designers and React frontend developers.",
        owner: userId,
        members: [userId],
        channels: [
          { name: "announcements", type: "chat", topic: "Company-wide styling announcements and React design tokens." },
          { name: "design-critique", type: "chat", topic: "Post and critique UI component mockups." },
          { name: "active-polls", type: "polls", topic: "Vote on layout updates and color harmonies." },
          { name: "resources", type: "resources", topic: "Shared asset links, icons, and typography guides." },
        ]
      },
      {
        name: "AI Lab",
        icon: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
        description: "R&D server for advanced agent capabilities, socket bridges, and LLMs.",
        owner: userId,
        members: [userId],
        channels: [
          { name: "announcements", type: "chat", topic: "Important announcements about agentic code pipelines." },
          { name: "ai-general", type: "chat", topic: "General discussions about agent logic, vector databases, and UI." },
        ]
      },
      {
        name: "Operations",
        icon: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
        description: "Operational checklists, deployment schedules, and performance monitoring.",
        owner: userId,
        members: [userId],
        channels: [
          { name: "ops-announcements", type: "chat", topic: "System status alerts and scaling notifications." },
          { name: "general", type: "chat", topic: "General ops coordination and container scaling conversations." },
        ]
      }
    ];

    for (const w of seedWorkspaces) {
      const workspace = new Workspace(w);
      await workspace.save();

      const announcementsChannel = workspace.channels.find(c => c.name.includes("announcements"));
      const generalChannel = workspace.channels.find(c => c.name === "general" || c.name === "design-critique" || c.name === "ai-general");
      const pollsChannel = workspace.channels.find(c => c.type === "polls");
      const resourcesChannel = workspace.channels.find(c => c.type === "resources");

      if (announcementsChannel) {
        const m1 = new WorkspaceMessage({
          senderId: userId,
          workspaceId: workspace._id,
          channelId: announcementsChannel._id,
          text: `🚀 Welcome to the brand new **${workspace.name}** workspace! Dive into channels, trigger interactive polls, and share assets directly with your team.`,
        });
        await m1.save();
      }

      if (generalChannel) {
        const m2 = new WorkspaceMessage({
          senderId: userId,
          workspaceId: workspace._id,
          channelId: generalChannel._id,
          text: "Hello everyone! This channel is fully operational. Try sending a message or attaching a file to test the real MERN synchronization.",
        });
        await m2.save();
      }

      if (pollsChannel) {
        const p1 = new WorkspacePoll({
          workspaceId: workspace._id,
          channelId: pollsChannel._id,
          question: "Which primary palette should we adopt for the new dark mode theme?",
          options: [
            { text: "Neon Glassmorphism (Vibrant Purples & Pinks)", votes: [userId] },
            { text: "Midnight Cyberpunk (Deep Blues & Cyans)", votes: [] },
            { text: "Nordic Minimalist (Sleek Monochromes)", votes: [] }
          ],
          creatorId: userId,
        });
        await p1.save();
      }

      if (resourcesChannel) {
        const r1 = new WorkspaceResource({
          workspaceId: workspace._id,
          channelId: resourcesChannel._id,
          name: "React Design System Spec.pdf",
          url: "https://res.cloudinary.com/demo/image/upload/v1371281596/sample.jpg",
          type: "application/pdf",
          size: 2048576,
          uploadedBy: userId,
        });
        await r1.save();
      }
    }

    workspaces = await Workspace.find({ members: userId }).populate("members", "fullName email profilePic status");
  }

  res.status(200).json(workspaces);
});

export const createWorkspace = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { name, icon, description, handle } = req.body;
  const userId = req.user?._id;

  if (!name) return next(new AppError("Workspace name is required", 400));
  
  if (handle) {
    const existingHandle = await Workspace.findOne({ handle });
    if (existingHandle) return next(new AppError("Group handle is already taken", 400));
  }

  const newWorkspace = new Workspace({
    name,
    handle: handle || null,
    icon: icon || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    description: description || "",
    owner: userId,
    admins: [userId],
    members: [userId],
    channels: [
      { name: "announcements", type: "chat", topic: "Official announcements." },
      { name: "general", type: "chat", topic: "General chit-chat." },
      { name: "active-polls", type: "polls", topic: "Interactive polls and votes." },
      { name: "resources", type: "resources", topic: "Uploaded files and shared links." },
    ]
  });

  await newWorkspace.save();
  
  const annChan = newWorkspace.channels.find(c => c.name === "announcements");
  if (annChan) {
    const initMsg = new WorkspaceMessage({
      senderId: userId,
      workspaceId: newWorkspace._id,
      channelId: annChan._id,
      text: `🎉 Group **${name}** has been successfully created. Welcome your team members!`,
    });
    await initMsg.save();
  }

  const populated = await Workspace.findById(newWorkspace._id).populate("members", "fullName email profilePic status");

  io.emit("newWorkspaceCreated", populated);

  res.status(201).json(populated);
});

export const deleteWorkspace = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { workspaceId } = req.params;
  const userId = req.user?._id;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return next(new AppError("Group not found", 404));

  if (workspace.owner.toString() !== userId.toString()) {
    return next(new AppError("Only the owner can delete the group", 403));
  }

  await Workspace.findByIdAndDelete(workspaceId);
  await WorkspaceMessage.deleteMany({ workspaceId });
  await WorkspacePoll.deleteMany({ workspaceId });
  await WorkspaceResource.deleteMany({ workspaceId });

  io.emit("workspaceDeleted", { workspaceId });

  res.status(200).json({ message: "Group deleted successfully" });
});

export const promoteToAdmin = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { workspaceId, userId } = req.params;
  const requesterId = req.user?._id;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return next(new AppError("Group not found", 404));

  if (workspace.owner.toString() !== requesterId.toString()) {
    return next(new AppError("Only the owner can promote admins", 403));
  }

  if (workspace.admins.includes(userId as any)) {
    return next(new AppError("User is already an admin", 400));
  }

  workspace.admins.push(userId as any);
  await workspace.save();

  const populated = await Workspace.findById(workspaceId).populate("members", "fullName email profilePic status");
  io.to(workspaceId.toString()).emit("adminPromoted", { workspaceId, userId, workspace: populated });

  res.status(200).json(populated);
});

export const demoteFromAdmin = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { workspaceId, userId } = req.params;
  const requesterId = req.user?._id;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return next(new AppError("Group not found", 404));

  if (workspace.owner.toString() !== requesterId.toString()) {
    return next(new AppError("Only the owner can demote admins", 403));
  }

  workspace.admins = workspace.admins.filter(adminId => adminId.toString() !== userId);
  await workspace.save();

  const populated = await Workspace.findById(workspaceId).populate("members", "fullName email profilePic status");
  io.to(workspaceId.toString()).emit("adminDemoted", { workspaceId, userId, workspace: populated });

  res.status(200).json(populated);
});

export const createChannel = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { workspaceId } = req.params;
  const { name, type, topic } = req.body;

  if (!name) return next(new AppError("Channel name is required", 400));
  if (!type) return next(new AppError("Channel type is required", 400));

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return next(new AppError("Workspace not found", 404));

  const formattedName = name.trim().toLowerCase().replace(/\s+/g, "-");

  workspace.channels.push({
    name: formattedName,
    type,
    topic: topic || "",
  } as any);

  await workspace.save();

  const updatedWorkspace = await Workspace.findById(workspaceId).populate("members", "fullName email profilePic status");
  if (!updatedWorkspace) return next(new AppError("Workspace not found after update", 500));
  const newChannel = updatedWorkspace.channels[updatedWorkspace.channels.length - 1];

  io.to(workspaceId.toString()).emit("channelCreated", { workspaceId, channel: newChannel, workspace: updatedWorkspace });

  res.status(201).json({ workspace: updatedWorkspace, channel: newChannel });
});

export const joinWorkspace = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { workspaceId } = req.params;
  const userId = req.user?._id;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return next(new AppError("Workspace not found", 404));

  if (workspace.members.includes(userId)) {
    return next(new AppError("You are already a member of this workspace", 400));
  }

  workspace.members.push(userId);
  await workspace.save();

  const populated = await Workspace.findById(workspaceId).populate("members", "fullName email profilePic status");

  io.to(workspaceId.toString()).emit("userJoinedWorkspace", { workspaceId, user: req.user, workspace: populated });

  res.status(200).json(populated);
});

export const getChannelMessages = catchAsync(async (req: AuthRequest, res: Response) => {
  const { workspaceId, channelId } = req.params;

  const messages = await WorkspaceMessage.find({ workspaceId, channelId })
    .populate("senderId", "fullName email profilePic status")
    .populate("replyTo")
    .sort({ createdAt: 1 });

  res.status(200).json(messages);
});

export const sendChannelMessage = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { workspaceId, channelId } = req.params;
  const { text, image, replyTo } = req.body;
  const senderId = req.user?._id;

  if (text && text.length > 1024) {
    return next(new AppError("Message must be 1024 characters or less", 400));
  }

  let imageUrl = "";
  if (image) {
    const uploadResponse = await cloudinary.uploader.upload(image);
    imageUrl = uploadResponse.secure_url;
  }

  let fileData = null;
  if (req.file) {
    const uploadResponse = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
      resource_type: "auto",
      public_id: `workspace_file_${Date.now()}_${req.file.originalname}`,
    });
    fileData = {
      url: uploadResponse.secure_url,
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
    };
  }

  const newMsg = new WorkspaceMessage({
    senderId,
    workspaceId,
    channelId,
    text: text || "",
    image: imageUrl,
    file: fileData,
    replyTo: replyTo || null,
  });

  await newMsg.save();
  const populated = await WorkspaceMessage.findById(newMsg._id)
    .populate("senderId", "fullName email profilePic status")
    .populate("replyTo");

  io.to(workspaceId.toString()).emit("newWorkspaceMessage", populated);

  res.status(201).json(populated);
});

export const addMessageReaction = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user?._id;

  const message = await WorkspaceMessage.findById(messageId);
  if (!message) return next(new AppError("Message not found", 404));

  if (!message.reactions) {
    message.reactions = new Map();
  }

  let userList = message.reactions.get(emoji) || [];
  if (!userList.includes(userId)) {
    userList.push(userId);
    message.reactions.set(emoji, userList);
    message.markModified("reactions");
    await message.save();
  }

  const updated = await WorkspaceMessage.findById(messageId)
    .populate("senderId", "fullName email profilePic status")
    .populate("replyTo");

  io.to(message.workspaceId.toString()).emit("workspaceReactionAdded", {
    messageId,
    reactions: Object.fromEntries(updated?.reactions as any),
    workspaceId: message.workspaceId,
    channelId: message.channelId,
  });

  res.status(200).json(updated);
});

export const removeMessageReaction = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user?._id;

  const message = await WorkspaceMessage.findById(messageId);
  if (!message) return next(new AppError("Message not found", 404));

  if (message.reactions && message.reactions.has(emoji)) {
    let userList = message.reactions.get(emoji) || [];
    const index = userList.indexOf(userId);
    if (index > -1) {
      userList.splice(index, 1);
      if (userList.length === 0) {
        message.reactions.delete(emoji);
      } else {
        message.reactions.set(emoji, userList);
      }
      message.markModified("reactions");
      await message.save();
    }
  }

  const updated = await WorkspaceMessage.findById(messageId)
    .populate("senderId", "fullName email profilePic status")
    .populate("replyTo");

  io.to(message.workspaceId.toString()).emit("workspaceReactionRemoved", {
    messageId,
    reactions: Object.fromEntries(updated?.reactions as any),
    workspaceId: message.workspaceId,
    channelId: message.channelId,
  });

  res.status(200).json(updated);
});

export const getPolls = catchAsync(async (req: AuthRequest, res: Response) => {
  const { workspaceId, channelId } = req.params;
  const polls = await WorkspacePoll.find({ workspaceId, channelId })
    .populate("creatorId", "fullName email profilePic")
    .sort({ createdAt: -1 });

  res.status(200).json(polls);
});

export const createPoll = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { workspaceId, channelId } = req.params;
  const { question, options } = req.body;
  const creatorId = req.user?._id;

  if (!question) return next(new AppError("Question is required", 400));
  if (!options || !Array.isArray(options) || options.length < 2) {
    return next(new AppError("At least two options are required", 400));
  }

  const newPoll = new WorkspacePoll({
    workspaceId,
    channelId,
    question,
    options: options.map((opt: any) => ({ text: opt, votes: [] })),
    creatorId,
  });

  await newPoll.save();
  const populated = await WorkspacePoll.findById(newPoll._id).populate("creatorId", "fullName email profilePic");

  io.to(workspaceId.toString()).emit("pollCreated", populated);

  res.status(201).json(populated);
});

export const voteInPoll = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { pollId } = req.params;
  const { optionId } = req.body;
  const userId = req.user?._id;

  const poll = await WorkspacePoll.findById(pollId);
  if (!poll) return next(new AppError("Poll not found", 404));

  poll.options.forEach(opt => {
    const userVoteIndex = opt.votes.indexOf(userId);
    if (opt._id && opt._id.toString() === optionId) {
      if (userVoteIndex > -1) {
        opt.votes.splice(userVoteIndex, 1);
      } else {
        opt.votes.push(userId);
      }
    } else {
      if (userVoteIndex > -1) {
        opt.votes.splice(userVoteIndex, 1);
      }
    }
  });

  await poll.save();
  const populated = await WorkspacePoll.findById(pollId).populate("creatorId", "fullName email profilePic");

  io.to(poll.workspaceId.toString()).emit("pollVoted", populated);

  res.status(200).json(populated);
});

export const getResources = catchAsync(async (req: AuthRequest, res: Response) => {
  const { workspaceId, channelId } = req.params;
  const resources = await WorkspaceResource.find({ workspaceId, channelId })
    .populate("uploadedBy", "fullName email profilePic")
    .sort({ createdAt: -1 });

  res.status(200).json(resources);
});

export const uploadResource = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { workspaceId, channelId } = req.params;
  const userId = req.user?._id;

  if (!req.file) return next(new AppError("No file uploaded", 400));

  const uploadResponse = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
    resource_type: "auto",
    public_id: `res_${Date.now()}_${req.file.originalname}`,
  });

  const newRes = new WorkspaceResource({
    workspaceId,
    channelId,
    name: req.file.originalname,
    url: uploadResponse.secure_url,
    type: req.file.mimetype,
    size: req.file.size,
    uploadedBy: userId,
  });

  await newRes.save();
  const populated = await WorkspaceResource.findById(newRes._id).populate("uploadedBy", "fullName email profilePic");

  io.to(workspaceId.toString()).emit("resourceUploaded", populated);

  res.status(201).json(populated);
});
