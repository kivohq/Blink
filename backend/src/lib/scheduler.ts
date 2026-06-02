import cron from 'node-cron';
import ScheduledMessage from '../models/scheduledMessage.model.js';
import WorkspaceMessage from '../models/workspaceMessage.model.js';
import { io } from '../lib/socket.js';

export const startMessageScheduler = () => {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const messages = await ScheduledMessage.find({ scheduledAt: { $lte: now }, isSent: false });

    for (const msg of messages) {
      const workspaceMsg = new WorkspaceMessage({
        senderId: msg.senderId,
        workspaceId: msg.workspaceId,
        channelId: msg.channelId,
        text: msg.text,
      });

      await workspaceMsg.save();
      await ScheduledMessage.findByIdAndUpdate(msg._id, { isSent: true });

      io.to(msg.workspaceId.toString()).emit("newWorkspaceMessage", workspaceMsg);
    }
  });
};
