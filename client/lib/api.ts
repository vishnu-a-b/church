import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Token refresh state management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

/**
 * Process all queued requests after token refresh
 * @param error - Error if refresh failed
 * @param token - New access token if refresh succeeded
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Clear authentication data and redirect to login
 */
const clearAuthAndRedirect = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // Redirect to login page
    window.location.href = '/login';
  }
};

/**
 * Validate token format
 * @param token - Token to validate
 * @returns true if token is valid format
 */
const isValidToken = (token: string | null): boolean => {
  if (!token) return false;
  if (token === 'undefined' || token === 'null') return false;
  if (token.length < 20) return false; // JWT tokens are much longer
  return true;
};

/**
 * Request interceptor to add access token to all requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken');

      // Validate token before using it
      if (!isValidToken(accessToken)) {
        // Clear invalid tokens
        if (accessToken) {
          console.warn('[API] Invalid token detected, clearing authentication');
          clearAuthAndRedirect();
          return Promise.reject(new Error('Invalid token detected. Please login again.'));
        }
        // No token, but request might be for public endpoint
        return config;
      }

      // Add valid token to request headers
      if (config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('[API] Request error:', error.message);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle token refresh on 401 errors
 * Implements a request queue to prevent multiple refresh attempts
 */
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Mark this request as retry to prevent infinite loops
      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      // No refresh token available - user needs to login
      if (!isValidToken(refreshToken)) {
        console.warn('[API] No valid refresh token available, redirecting to login');
        isRefreshing = false;
        processQueue(error, null);
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the access token
        console.log('[API] Access token expired, refreshing...');
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // Store new tokens
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Update default headers for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        console.log('[API] Token refreshed successfully');

        // Process all queued requests with new token
        processQueue(null, newAccessToken);

        // Retry the original request with new token
        return api(originalRequest);

      } catch (refreshError: any) {
        // Refresh token is invalid or expired
        console.error('[API] Token refresh failed:', refreshError.response?.data?.message || refreshError.message);

        processQueue(refreshError, null);
        clearAuthAndRedirect();

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

export default api;
