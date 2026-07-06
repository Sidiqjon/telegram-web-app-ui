import { api } from './api';
import { Message, MessageType } from '../types/message.types';

export interface MessagePage {
  messages: Message[];
  nextCursor: string | null;
}

export const messagesService = {
  async sendText(conversationId: string, text: string): Promise<Message> {
    const { data } = await api.post<Message>('/messages', { conversationId, text });
    return data;
  },

  async sendFile(
    conversationId: string,
    file: File,
    type: Extract<MessageType, 'IMAGE' | 'FILE'>,
  ): Promise<Message> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    formData.append('type', type);
    const { data } = await api.post<Message>('/messages/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /** Returns messages newest-first, plus the cursor to fetch the next (older) page. */
  async getHistory(conversationId: string, cursor?: string, limit = 20): Promise<MessagePage> {
    const { data } = await api.get<Message[]>(`/messages/conversation/${conversationId}`, {
      params: { cursor, limit },
    });
    const nextCursor = data.length === limit ? data[data.length - 1].id : null;
    return { messages: data, nextCursor };
  },

  async edit(messageId: string, text: string): Promise<Message> {
    const { data } = await api.patch<Message>(`/messages/${messageId}`, { text });
    return data;
  },

  async remove(messageId: string): Promise<Message> {
    const { data } = await api.delete<Message>(`/messages/${messageId}`);
    return data;
  },

  async markRead(conversationId: string): Promise<void> {
    await api.patch(`/messages/conversation/${conversationId}/read`);
  },
};
