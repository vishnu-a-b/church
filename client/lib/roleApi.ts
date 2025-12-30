import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create role-specific API client
export function createRoleApi(role: string): AxiosInstance {
  const roleApi = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const getStorageKey = (key: string) => `${role}_${key}`;

  // Request interceptor to add role-specific access token
  roleApi.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem(getStorageKey('accessToken'));
        console.log(`[${role} API]`, config.method?.toUpperCase(), config.url);
        console.log(`[${role} API] Token length:`, accessToken?.length);

        // Detect and clear invalid tokens
        if (accessToken && (accessToken === 'undefined' || accessToken === 'null' || accessToken.length < 20)) {
          console.error(`[${role} API] 🚨 INVALID TOKEN DETECTED!`);
          localStorage.removeItem(getStorageKey('accessToken'));
          localStorage.removeItem(getStorageKey('refreshToken'));
          localStorage.removeItem(getStorageKey('user'));
          return Promise.reject(new Error('Invalid token detected. Please login again.'));
        }

        if (accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling
  roleApi.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        console.error(`[${role} API] 401 Unauthorized - clearing session`);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(getStorageKey('accessToken'));
          localStorage.removeItem(getStorageKey('refreshToken'));
          localStorage.removeItem(getStorageKey('user'));
        }
      }
      return Promise.reject(error);
    }
  );

  return roleApi;
}
