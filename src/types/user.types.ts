export interface User {
  id: string;
  phoneNumber: string;
  username: string;
  fullName: string;
  bio: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

/** Slim shape returned by /users/search and embedded in messages/conversations */
export interface PublicUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
}
