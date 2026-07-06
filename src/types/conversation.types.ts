import { PublicUser } from './user.types';
import { Message } from './message.types';

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  participant: PublicUser & { isOnline?: boolean; lastSeen?: string };
  lastMessage: Message | null;
}
