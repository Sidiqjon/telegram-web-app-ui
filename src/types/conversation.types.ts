import { PublicUser } from './user.types';
import { Message } from './message.types';

export interface ConversationParticipant extends PublicUser {
  bio: string | null;
  phoneNumber: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  participant: ConversationParticipant;
  lastMessage: Message | null;
}