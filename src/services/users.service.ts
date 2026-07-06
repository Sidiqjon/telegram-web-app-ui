import { api } from './api';
import { PublicUser, User } from '../types/user.types';

export interface UpdateProfilePayload {
  fullName?: string;
  username?: string;
  bio?: string;
}

export const usersService = {
  async search(username: string): Promise<PublicUser[]> {
    if (!username.trim()) return [];
    const { data } = await api.get<PublicUser[]>('/users/search', { params: { username } });
    return data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const { data } = await api.patch<User>('/users/me', payload);
    return data;
  },

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await api.post<User>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteAvatar(): Promise<User> {
    const { data } = await api.delete<User>('/users/me/avatar');
    return data;
  },
};
