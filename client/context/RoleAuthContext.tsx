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
    const initAuth = () => {
      console.log(`[${role}] Initializing auth...`);
      if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem(getStorageKey('accessToken'));
        const savedUser = localStorage.getItem(getStorageKey('user'));

        console.log(`[${role}] Token exists:`, !!accessToken);
        console.log(`[${role}] Token length:`, accessToken?.length);

        // Detect and clear invalid tokens
        if (accessToken && (accessToken === 'undefined' || accessToken === 'null' || accessToken.length < 20)) {
          console.error(`[${role}] ⚠️ INVALID TOKEN DETECTED! Clearing...`);
          localStorage.removeItem(getStorageKey('user'));
          localStorage.removeItem(getStorageKey('accessToken'));
          localStorage.removeItem(getStorageKey('refreshToken'));
          setLoading(false);
          return;
        }

        if (accessToken && savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            console.log(`[${role}] Setting user:`, parsedUser.email, parsedUser.role);

            // Validate user role matches expected role
            if (expectedRole && parsedUser.role !== expectedRole) {
              console.error(`[${role}] Role mismatch! Expected ${expectedRole}, got ${parsedUser.role}`);
              localStorage.removeItem(getStorageKey('user'));
              localStorage.removeItem(getStorageKey('accessToken'));
              localStorage.removeItem(getStorageKey('refreshToken'));
              setLoading(false);
              return;
            }

            setUser(parsedUser);
            setTimeout(() => {
              console.log(`[${role}] Auth loading complete`);
              setLoading(false);
            }, 50);
            return;
          } catch (error) {
            console.error(`[${role}] Error parsing saved user:`, error);
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
