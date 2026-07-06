import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export const api = axios.create({ baseURL: BASE_URL });

// A separate, interceptor-free client used only for the refresh call itself —
// otherwise a failing refresh would trigger the response interceptor again
// and loop forever.
const refreshClient = axios.create({ baseURL: BASE_URL });

// Attach the access token to every outgoing request
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Refresh queueing -------------------------------------------------
// If several requests fail with 401 at the same time, we only want to hit
// /auth/refresh once; every other failed request waits for that single
// refresh to finish and then retries with the new token.
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingQueue = [];
}

/** Broadcast so the app (outside of this module) can clear auth state and redirect. */
function emitSessionExpired() {
  window.dispatchEvent(new CustomEvent('auth:session-expired'));
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to "refresh" the refresh endpoint itself
    if (originalRequest.url?.includes('/auth/refresh')) {
      tokenStorage.clear();
      emitSessionExpired();
      return Promise.reject(error);
    }

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      emitSessionExpired();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Wait in line for the in-flight refresh to finish
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await refreshClient.post('/auth/refresh', { refreshToken });
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      flushQueue(null, data.accessToken);
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      tokenStorage.clear();
      emitSessionExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
