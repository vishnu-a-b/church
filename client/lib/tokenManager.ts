/**
 * Token Management Utilities
 * Centralized token storage and validation
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserData {
  _id: string;
  username: string;
  email?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  churchId?: string;
  unitId?: string;
}

/**
 * Storage keys for localStorage
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
} as const;

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Get user data from localStorage
 */
export const getUserData = (): UserData | null => {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as UserData;
  } catch (error) {
    console.error('[TokenManager] Failed to parse user data:', error);
    return null;
  }
};

/**
 * Set access token in localStorage
 */
export const setAccessToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
};

/**
 * Set refresh token in localStorage
 */
export const setRefreshToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
};

/**
 * Set user data in localStorage
 */
export const setUserData = (user: UserData): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

/**
 * Set all auth tokens and user data
 */
export const setAuthData = (tokens: AuthTokens, user: UserData): void => {
  setAccessToken(tokens.accessToken);
  setRefreshToken(tokens.refreshToken);
  setUserData(user);
};

/**
 * Clear all authentication data
 */
export const clearAuthData = (): void => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
};

/**
 * Check if user is authenticated (has valid tokens)
 */
export const isAuthenticated = (): boolean => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  return !!(accessToken && refreshToken);
};

/**
 * Validate token format (basic check)
 */
export const isValidTokenFormat = (token: string | null): boolean => {
  if (!token) return false;
  if (token === 'undefined' || token === 'null') return false;
  if (token.length < 20) return false; // JWT tokens are much longer

  // Check if it looks like a JWT (has 3 parts separated by dots)
  const parts = token.split('.');
  return parts.length === 3;
};

/**
 * Decode JWT payload (without verification - only for reading claims)
 * WARNING: This does NOT verify the token signature!
 */
export const decodeJWT = (token: string): any | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));

    return JSON.parse(decoded);
  } catch (error) {
    console.error('[TokenManager] Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param token - JWT token to check
 * @returns true if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();

  // Add 30 second buffer to refresh before actual expiry
  return currentTime >= (expirationTime - 30000);
};

/**
 * Get token expiration time
 * @param token - JWT token
 * @returns Date object of expiration time, or null if invalid
 */
export const getTokenExpiration = (token: string): Date | null => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return null;

  return new Date(payload.exp * 1000);
};

/**
 * Get time until token expires (in milliseconds)
 * @param token - JWT token
 * @returns milliseconds until expiration, or 0 if expired/invalid
 */
export const getTimeUntilExpiry = (token: string): number => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return 0;

  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();

  return Math.max(0, expirationTime - currentTime);
};

/**
 * Get user role from stored user data
 */
export const getUserRole = (): string | null => {
  const user = getUserData();
  return user?.role || null;
};

/**
 * Check if user has specific role
 */
export const hasRole = (role: string): boolean => {
  const userRole = getUserRole();
  return userRole === role;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (roles: string[]): boolean => {
  const userRole = getUserRole();
  return roles.includes(userRole || '');
};

/**
 * Check if user is admin (super_admin or church_admin)
 */
export const isAdmin = (): boolean => {
  return hasAnyRole(['super_admin', 'church_admin']);
};

/**
 * Log out user (clear tokens and redirect)
 */
export const logout = (): void => {
  clearAuthData();

  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};
