import * as SecureStore from 'expo-secure-store';

// Mirrors client/lib/tokenManager.ts, swapping localStorage for expo-secure-store.
// Storage keys are role-scoped so a Member and Donor session can coexist on the
// same device (matches the web client's per-role localStorage key convention).

export interface UserData {
  id: string;
  username: string;
  email?: string;
  role: 'member' | 'donor';
  firstName?: string;
  lastName?: string;
  churchId?: string;
  unitId?: string;
  bavanakutayimaId?: string;
  houseId?: string;
}

const keyFor = (role: string, key: string) => `${role}_${key}`;

export const getAccessToken = (role: string) => SecureStore.getItemAsync(keyFor(role, 'accessToken'));
export const getRefreshToken = (role: string) => SecureStore.getItemAsync(keyFor(role, 'refreshToken'));

export const getUserData = async (role: string): Promise<UserData | null> => {
  const raw = await SecureStore.getItemAsync(keyFor(role, 'user'));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserData;
  } catch {
    return null;
  }
};

export const setAuthData = async (role: string, accessToken: string, refreshToken: string, user: UserData) => {
  await SecureStore.setItemAsync(keyFor(role, 'accessToken'), accessToken);
  await SecureStore.setItemAsync(keyFor(role, 'refreshToken'), refreshToken);
  await SecureStore.setItemAsync(keyFor(role, 'user'), JSON.stringify(user));
};

export const setAccessToken = (role: string, token: string) => SecureStore.setItemAsync(keyFor(role, 'accessToken'), token);

export const clearAuthData = async (role: string) => {
  await SecureStore.deleteItemAsync(keyFor(role, 'accessToken'));
  await SecureStore.deleteItemAsync(keyFor(role, 'refreshToken'));
  await SecureStore.deleteItemAsync(keyFor(role, 'user'));
};

export const isValidTokenFormat = (token: string | null): boolean => {
  if (!token) return false;
  if (token === 'undefined' || token === 'null') return false;
  return token.split('.').length === 3;
};
