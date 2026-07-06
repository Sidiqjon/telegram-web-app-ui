import { PublicUser } from './user.types';

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE';
export type MessageStatusValue = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ';

export interface MessageStatusEntry {
  id: string;
  messageId: string;
  userId: string;
  status: MessageStatusValue;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string | null;
  fileUrl: string | null;
  filePublicId?: string | null;
  type: MessageType;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: PublicUser;
  statuses?: MessageStatusEntry[];
  /** Client-only flag for optimistic messages still in flight */
  isSending?: boolean;
  /** Client-only temp id used before the server assigns a real id */
  clientTempId?: string;
}
