import Dexie, { Table } from 'dexie';
import { IMessage, IUser } from '../types';

export interface PendingAction {
  id?: number;
  type: 'sendMessage' | 'addReaction' | 'deleteMessage';
  payload: any;
  timestamp: number;
}

export class ChatDatabase extends Dexie {
  messages!: Table<IMessage, string>;
  users!: Table<IUser, string>;
  pendingActions!: Table<PendingAction, number>;

  constructor() {
    super('BlinkChatDB');
    this.version(1).stores({
      messages: '++_id, senderId, receiverId, channelId, createdAt',
      users: '_id, username, email',
      pendingActions: '++id, type, timestamp'
    });
  }
}

export const db = new ChatDatabase();
