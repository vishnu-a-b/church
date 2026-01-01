import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Token refresh state management (per role)
const refreshStates: {
  [role: string]: {
    isRefreshing: boolean;
    failedQueue: Array<{
      resolve: (value?: any) => void;
      reject: (reason?: any) => void;
    }>;
  };
} = {};

/**
 * Get or create refresh state for a role
 */
const getRefreshState = (role: string) => {
  if (!refreshStates[role]) {
    refreshStates[role] = {
      isRefreshing: false,
      failedQueue: [],
    };
  }
  return refreshStates[role];
};

/**
 * Process all queued requests after token refresh
 */
const processQueue = (role: string, error: any, token: string | null = null) => {
  const state = getRefreshState(role);
  state.failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  state.failedQueue = [];
};

/**
 * Validate token format
 */
const isValidToken = (token: string | null): boolean => {
  if (!token) return false;
  if (token === 'undefined' || token === 'null') return false;
  if (token.length < 20) return false;
  return true;
};

/**
 * Map role names to their URL paths
 */
const getRoleLoginPath = (role: string): string => {
  const rolePathMap: Record<string, string> = {
    'super_admin': '/super-admin',
    'church_admin': '/church-admin',
    'unit_admin': '/unit-admin',
    'kudumbakutayima_admin': '/kutayima-admin',
    'member': '/member-login'
  };
  return rolePathMap[role] || `/${role}`;
};

/**
 * Clear authentication data and redirect to login
 */
const clearAuthAndRedirect = (role: string, getStorageKey: (key: string) => string) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(getStorageKey('accessToken'));
    localStorage.removeItem(getStorageKey('refreshToken'));
    localStorage.removeItem(getStorageKey('user'));

    // Redirect to role-specific login page
    window.location.href = getRoleLoginPath(role);
  }
};

// Create role-specific API client
export function createRoleApi(role: string): AxiosInstance {
  const roleApi = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  const getStorageKey = (key: string) => `${role}_${key}`;

  // Request interceptor to add role-specific access token
  roleApi.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem(getStorageKey('accessToken'));
        console.log(`[${role} API]`, config.method?.toUpperCase(), config.url);
        console.log(`[${role} API] Token length:`, accessToken?.length);

        // Validate token before using it
        if (!isValidToken(accessToken)) {
          if (accessToken) {
            console.error(`[${role} API] 🚨 INVALID TOKEN DETECTED!`);
            clearAuthAndRedirect(role, getStorageKey);
            return Promise.reject(new Error('Invalid token detected. Please login again.'));
          }
          return config;
        }

        if (config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor with automatic token refresh
  roleApi.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest: any = error.config;
      const state = getRefreshState(role);

      // Handle 401 Unauthorized errors (token expired)
      if (error.response?.status === 401 && !originalRequest._retry) {

        // If already refreshing, queue this request
        if (state.isRefreshing) {
          return new Promise((resolve, reject) => {
            state.failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return roleApi(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        // Mark this request as retry to prevent infinite loops
        originalRequest._retry = true;
        state.isRefreshing = true;

        const refreshToken = localStorage.getItem(getStorageKey('refreshToken'));

        // No refresh token available - user needs to login
        if (!isValidToken(refreshToken)) {
          console.warn(`[${role} API] No valid refresh token available, redirecting to login`);
          state.isRefreshing = false;
          processQueue(role, error, null);
          clearAuthAndRedirect(role, getStorageKey);
          return Promise.reject(error);
        }

        try {
          // Attempt to refresh the access token
          console.log(`[${role} API] Access token expired, refreshing...`);
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

          // Store new tokens
          localStorage.setItem(getStorageKey('accessToken'), newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem(getStorageKey('refreshToken'), newRefreshToken);
          }

          // Update headers for this request
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

          console.log(`[${role} API] Token refreshed successfully`);

          // Process all queued requests with new token
          processQueue(role, null, newAccessToken);

          // Retry the original request with new token
          return roleApi(originalRequest);

        } catch (refreshError: any) {
          // Refresh token is invalid or expired
          console.error(`[${role} API] Token refresh failed:`, refreshError.response?.data?.message || refreshError.message);

          processQueue(role, refreshError, null);
          clearAuthAndRedirect(role, getStorageKey);

          return Promise.reject(refreshError);
        } finally {
          state.isRefreshing = false;
        }
      }

      // Handle other errors
      return Promise.reject(error);
    }
  );

  return roleApi;
}
