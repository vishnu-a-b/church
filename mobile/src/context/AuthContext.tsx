import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { API_URL, registerForcedLogoutHandler } from '../lib/api';
import { UserData, getUserData, setAuthData, clearAuthData } from '../lib/authStorage';

export type PortalRole = 'member' | 'donor';

interface AuthContextValue {
  activeRole: PortalRole | null;
  user: UserData | null;
  loading: boolean;
  selectRole: (role: PortalRole | null) => void;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// A single provider mounted once at the app root. `activeRole` tracks which portal
// (Member or Donor) the user picked — each keeps its own SecureStore-backed session
// (see authStorage.ts's role-scoped keys), matching the web client's per-role login.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRoleState] = useState<PortalRole | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeRole) return;
    registerForcedLogoutHandler(activeRole, () => setUser(null));
  }, [activeRole]);

  const selectRole = useCallback((role: PortalRole | null) => {
    setActiveRoleState(role);
    if (!role) {
      setUser(null);
      return;
    }
    setLoading(true);
    getUserData(role)
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      if (!activeRole) return { success: false, error: 'No portal selected' };
      try {
        const endpoint = activeRole === 'member' ? '/auth/member-login' : '/auth/donor-login';
        const response = await axios.post(`${API_URL}${endpoint}`, { username, password });
        const { accessToken, refreshToken, user: userData } = response.data;
        await setAuthData(activeRole, accessToken, refreshToken, userData);
        setUser(userData);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.response?.data?.error || 'Login failed' };
      }
    },
    [activeRole]
  );

  const logout = useCallback(async () => {
    if (!activeRole) return;
    await clearAuthData(activeRole);
    setUser(null);
    setActiveRoleState(null);
  }, [activeRole]);

  return (
    <AuthContext.Provider value={{ activeRole, user, loading, selectRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
