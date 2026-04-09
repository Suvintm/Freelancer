import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../api/client';

/**
 * PRODUCTION-GRADE SECURITY (Zero-Rebuild Upgrade)
 * We use SecureStore for BOTH tokens and user data. 
 * This is hardware-encrypted and doesn't require the extra AsyncStorage dependency.
 */
const TOKEN_KEY = 'suvix_auth_token';
const REFRESH_TOKEN_KEY = 'suvix_refresh_token';
// Note: We no longer store the user object in SecureStore to avoid the 2048-byte limit.
// The user is fetched fresh on every boot during our splash screen pre-fetch.

interface TempSignupData {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  phone?: string;
  motherTongue?: string;
  profileImage?: string | null;
  categoryId?: string;
  categorySlug?: string;
  roleSubCategoryIds?: string[];
  googleIdToken?: string; // New: For Atomic Social Registration
  isSocialSignup?: boolean; // New: Flag for Social flow
  socialProfile?: { // New: Data verified from Google
    email: string;
    name: string;
    picture?: string;
  };
  youtubeChannels?: {
    channelId: string;
    channelName: string;
    thumbnailUrl?: string | null;
    subscriberCount?: number;
    videoCount?: number;
    subCategoryId?: string;
    subCategorySlug?: string;
    isPrimary?: boolean;
    isVerified?: boolean;
  }[];
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
  youtubeProfile?: {
    id: string;
    channel_id: string;
    channel_name: string;
    subscriber_count: number;
    video_count: number;
    thumbnail_url: string;
  } | null;
  followers?: number;
  following?: number;
  bio?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoadingUser: boolean;
  tempSignupData: TempSignupData | null;
  setAuth: (user: any, token: string, refreshToken: string) => Promise<void>;
  setTokens: (token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setTempSignupData: (data: Partial<TempSignupData>) => void;
  clearTempSignupData: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  exchangeCode: (code: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoadingUser: false,
  tempSignupData: null,
  setTempSignupData: (data) => set((state) => ({ 
    tempSignupData: { ...(state.tempSignupData || {}), ...data } 
  })),
  clearTempSignupData: () => set({ tempSignupData: null }),
  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null
  })),
  exchangeCode: async (code) => {
    set({ isLoadingUser: true });
    try {
      const res = await api.post('/auth/exchange-code', { code });
      if (res.data.success) {
        const { user, token, refreshToken } = res.data;
        // Securely store tokens and update state
        await Promise.all([
          SecureStore.setItemAsync(TOKEN_KEY, token),
          SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken)
        ]);
        set({ 
          token, 
          refreshToken,
          user: {
            ...user,
            isOnboarded: !!user.is_onboarded || !!user.isOnboarded
          }, 
          isAuthenticated: true, 
          isLoadingUser: false 
        });
      }
    } catch (error) {
      console.error('❌ [AUTH] Code exchange failed:', error);
      set({ isLoadingUser: false });
      throw error;
    }
  },
  setAuth: async (user, token, refreshToken) => {
    try {
      // 🛡️ SECURITY GUARD: Ensure we have strings before calling SecureStore
      if (typeof token !== 'string' || typeof refreshToken !== 'string') {
        console.error('❌ [AUTH] setAuth failed: token or refreshToken is not a string.', { token, refreshToken });
        return;
      }

      // Store BOTH tokens in hardware-encrypted SecureStore
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, token),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken)
      ]);
      set({ token, refreshToken, user, isAuthenticated: true });
    } catch (error) {
      console.error('Save Auth Error:', error);
    }
  },
  setTokens: async (token, refreshToken) => {
    try {
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, token),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken)
      ]);
      set({ token, refreshToken, isAuthenticated: true });
    } catch (error) {
      console.error('Update Tokens Error:', error);
    }
  },
  logout: async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
      ]);
      set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
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
      // PRODUCTION GUARD: Only delete token on a STRICT 401 (Unauthorized)
      // If it's a network error (no response) or 500, we KEEP the token so 
      // the user isn't kicked out just because the backend was restarting.
      const status = (error as any).response?.status;
      if (status === 401 || status === 403) {
         console.warn('❌ [AUTH] Session expired. Clearing credentials.');
         await Promise.all([
            SecureStore.deleteItemAsync(TOKEN_KEY),
            SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
         ]);
         set({ token: null, refreshToken: null, user: null, isAuthenticated: false, isLoadingUser: false });
      } else {
         console.log('⚠️ [AUTH] Backend unreachable or error, but keeping session token.');
         set({ isLoadingUser: false });
      }
    }
  },
  checkAuth: async () => {
    try {
      const [token, refreshToken] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
      ]);
      
      if (token) {
        // We set tokens and isAuthenticated, but user stays null until pre-fetched
        set({ 
          token, 
          refreshToken,
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
