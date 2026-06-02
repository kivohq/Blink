import { db } from './db';
import { axiosInstance } from './axios';

export const SyncService = {
  async processPendingActions() {
    const actions = await db.pendingActions.toArray();
    if (actions.length === 0) return;

    // Sort by timestamp
    actions.sort((a, b) => a.timestamp - b.timestamp);

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'sendMessage':
            // Logic to send message via axios
            await axiosInstance.post('/messages/send', action.payload);
            break;
          // Add other action handlers
        }
        await db.pendingActions.delete(action.id!);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
        // Break to avoid blocking queue
        break;
      }
    }
  },

  async queueAction(type: PendingAction['type'], payload: any) {
    await db.pendingActions.add({
      type,
      payload,
      timestamp: Date.now()
    });
    // Trigger sync
    if (navigator.onLine) {
        this.processPendingActions();
    }
  }
};
