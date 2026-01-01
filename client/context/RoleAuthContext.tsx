'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createRoleApi } from '@/lib/roleApi';
import { User, AuthResponse } from '@/types';

// Role-based AuthContext - supports multiple role sessions in different tabs
console.log('🔄 RoleAuthContext loaded - Multi-role session support');

interface RoleAuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  role: string;
}

const RoleAuthContext = createContext<RoleAuthContextType | undefined>(undefined);

interface RoleAuthProviderProps {
  children: ReactNode;
  role: 'super_admin' | 'church_admin' | 'unit_admin' | 'kudumbakutayima_admin' | 'member';
  expectedRole?: string; // For validation
}

export function RoleAuthProvider({ children, role, expectedRole }: RoleAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Role-specific API client
  const api = createRoleApi(role);

  // Role-specific localStorage keys
  const getStorageKey = (key: string) => `${role}_${key}`;

  useEffect(() => {
    const initAuth = async () => {
      console.log(`[${role}] Initializing auth...`);
      if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem(getStorageKey('accessToken'));
        const refreshToken = localStorage.getItem(getStorageKey('refreshToken'));
        const savedUser = localStorage.getItem(getStorageKey('user'));

        console.log(`[${role}] Access token exists:`, !!accessToken);
        console.log(`[${role}] Refresh token exists:`, !!refreshToken);

        // Detect and clear invalid tokens
        if (accessToken && (accessToken === 'undefined' || accessToken === 'null' || accessToken.length < 20)) {
          console.error(`[${role}] ⚠️ INVALID ACCESS TOKEN DETECTED! Clearing...`);
          localStorage.removeItem(getStorageKey('user'));
          localStorage.removeItem(getStorageKey('accessToken'));
          localStorage.removeItem(getStorageKey('refreshToken'));
          setLoading(false);
          return;
        }

        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);

            // Validate user role matches expected role
            if (expectedRole && parsedUser.role !== expectedRole) {
              console.error(`[${role}] Role mismatch! Expected ${expectedRole}, got ${parsedUser.role}`);
              localStorage.removeItem(getStorageKey('user'));
              localStorage.removeItem(getStorageKey('accessToken'));
              localStorage.removeItem(getStorageKey('refreshToken'));
              setLoading(false);
              return;
            }

            // If we have a refresh token, try to verify/refresh the access token
            if (refreshToken && (!accessToken || accessToken.length < 20)) {
              console.log(`[${role}] Access token missing or invalid, attempting refresh...`);
              try {
                const response = await api.post('/auth/refresh-token', { refreshToken });
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

                // Store new tokens
                localStorage.setItem(getStorageKey('accessToken'), newAccessToken);
                if (newRefreshToken) {
                  localStorage.setItem(getStorageKey('refreshToken'), newRefreshToken);
                }

                console.log(`[${role}] Token refreshed successfully on init`);
                setUser(parsedUser);
                setLoading(false);
                return;
              } catch (refreshError) {
                console.error(`[${role}] Token refresh failed on init:`, refreshError);
                // Clear everything and require re-login
                localStorage.removeItem(getStorageKey('user'));
                localStorage.removeItem(getStorageKey('accessToken'));
                localStorage.removeItem(getStorageKey('refreshToken'));
                setLoading(false);
                return;
              }
            }

            // If we have both access token and user, verify it's still valid
            if (accessToken && refreshToken) {
              console.log(`[${role}] Have both tokens, attempting token verification...`);

              // First, just set the user - let the interceptor handle token refresh when needed
              setUser(parsedUser);
              setLoading(false);

              // Optionally verify token in background (non-blocking)
              api.get('/auth/me')
                .then(() => {
                  console.log(`[${role}] Token verified successfully in background`);
                })
                .catch((verifyError: any) => {
                  console.log(`[${role}] Background token verification failed:`, verifyError.message);
                  // If this fails, it means token refresh also failed
                  // The interceptor will have already redirected to login if needed
                });

              return;
            }

            // If we have access token but no refresh token, just set user
            if (accessToken) {
              console.log(`[${role}] Setting user:`, parsedUser.email, parsedUser.role);
              setUser(parsedUser);
              setTimeout(() => {
                console.log(`[${role}] Auth loading complete`);
                setLoading(false);
              }, 50);
              return;
            }
          } catch (error) {
            console.error(`[${role}] Error during auth init:`, error);
            localStorage.removeItem(getStorageKey('user'));
            localStorage.removeItem(getStorageKey('accessToken'));
            localStorage.removeItem(getStorageKey('refreshToken'));
          }
        }
      }
      console.log(`[${role}] No auth found, loading complete`);
      setLoading(false);
    };

    initAuth();
  }, [role, expectedRole]);

  const login = async (email: string, password: string) => {
    try {
      // Use member-login endpoint which searches Member model
      const response = await api.post<AuthResponse>('/auth/member-login', {
        username: email, // Send as username (backend accepts email or username)
        password
      });

      console.log(`[${role}] Full response:`, response);
      console.log(`[${role}] Response data:`, response.data);

      const { accessToken, refreshToken, user } = response.data;

      console.log(`[${role}] Login successful`);
      console.log(`[${role}] Access token length:`, accessToken?.length);

      // Validate tokens before storing
      if (!accessToken || accessToken === 'undefined' || typeof accessToken !== 'string' || accessToken.length < 20) {
        console.error(`[${role}] Invalid accessToken received!`, accessToken);
        return {
          success: false,
          error: 'Invalid token received from server',
        };
      }

      if (!refreshToken || refreshToken === 'undefined' || typeof refreshToken !== 'string' || refreshToken.length < 20) {
        console.error(`[${role}] Invalid refreshToken received!`, refreshToken);
        return {
          success: false,
          error: 'Invalid refresh token received from server',
        };
      }

      // Validate user role matches expected role
      if (expectedRole && user.role !== expectedRole) {
        console.error(`[${role}] Role mismatch! Expected ${expectedRole}, got ${user.role}`);
        return {
          success: false,
          error: `This login is for ${expectedRole} only. You are: ${user.role}`,
        };
      }

      console.log(`[${role}] 📝 Storing tokens and user...`);
      console.log(`[${role}] User object:`, user);

      localStorage.setItem(getStorageKey('accessToken'), accessToken);
      localStorage.setItem(getStorageKey('refreshToken'), refreshToken);
      localStorage.setItem(getStorageKey('user'), JSON.stringify(user));

      // Verify it was saved
      const savedToken = localStorage.getItem(getStorageKey('accessToken'));
      const savedUser = localStorage.getItem(getStorageKey('user'));
      console.log(`[${role}] ✅ Verified saved token length:`, savedToken?.length);
      console.log(`[${role}] ✅ Verified saved user:`, savedUser);

      setUser(user);

      return { success: true, user };
    } catch (error: any) {
      console.error(`[${role}] Login error:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || 'Login failed',
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error(`[${role}] Logout error:`, error);
    } finally {
      localStorage.removeItem(getStorageKey('accessToken'));
      localStorage.removeItem(getStorageKey('refreshToken'));
      localStorage.removeItem(getStorageKey('user'));
      setUser(null);
    }
  };

  const value: RoleAuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    role,
  };

  return <RoleAuthContext.Provider value={value}>{children}</RoleAuthContext.Provider>;
}

export function useRoleAuth() {
  const context = useContext(RoleAuthContext);
  if (!context) {
    throw new Error('useRoleAuth must be used within RoleAuthProvider');
  }
  return context;
}
