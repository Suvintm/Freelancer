import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api/client';

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

export interface YouTubeChannel {
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  subscriberCount: number | string;
  videoCount: number | string;
  isClaimed?: boolean;
  videos?: Array<{
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
  }>;
}

export interface TempSignupData {
  categoryId?: string;
  categorySlug?: string;
  roleName?: string;
  roleSubCategoryIds?: string[];
  isSocialSignup?: boolean;
  socialProfile?: {
    name: string;
    email: string;
    picture?: string;
    googleId: string;
  };
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
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;

  tempSignupData: TempSignupData;
  setTempSignupData: (data: Partial<TempSignupData>) => void;
  clearTempSignupData: () => void;
  youtubeDiscovery: {
    channels: YouTubeChannel[];
    selectedChannelIds: string[];
    categorizations: Record<string, string>;
  };
  addDiscoveredChannels: (channels: YouTubeChannel[]) => void;
  toggleYoutubeChannelSelection: (channelId: string) => void;
  setYoutubeChannelCategory: (channelId: string, subCategoryId: string) => void;
  resetYoutubeDiscovery: () => void;

  setAuth: (user: AuthUser, token: string, refreshToken: string) => void;
  setTokens: (token: string, refreshToken: string, user?: AuthUser) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: TempSignupData | Record<string, unknown>) => Promise<void>;
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

      tempSignupData: {},
      youtubeDiscovery: {
        channels: [],
        selectedChannelIds: [],
        categorizations: {},
      },

      setTempSignupData: (data) => {
        set((state) => ({
          tempSignupData: { ...state.tempSignupData, ...data },
        }));
      },

      clearTempSignupData: () => {
        set({
          tempSignupData: {},
          youtubeDiscovery: {
            channels: [],
            selectedChannelIds: [],
            categorizations: {},
          },
        });
      },

      addDiscoveredChannels: (channels) => {
        set((state) => ({
          youtubeDiscovery: {
            ...state.youtubeDiscovery,
            channels,
          },
        }));
      },

      toggleYoutubeChannelSelection: (channelId) => {
        set((state) => {
          const { selectedChannelIds } = state.youtubeDiscovery;
          const isSelected = selectedChannelIds.includes(channelId);
          const newSelection = isSelected
            ? selectedChannelIds.filter((id) => id !== channelId)
            : [...selectedChannelIds, channelId];
          
          return {
            youtubeDiscovery: {
              ...state.youtubeDiscovery,
              selectedChannelIds: newSelection,
            },
          };
        });
      },

      setYoutubeChannelCategory: (channelId, subCategoryId) => {
        set((state) => ({
          youtubeDiscovery: {
            ...state.youtubeDiscovery,
            categorizations: {
              ...state.youtubeDiscovery.categorizations,
              [channelId]: subCategoryId,
            },
          },
        }));
      },
      
      resetYoutubeDiscovery: () => {
        set({
          youtubeDiscovery: {
            channels: [],
            selectedChannelIds: [],
            categorizations: {},
          }
        });
      },

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

      signup: async (data) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/register-full', data);
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
        // 1. Tell server to invalidate this refresh token family (server-side session kill)
        if (refreshToken) {
          try {
            await api.post('/auth/logout', { refreshToken });
          } catch (error) {
            // Proceed with client-side logout regardless — server might be down
            console.warn('[Logout] Server invalidation failed, proceeding locally:', error);
          }
        }
        // 2. Atomically wipe ALL auth + onboarding state from memory
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          isInitialized: true,   // keep true so AuthGuard redirects instead of spinning
          isLoading: false,
          tempSignupData: {},
          youtubeDiscovery: { channels: [], selectedChannelIds: [], categorizations: {} },
        });
        // 3. Wipe persisted storage so refresh/back-button can't restore session
        localStorage.removeItem('auth-storage');
        sessionStorage.clear();
        // 4. Dispatch event so interceptor-forced logouts also trigger navigation
        window.dispatchEvent(new CustomEvent('suvix:logout'));
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
        tempSignupData: state.tempSignupData,
        youtubeDiscovery: state.youtubeDiscovery,
      }),
    }
  )
);
