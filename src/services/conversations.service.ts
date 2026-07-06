import { api } from './api';
import { Conversation } from '../types/conversation.types';

export const conversationsService = {
  async findOrCreate(participantId: string): Promise<Conversation> {
    const { data } = await api.post<Conversation>('/conversations', { participantId });
    return data;
  },

  async list(): Promise<Conversation[]> {
    const { data } = await api.get<Conversation[]>('/conversations');
    return data;
  },
};
