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

interface TempSignupData {
  name?: string;
  username?: string; // New
  email?: string;
  password?: string;
  phone?: string;
  motherTongue?: string; // New
  profileImage?: string | null;
  categoryId?: string;
  roleSubCategoryIds?: string[];
}


interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  primaryRole: {
    group: 'CLIENT' | 'PROVIDER';
    category: string;
    subCategory: string;
    categoryId?: string;
    subCategoryId?: string;
    is_onboarded: boolean;
  };
  profilePicture?: string;
  location?: string;
  isOnboarded: boolean;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoadingUser: boolean;
  tempSignupData: TempSignupData | null;
  setAuth: (user: any, token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setTempSignupData: (data: Partial<TempSignupData>) => void;
  clearTempSignupData: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoadingUser: false,
  tempSignupData: null,
  setTempSignupData: (data) => set((state) => ({ 
    tempSignupData: { ...(state.tempSignupData || {}), ...data } 
  })),
  clearTempSignupData: () => set({ tempSignupData: null }),
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

    set({ isLoadingUser: true });
    try {
      const res = await api.get('/auth/me');
      
      if (res.data.user) {
        const updatedUser = {
          ...res.data.user,
          isOnboarded: !!res.data.user.is_onboarded || !!res.data.user.isOnboarded
        };
        set({ user: updatedUser, isAuthenticated: true, isLoadingUser: false });
      }
    } catch (error) {
      // If unauthorized, clear everything SILENTLY (this is normal on boot with expired token)
      if ((error as any).response?.status === 401) {
         await SecureStore.deleteItemAsync(TOKEN_KEY);
         set({ token: null, user: null, isAuthenticated: false, isLoadingUser: false });
      } else {
         console.error('Fetch User Error:', error);
         set({ isLoadingUser: false });
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
