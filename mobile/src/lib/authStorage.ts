import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Mirrors client/lib/tokenManager.ts, swapping localStorage for expo-secure-store.
// Storage keys are role-scoped so a Member and Donor session can coexist on the
// same device (matches the web client's per-role localStorage key convention).

// expo-secure-store has no web implementation (it wraps Keychain/Keystore, which
// don't exist in a browser) — fall back to localStorage there, same as the web client.
const webStorage = {
  getItemAsync: async (key: string) => (typeof window === 'undefined' ? null : window.localStorage.getItem(key)),
  setItemAsync: async (key: string, value: string) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  },
  deleteItemAsync: async (key: string) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
  },
};

const Storage = Platform.OS === 'web' ? webStorage : SecureStore;

export type AppRole = 'member' | 'donor' | 'church_admin' | 'unit_admin' | 'kudumbakutayima_admin';

export interface UserData {
  id: string;
  username: string;
  email?: string;
  role: AppRole;
  firstName?: string;
  lastName?: string;
  churchId?: string;
  unitId?: string;
  bavanakutayimaId?: string;
  houseId?: string;
}

const keyFor = (role: string, key: string) => `${role}_${key}`;

export const getAccessToken = (role: string) => Storage.getItemAsync(keyFor(role, 'accessToken'));
export const getRefreshToken = (role: string) => Storage.getItemAsync(keyFor(role, 'refreshToken'));

export const getUserData = async (role: string): Promise<UserData | null> => {
  const raw = await Storage.getItemAsync(keyFor(role, 'user'));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserData;
  } catch {
    return null;
  }
};

export const setAuthData = async (role: string, accessToken: string, refreshToken: string, user: UserData) => {
  await Storage.setItemAsync(keyFor(role, 'accessToken'), accessToken);
  await Storage.setItemAsync(keyFor(role, 'refreshToken'), refreshToken);
  await Storage.setItemAsync(keyFor(role, 'user'), JSON.stringify(user));
};

export const setAccessToken = (role: string, token: string) => Storage.setItemAsync(keyFor(role, 'accessToken'), token);

export const clearAuthData = async (role: string) => {
  await Storage.deleteItemAsync(keyFor(role, 'accessToken'));
  await Storage.deleteItemAsync(keyFor(role, 'refreshToken'));
  await Storage.deleteItemAsync(keyFor(role, 'user'));
};

const ACTIVE_ROLE_KEY = 'activeRole';
export const getStoredRole = async (): Promise<AppRole | null> => {
  const r = await Storage.getItemAsync(ACTIVE_ROLE_KEY);
  return (r as AppRole) || null;
};
export const setStoredRole = (role: AppRole) => Storage.setItemAsync(ACTIVE_ROLE_KEY, role);
export const clearStoredRole = () => Storage.deleteItemAsync(ACTIVE_ROLE_KEY);

export const isValidTokenFormat = (token: string | null): boolean => {
  if (!token) return false;
  if (token === 'undefined' || token === 'null') return false;
  return token.split('.').length === 3;
};
