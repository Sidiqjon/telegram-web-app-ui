import { User } from './user.types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface RegisterPayload {
  phoneNumber: string;
  username: string;
  fullName: string;
  password: string;
}

export interface LoginPayload {
  phoneNumber: string;
  password: string;
}
