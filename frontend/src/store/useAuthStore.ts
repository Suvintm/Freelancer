import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api/client';
import { useOnboardingStore } from './useOnboardingStore';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  profilePicture?: string;
  isOnboarded: boolean;
  primaryRole: {
    group: 'CLIENT' | 'PROVIDER';
    category: string;
    subCategory: string;
  };
  youtubeProfile?: Array<{
    id: string;
    channel_id: string;
    channel_name: string;
    thumbnail_url: string;
    subscriber_count: number;
    video_count: number;
    view_count?: string | number;
    subCategoryName?: string;
  }>;
  bio?: string;
  followers?: number;
  following?: number;
}

export interface SignupPayload {
  username?: string;
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
  motherTongue?: string;
  categoryId?: string;
  roleSubCategoryIds?: string[];
  youtubeChannels?: Array<{
    channelId: string;
    channelName: string;
    thumbnailUrl?: string | null;
    subscriberCount?: number | string;
    videoCount?: number | string;
    uploadsPlaylistId?: string | null;
    subCategoryId?: string;
    subCategorySlug?: string | null;
    isPrimary?: boolean;
    isVerified?: boolean;
    videos?: Array<{
      id: string;
      title: string;
      thumbnail: string;
      publishedAt: string;
    }>;
  }>;
  googleId?: string;
  authProvider?: string;
  profilePicture?: File | string | null;
  pushToken?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;

  setAuth: (user: AuthUser, token: string, refreshToken: string) => void;
  setTokens: (token: string, refreshToken: string, user?: AuthUser) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
  checkUsername: (username: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      isLoading: false,

      setAuth: (user, token, refreshToken) => {
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isInitialized: true,
        });
      },

      setTokens: (token, refreshToken, user) => {
        set((state) => ({
          token,
          refreshToken,
          user: user || state.user,
        }));
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password });
          if (res.data.success) {
            const { user, token, refreshToken } = res.data;
            get().setAuth(user, token, refreshToken);
          } else {
            throw new Error(res.data.message || 'Login failed');
          }
        } catch (error: unknown) {
          console.error('Login error:', error);
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          throw err.response?.data?.message || err.message || 'Login failed';
        } finally {
          set({ isLoading: false });
        }
      },

      signup: async (data: SignupPayload) => {
        set({ isLoading: true });
        try {
          let payload: Record<string, unknown> | FormData = data as unknown as Record<string, unknown>;
          
          // If a profile picture is provided, we must use FormData for multipart/form-data upload
          if (data.profilePicture instanceof File) {
            const formData = new FormData();
            Object.entries(data as unknown as Record<string, unknown>).forEach(([key, value]) => {
              if (value === undefined || value === null) return;
              
              if (key === 'youtubeChannels' || key === 'roleSubCategoryIds') {
                formData.append(key, JSON.stringify(value));
              } else if (value instanceof File) {
                formData.append(key, value);
              } else {
                formData.append(key, String(value));
              }
            });
            payload = formData;
          }

          const res = await api.post('/auth/register-full', payload);
          if (res.data.success) {
            const { user, token, refreshToken } = res.data;
            get().setAuth(user, token, refreshToken);
          } else {
            throw new Error(res.data.message || 'Signup failed');
          }
        } catch (error: unknown) {
          console.error('Signup error:', error);
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          throw err.response?.data?.message || err.message || 'Signup failed';
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        
        // 1. ATOMIC & IMMEDIATE: Wipe local auth state first
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
        });

        // 2. WIPE SPECIFIC STORAGE: Clear only the persisted Zustand stores
        // This avoids destroying unrelated app state in localStorage
        useAuthStore.persist.clearStorage();
        useOnboardingStore.persist.clearStorage();

        // 3. CLEAR ONBOARDING STATE IN MEMORY
        useOnboardingStore.getState().clearTempSignupData();

        // 4. SERVER INVALIDATION: Attempt to kill session on backend
        if (refreshToken) {
          try {
            api.post('/auth/logout', { refreshToken }).catch(e => 
              console.warn('[Logout] Server-side session kill failed:', e)
            );
          } catch (error) {
            console.warn('[Logout] Pre-request failure:', error);
          }
        }

        // 5. DISPATCH: Let AuthGuard and other listeners know we are out
        window.dispatchEvent(new CustomEvent('suvix:logout'));
        
        // 6. HARD REFRESH: This is the ultimate fix for flickering and stale JS state
        window.location.href = '/'; 
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isInitialized: true, isAuthenticated: false });
          return;
        }
        try {
          await get().fetchUser();
        } catch (error) {
          console.error('CheckAuth error:', error);
          set({ isInitialized: true, isAuthenticated: false });
        }
      },

      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            set({ 
              user: res.data.user, 
              isAuthenticated: true, 
              isInitialized: true 
            });
          }
        } catch (error) {
          console.error('FetchUser error:', error);
          // If 401, the interceptor will handle logout
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      checkUsername: async (username: string) => {
        try {
          const res = await api.get(`/auth/check-username/${username}`);
          return res.data.available;
        } catch (error) {
          console.error('CheckUsername error:', error);
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
