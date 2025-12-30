'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { User, LoginCredentials, RegisterData, AuthResponse } from '@/types';

// VERSION 2.0 - WITH TOKEN VALIDATION
console.log('🔄 AuthContext loaded - VERSION 2.0 with token validation');

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const initAuth = () => {
      console.log('[AuthContext] Initializing auth...');
      if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem('accessToken');
        const savedUser = localStorage.getItem('user');

        console.log('[AuthContext] Token exists:', !!accessToken);
        console.log('[AuthContext] Token value:', accessToken);
        console.log('[AuthContext] Token length:', accessToken?.length);
        console.log('[AuthContext] Saved user exists:', !!savedUser);

        // Detect and clear invalid tokens
        if (accessToken && (accessToken === 'undefined' || accessToken === 'null' || accessToken.length < 20)) {
          console.error('[AuthContext] ⚠️ INVALID TOKEN DETECTED! Clearing localStorage...', accessToken);
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          console.log('[AuthContext] ✅ Invalid tokens cleared');
          setLoading(false);
          return;
        }

        if (accessToken && savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            console.log('[AuthContext] Setting user:', parsedUser.email, parsedUser.role);
            setUser(parsedUser);
            // Small delay to ensure state is updated before setting loading to false
            setTimeout(() => {
              console.log('[AuthContext] Auth loading complete');
              setLoading(false);
            }, 50);
            return;
          } catch (error) {
            console.error('[AuthContext] Error parsing saved user:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        }
      }
      console.log('[AuthContext] No auth found, loading complete');
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Use member-login endpoint which searches Member model
      const response = await api.post<AuthResponse>('/auth/member-login', {
        username: email, // Send as username (backend accepts email or username)
        password
      });
      console.log(response)
      console.log('[AuthContext] Full response:', response);
      console.log('[AuthContext] Response data:', response.data);

      const { accessToken, refreshToken, user } = response.data;

      console.log('[AuthContext] Login successful');
      console.log('[AuthContext] Access token:', accessToken);
      console.log('[AuthContext] Access token length:', accessToken?.length);
      console.log('[AuthContext] Access token type:', typeof accessToken);
      console.log('[AuthContext] Refresh token length:', refreshToken?.length);

      // Validate tokens before storing
      if (!accessToken || accessToken === 'undefined' || typeof accessToken !== 'string' || accessToken.length < 20) {
        console.error('[AuthContext] Invalid accessToken received!', accessToken);
        return {
          success: false,
          error: 'Invalid token received from server',
        };
      }

      if (!refreshToken || refreshToken === 'undefined' || typeof refreshToken !== 'string' || refreshToken.length < 20) {
        console.error('[AuthContext] Invalid refreshToken received!', refreshToken);
        return {
          success: false,
          error: 'Invalid refresh token received from server',
        };
      }

      console.log('[AuthContext] 📝 Storing tokens and user...');
      console.log('[AuthContext] User object from response:', user);
      console.log('[AuthContext] User stringified:', JSON.stringify(user));

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Verify it was saved
      const savedToken = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('user');
      console.log('[AuthContext] ✅ Verified saved token length:', savedToken?.length);
      console.log('[AuthContext] ✅ Verified saved user:', savedUser);

      setUser(user);

      return { success: true, user };
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error);
      console.error('[AuthContext] Error response:', error.response);
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || 'Login failed',
      };
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', userData);
      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      return { success: true, user };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
