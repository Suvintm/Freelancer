import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../api/client';
import { useAccountVault, StoredAccount } from '../hooks/useAccountVault';
import { getDeviceId } from '../hooks/useDeviceId';

/**
 * LEGACY KEYS — Kept for one-time migration of existing users.
 * After migration, these are deleted and never used again.
 */
const LEGACY_TOKEN_KEY = 'suvix_auth_token';
const LEGACY_REFRESH_TOKEN_KEY = 'suvix_refresh_token';

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
  googleIdToken?: string;
  isSocialSignup?: boolean;
  socialProfile?: {
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
    uploadsPlaylistId?: string | null;
    subCategoryId?: string;
    subCategorySlug?: string;
    isPrimary?: boolean;
    isVerified?: boolean;
    videos?: {
      id: string;
      title: string;
      thumbnail: string;
      publishedAt: string;
    }[];
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
    categorySlug?: string;
    subCategoryId?: string;
    subCategorySlug?: string;
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
  youtubeVideos?: {
    id: string;
    video_id?: string;
    title: string;
    thumbnail: string;
    published_at: string;
  }[];
  followers?: number;
  following?: number;
  bio?: string;
  isBanned?: boolean;
}

interface AuthState {
  // Core state (maintained for backward compatibility)
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoadingUser: boolean;
  isRefreshing: boolean;
  setIsRefreshing: (val: boolean) => void;
  lastRefreshedAt: number;
  surgicallyUpdateUser: (partialData: any) => void;
  isAddingAccount: boolean;
  switchingToAccount: any | null; // AccountIdentity | null (using any for import simplicity in standard Zustand)
  isBootstrapComplete: boolean;
  isIntroFinished: boolean; // 🎬 New: Signal that Splash animation is done
  tempSignupData: TempSignupData | null;

  // Existing methods — all preserved with same signatures
  setIsAddingAccount: (val: boolean) => void;
  setAuth: (user: any, token: string, refreshToken: string, meta?: { accessTokenExpiresAt?: number; refreshExpiresAt?: number }) => Promise<void>;
  setTokens: (token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchUser: () => Promise<void>;
  switchAccount: (userId: string) => Promise<'success' | 'needs_reauth' | 'error'>;
  updateUser: (data: Partial<AuthUser>) => void;
  setYoutubeVideos: (videos: any[]) => void;
  setIsAddingAccount: (val: boolean) => void;
  setIsBootstrapComplete: (val: boolean) => void;
  setIsIntroFinished: (val: boolean) => void;

  // YouTube Discovery
  youtubeDiscovery: {
    channels: any[];
    selectedChannelIds: string[];
    categorizations: Record<string, string>;
  };
  addDiscoveredChannels: (newChannels: any[]) => void;
  toggleYoutubeChannelSelection: (channelId: string) => void;
  setYoutubeChannelCategory: (channelId: string, categoryId: string) => void;
  clearYoutubeDiscovery: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoadingUser: false,
  isRefreshing: false,
  lastRefreshedAt: 0,
  isAddingAccount: false,
  switchingToAccount: null,
  isBootstrapComplete: false,
  isIntroFinished: false,
  tempSignupData: null,

  setIsRefreshing: (val) => set({ isRefreshing: val }),
  surgicallyUpdateUser: (partialData: any) => set((state) => ({
    user: state.user ? { ...state.user, ...partialData } : null
  })),
  setIsAddingAccount: (val) => set({ isAddingAccount: val }),
  setIsBootstrapComplete: (val) => set({ isBootstrapComplete: val }),
  setIsIntroFinished: (val) => set({ isIntroFinished: val }),

  youtubeDiscovery: {
    channels: [],
    selectedChannelIds: [],
    categorizations: {},
  },

  addDiscoveredChannels: (newChannels) => set((state) => {
    const existingIds = new Set(state.youtubeDiscovery.channels.map(ch => ch.channelId));
    const uniqueNew = newChannels.filter(ch => !existingIds.has(ch.channelId));
    return {
      youtubeDiscovery: {
        ...state.youtubeDiscovery,
        channels: [...state.youtubeDiscovery.channels, ...uniqueNew]
      }
    };
  }),

  toggleYoutubeChannelSelection: (channelId) => set((state) => {
    const currentSelected = state.youtubeDiscovery.selectedChannelIds;
    const isSelected = currentSelected.includes(channelId);
    return {
      youtubeDiscovery: {
        ...state.youtubeDiscovery,
        selectedChannelIds: isSelected
          ? currentSelected.filter(id => id !== channelId)
          : [...currentSelected, channelId]
      }
    };
  }),

  setYoutubeChannelCategory: (channelId, categoryId) => set((state) => ({
    youtubeDiscovery: {
      ...state.youtubeDiscovery,
      categorizations: { ...state.youtubeDiscovery.categorizations, [channelId]: categoryId }
    }
  })),

  clearYoutubeDiscovery: () => set({
    youtubeDiscovery: { channels: [], selectedChannelIds: [], categorizations: {} }
  }),

  setTempSignupData: (data) => set((state) => ({
    tempSignupData: { ...(state.tempSignupData || {}), ...data }
  })),
  clearTempSignupData: () => set({ tempSignupData: null }),

  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null
  })),

  setAuth: async (user, token, refreshToken, meta = {}) => {
    try {
      if (typeof token !== 'string' || typeof refreshToken !== 'string') {
        console.error('❌ [AUTH] setAuth failed: token or refreshToken is not a string.');
        return;
      }

      const now = Date.now();
      const storedAccount: StoredAccount = {
        userId: user.id,
        username: user.username || user.profile?.username || '',
        displayName: user.name || user.displayName || user.profile?.name || '',
        email: user.email,
        profilePicture: user.profilePicture || user.profile?.profile_picture || null,
        accountType: user.role || 'suvix_user',
        isOnboarded: !!user.isOnboarded,
        addedAt: now,
        lastActiveAt: now,
        isRememberedOnly: false,
        accessToken: token,
        refreshToken,
        accessTokenExpiresAt: meta.accessTokenExpiresAt ?? now + 15 * 60 * 1000,
        refreshExpiresAt: meta.refreshExpiresAt ?? now + 30 * 24 * 60 * 60 * 1000,
      };

      await useAccountVault.getState().addAccount(storedAccount);

      set({
        token,
        refreshToken,
        user: { ...user, isOnboarded: !!user.isOnboarded || !!user.is_onboarded },
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Save Auth Error:', error);
    }
  },

  setTokens: async (token, refreshToken) => {
    try {
      const { user } = get();
      if (user?.id) {
        const now = Date.now();
        await useAccountVault.getState().updateTokens(user.id, {
          accessToken: token,
          refreshToken,
          accessTokenExpiresAt: now + 15 * 60 * 1000,
          refreshExpiresAt: now + 30 * 24 * 60 * 60 * 1000,
        });
      }
      set({ token, refreshToken, isAuthenticated: true });
    } catch (error) {
      console.error('Update Tokens Error:', error);
    }
  },

  logout: async () => {
    try {
      const { user, refreshToken } = get();
      const vault = useAccountVault.getState();
      
      // Use user.id or fallback to vault's activeAccountId to ensure physical removal
      const idToRemove = user?.id || vault.activeAccountId;

      // 1. REVOKE ON SERVER
      if (refreshToken) {
        try {
          await api.post('/auth/logout', { refreshToken }).catch(() => {});
        } catch { /* proceed with local wipe */ }
      }

      // 2. REMOVE FROM VAULT
      if (idToRemove) {
        await vault.removeAccount(idToRemove);
      }

      // 3. IDENTIFY NEXT ACTIVE
      const nextId = vault.activeAccountId;

      if (nextId) {
        const result = await vault.switchTo(nextId);
        if (result === 'success') {
          const tokens = await vault.getActiveTokens();
          if (tokens) {
            set({ token: tokens.accessToken, refreshToken: tokens.refreshToken });
            return;
          }
        }
      }

      // 4. FULL WIPE
      set({ token: null, refreshToken: null, user: null, isAuthenticated: false, isAddingAccount: false });
    } catch (error) {
      console.error('Logout Error:', error);
      set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    try {
      // STEP 1: Load vault from SecureStore
      const vault = useAccountVault.getState();
      await vault.loadVault();

      // STEP 2: Check for LEGACY tokens (one-time migration for existing users)
      const vaultAccounts = vault.getAllAccounts();
      if (vaultAccounts.length === 0) {
        const legacyToken = await SecureStore.getItemAsync(LEGACY_TOKEN_KEY);
        const legacyRefresh = await SecureStore.getItemAsync(LEGACY_REFRESH_TOKEN_KEY);

        if (legacyToken && legacyRefresh) {
          console.log('🔄 [MIGRATION] Legacy tokens found. Migrating to account vault...');
          try {
            // Fetch profile using legacy token to build the vault entry
            const deviceId = await getDeviceId();
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://api.suvix.in/api'}/auth/me`, {
              headers: {
                Authorization: `Bearer ${legacyToken}`,
                'X-Device-ID': deviceId,
              },
            });
            if (res.ok) {
              const data = await res.json();
              if (data.user) {
                const now = Date.now();
                await vault.addAccount({
                  userId: data.user.id,
                  username: data.user.username || '',
                  displayName: data.user.name || data.user.displayName || '',
                  email: data.user.email,
                  profilePicture: data.user.profilePicture || null,
                  accountType: data.user.role || 'suvix_user',
                  isOnboarded: !!data.user.isOnboarded,
                  addedAt: now,
                  lastActiveAt: now,
                  isRememberedOnly: false,
                  accessToken: legacyToken,
                  refreshToken: legacyRefresh,
                  accessTokenExpiresAt: now + 15 * 60 * 1000, // Assume it may be expiring soon
                  refreshExpiresAt: now + 30 * 24 * 60 * 60 * 1000,
                });
                console.log('✅ [MIGRATION] Legacy session migrated successfully.');
              }
            }
          } catch (migrationError) {
            console.warn('⚠️ [MIGRATION] Failed. User will need to log in again.', migrationError);
          }

          // Clean up legacy keys regardless of migration success
          await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
          await SecureStore.deleteItemAsync(LEGACY_REFRESH_TOKEN_KEY);
        }
      }

      await vault.loadVault();

      // 🛰️ VAULT INTEGRITY CHECK (Production-Level Sync)
      // Check if all stored accounts still exist in the backend DB.
      // This runs safely in the background to purge "ghost" accounts.
      vault.validateVaultIntegrity().catch(() => {});

      const activeId = vault.activeAccountId;

      if (!activeId) {
        set({ isInitialized: true, isAuthenticated: false });
        return;
      }

      // STEP 4: Load tokens for active account
      const tokens = await vault.getActiveTokens();
      if (!tokens) {
        set({ isInitialized: true, isAuthenticated: false });
        return;
      }

      // STEP 5: Set token in state (user profile fetched separately by boot sequence)
      set({
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isAuthenticated: true,
        isInitialized: true,
      });

    } catch (error) {
      console.error('Check Auth Native Error:', error);
      set({ isInitialized: true, isAuthenticated: false });
    }
  },

  fetchUser: async () => {
    const { token, isRefreshing, lastRefreshedAt, setIsRefreshing } = get();
    if (!token) return;

    // 🛡️ [THROTTLE] Prevent infrastructure spam (LinkedIn-style 10s cooldown)
    const now = Date.now();
    if (now - lastRefreshedAt < 10000 && !isRefreshing) {
      console.log('⏳ [THROTTLE] Refresh suppressed. Cooldown active (10s).');
      // Briefly show animation then skip API
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 800);
      return;
    }

    set({ isLoadingUser: true, isRefreshing: true, lastRefreshedAt: now });
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        set({ user: res.data.user });
      }
    } catch (error) {
      const status = (error as any).response?.status;
      if (status === 401 || status === 403 || status === 404) {
        console.warn('❌ [AUTH] Session expired. Clearing credentials.');
        // Remove this account from vault and check if others exist
        const { user } = get();
        if (user?.id) {
          await useAccountVault.getState().removeAccount(user.id);
        }
        set({ token: null, refreshToken: null, user: null, isAuthenticated: false, isLoadingUser: false });
      } else {
        console.log('⚠️ [AUTH] Backend unreachable or error, but keeping session token.');
        set({ isLoadingUser: false });
      }
    } finally {
      set({ isLoadingUser: false, isRefreshing: false });
    }
  },

  switchAccount: async (userId: string) => {
    try {
      console.log(`🔄 [AUTH] Initiating atomic switch to account ${userId}...`);
      
      const vault = useAccountVault.getState();
      const targetIdentity = vault.accounts[userId];

      // STEP 1: PROTECT STATE & CLEAR STALE CREDENTIALS
      // We set isLoadingUser: true and manually clear token/refreshToken from RAM.
      // We also set switchingToAccount so the UI can show the premium overlay.
      set({ 
        isLoadingUser: true, 
        switchingToAccount: targetIdentity || { username: 'Account' },
        user: null, 
        token: null, 
        refreshToken: null,
        isAuthenticated: true 
      });

      // STEP 2: SWAP VAULT ACTIVE
      const result = await vault.switchTo(userId);
      
      if (result !== 'success') {
        console.warn(`⚠️ [AUTH] Vault switch failed: ${result}`);
        set({ isAuthenticated: false, isLoadingUser: false, switchingToAccount: null });
        await get().checkAuth();
        return result;
      }

      // STEP 3: HYDRATE NEW RAM TOKENS
      const tokens = await vault.getActiveTokens();
      if (!tokens) {
        set({ isAuthenticated: false, isLoadingUser: false, switchingToAccount: null });
        return 'error';
      }

      set({ 
        token: tokens.accessToken, 
        refreshToken: tokens.refreshToken, 
        isAuthenticated: true 
      });

      // STEP 4: COOL-DOWN & SYNC
      // Give the system 150ms to settle state before hitting /auth/me
      await new Promise(resolve => setTimeout(resolve, 150));

      const res = await api.get('/auth/me');
      
      if (res.data.user) {
        const updatedUser = {
          ...res.data.user,
          isOnboarded: !!res.data.user.is_onboarded || !!res.data.user.isOnboarded
        };
        console.log(`✅ [AUTH] Switch complete. Identity: ${updatedUser.username}`);
        
        // Final transition: allow UI to breathe for a moment before landing
        await new Promise(resolve => setTimeout(resolve, 300));
        
        set({ user: updatedUser, isLoadingUser: false, switchingToAccount: null });
        return 'success';
      }

      set({ isLoadingUser: false, switchingToAccount: null });
      return 'error';
    } catch (error) {
      console.error('❌ [AUTH] Atomic switch failed:', error);
      set({ isLoadingUser: false, isAuthenticated: false, switchingToAccount: null });
      return 'error';
    }
  },

  setYoutubeVideos: (videos) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, youtubeVideos: videos } });
    }
  },

  exchangeCode: async (code) => {
    set({ isLoadingUser: true });
    try {
      const res = await api.post('/auth/exchange-code', { code });
      if (res.data.success) {
        const { user, token, refreshToken, accessTokenExpiresAt } = res.data;
        const authStore = get();
        await authStore.setAuth(user, token, refreshToken, { accessTokenExpiresAt });
        set({ isLoadingUser: false });
      }
    } catch (error) {
      console.error('❌ [AUTH] Code exchange failed:', error);
      set({ isLoadingUser: false });
      throw error;
    }
  },
}));

