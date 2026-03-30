import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../api/client';

/**
 * PRODUCTION-GRADE SECURITY (Zero-Rebuild Upgrade)
 * We use SecureStore for BOTH tokens and user data. 
 * This is hardware-encrypted and doesn't require the extra AsyncStorage dependency.
 */
const TOKEN_KEY = 'suvix_auth_token';
// Note: We no longer store the user object in SecureStore to avoid the 2048-byte limit.
// The user is fetched fresh on every boot during our splash screen pre-fetch.

interface AuthState {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: any, token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  setAuth: async (user, token) => {
    try {
      // Store ONLY the token in hardware-encrypted SecureStore
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      set({ token, user, isAuthenticated: true });
    } catch (error) {
      console.error('Save Auth Error:', error);
    }
  },
  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      set({ token: null, user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout Error:', error);
    }
  },
  fetchUser: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const res = await api.get('/auth/me');
      
      if (res.data.user) {
        const updatedUser = res.data.user;
        set({ user: updatedUser, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Fetch User Error:', error);
      // If unauthorized, clear everything
      if ((error as any).response?.status === 401) {
         await SecureStore.deleteItemAsync(TOKEN_KEY);
         set({ token: null, user: null, isAuthenticated: false });
      }
    }
  },
  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      
      if (token) {
        // We set token and isAuthenticated, but user stays null until pre-fetched
        set({ 
          token, 
          isAuthenticated: true, 
          isInitialized: true 
        });
      } else {
        set({ isInitialized: true, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Check Auth Native Error:', error);
      // CRITICAL: Even on native failure, we MUST set isInitialized to true
      // otherwise the app stays on the splash screen forever.
      set({ isInitialized: true, isAuthenticated: false });
    }
  },
}));
