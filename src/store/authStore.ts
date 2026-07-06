import { create } from 'zustand';
import { authService } from '../services/auth.service';
import { tokenStorage } from '../utils/tokenStorage';
import { socketService } from '../services/socket.service';
import { User } from '../types/user.types';
import { LoginPayload, RegisterPayload } from '../types/auth.types';

interface AuthState {
  user: User | null;
  isInitializing: boolean; // true while we attempt auto-login from a stored token
  isSubmitting: boolean; // true during login/register requests
  error: string | null;

  initialize: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

function extractErrorMessage(error: unknown): string {
  const anyError = error as any;
  return anyError?.response?.data?.message ?? 'Something went wrong. Please try again.';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isInitializing: true,
  isSubmitting: false,
  error: null,

  initialize: async () => {
    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) {
      set({ isInitializing: false });
      return;
    }
    try {
      const user = await authService.me();
      set({ user, isInitializing: false });
      socketService.connect(tokenStorage.getAccessToken()!);
    } catch {
      tokenStorage.clear();
      set({ user: null, isInitializing: false });
    }
  },

  login: async (payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const { user, accessToken, refreshToken } = await authService.login(payload);
      tokenStorage.setTokens(accessToken, refreshToken);
      set({ user, isSubmitting: false });
      socketService.connect(accessToken);
    } catch (error) {
      set({ isSubmitting: false, error: extractErrorMessage(error) });
      throw error;
    }
  },

  register: async (payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const { user, accessToken, refreshToken } = await authService.register(payload);
      tokenStorage.setTokens(accessToken, refreshToken);
      set({ user, isSubmitting: false });
      socketService.connect(accessToken);
    } catch (error) {
      set({ isSubmitting: false, error: extractErrorMessage(error) });
      throw error;
    }
  },

  logout: async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } catch {
      // Ignore — we're logging out locally regardless
    }
    tokenStorage.clear();
    socketService.disconnect();
    set({ user: null });
  },

  setUser: (user) => set({ user }),
  clearError: () => set({ error: null }),
}));

// The API layer emits this when a refresh attempt fails — clear local state
// and let ProtectedRoute redirect to /login.
window.addEventListener('auth:session-expired', () => {
  tokenStorage.clear();
  socketService.disconnect();
  useAuthStore.setState({ user: null, isInitializing: false });
});
