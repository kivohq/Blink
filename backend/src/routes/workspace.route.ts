import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getWorkspaces,
  createWorkspace,
  deleteWorkspace,
  promoteToAdmin,
  demoteFromAdmin,
  createChannel,
  joinWorkspace,
  getChannelMessages,
  sendChannelMessage,
  addMessageReaction,
  removeMessageReaction,
  togglePinWorkspaceMessage,
  getThreadMessages,
  replyInThread,
  getPolls,
  createPoll,
  voteInPoll,
  getResources,
  uploadResource,
  workspaceUpload,
} from "../controllers/workspace.controller.js";

const router = express.Router();

router.get("/", protectRoute, getWorkspaces);
router.post("/", protectRoute, createWorkspace);
router.delete("/:workspaceId", protectRoute, deleteWorkspace);
router.put("/:workspaceId/promote/:userId", protectRoute, promoteToAdmin);
router.put("/:workspaceId/demote/:userId", protectRoute, demoteFromAdmin);
router.post("/:workspaceId/channels", protectRoute, createChannel);
router.post("/:workspaceId/join", protectRoute, joinWorkspace);

router.get("/:workspaceId/messages/:channelId", protectRoute, getChannelMessages);
router.post("/:workspaceId/messages/:channelId", protectRoute, workspaceUpload, sendChannelMessage);
router.patch("/messages/:messageId/pin", protectRoute, togglePinWorkspaceMessage);
router.get("/messages/:messageId/thread", protectRoute, getThreadMessages);
router.post("/messages/:messageId/thread", protectRoute, workspaceUpload, replyInThread);
router.post("/messages/:messageId/reaction/add", protectRoute, addMessageReaction);
router.post("/messages/:messageId/reaction/remove", protectRoute, removeMessageReaction);

router.get("/:workspaceId/polls/:channelId", protectRoute, getPolls);
router.post("/:workspaceId/polls/:channelId", protectRoute, createPoll);
router.post("/polls/:pollId/vote", protectRoute, voteInPoll);

router.get("/:workspaceId/resources/:channelId", protectRoute, getResources);
router.post("/:workspaceId/resources/:channelId", protectRoute, workspaceUpload, uploadResource);

export default router;
