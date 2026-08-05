import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  clearAuthData,
  isValidTokenFormat,
} from './authStorage';

// Point this at the same backend the web client's NEXT_PUBLIC_API_URL points to.
// Override at build time via app.config.js / EAS env if the backend host differs
// per environment.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

const refreshStates: Record<string, { isRefreshing: boolean; queue: Array<{ resolve: (t?: string) => void; reject: (e: any) => void }> }> = {};

const getRefreshState = (role: string) => {
  if (!refreshStates[role]) {
    refreshStates[role] = { isRefreshing: false, queue: [] };
  }
  return refreshStates[role];
};

const processQueue = (role: string, error: any, token?: string) => {
  const state = getRefreshState(role);
  state.queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  state.queue = [];
};

// One logout callback per role, wired up by AuthContext so a forced logout
// (invalid/expired refresh token) can clear the app's auth state, not just storage.
const onForcedLogout: Record<string, (() => void) | undefined> = {};
export const registerForcedLogoutHandler = (role: string, handler: () => void) => {
  onForcedLogout[role] = handler;
};

export function createRoleApi(role: 'member' | 'donor'): AxiosInstance {
  const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' }, timeout: 30000 });

  api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken(role);
    if (isValidTokenFormat(token) && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest: any = error.config;
      const state = getRefreshState(role);

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (state.isRefreshing) {
          return new Promise((resolve, reject) => {
            state.queue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          });
        }

        originalRequest._retry = true;
        state.isRefreshing = true;

        const refreshToken = await getRefreshToken(role);
        if (!isValidTokenFormat(refreshToken)) {
          state.isRefreshing = false;
          processQueue(role, error);
          await clearAuthData(role);
          onForcedLogout[role]?.();
          return Promise.reject(error);
        }

        try {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          const { accessToken: newAccessToken } = response.data;
          await setAccessToken(role, newAccessToken);
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          processQueue(role, null, newAccessToken);
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(role, refreshError);
          await clearAuthData(role);
          onForcedLogout[role]?.();
          return Promise.reject(refreshError);
        } finally {
          state.isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return api;
}
