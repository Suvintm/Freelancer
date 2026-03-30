import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

/**
 * PRODUCTION-GRADE SECURITY (Zero-Rebuild Upgrade)
 * We use SecureStore for BOTH tokens and user data. 
 * This is hardware-encrypted and doesn't require the extra AsyncStorage dependency.
 */
const TOKEN_KEY = 'suvix_auth_token';
const USER_DATA_KEY = 'suvix_user_data';

interface AuthState {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: any, token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  setAuth: async (user, token) => {
    try {
      // Store everything in the hardware-encrypted SecureStore
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    } catch (error) {
      console.error('Save Auth Error:', error);
    }
  },
  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      set({ token: null, user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout Error:', error);
    }
  },
  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userData = await SecureStore.getItemAsync(USER_DATA_KEY);
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          if (parsedUser && typeof parsedUser === 'object') {
            set({ 
              token, 
              user: parsedUser, 
              isAuthenticated: true, 
              isInitialized: true 
            });
          } else {
            throw new Error('Invalid user data format');
          }
        } catch (parseError) {
          console.error('UserData Parse Error:', parseError);
          // If data is corrupt, clear it and let them login again
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(USER_DATA_KEY);
          set({ isInitialized: true, isAuthenticated: false });
        }
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
