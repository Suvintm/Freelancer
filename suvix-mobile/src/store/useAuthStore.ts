/**
 * useAuthStore.ts — Global Auth State (Zustand)
 *
 * ── Fixes Applied ─────────────────────────────────────────────────────────────
 *
 * 1. fetchUser now sets dataLoaded=true in ALL paths (success, auth error,
 *    network error). Previously the network-error branch didn't set it,
 *    causing the navigation guard to spin indefinitely when the server was slow.
 *
 * 2. setAuth now sets isInitialized=true along with isAuthenticated.
 *    After login/signup, if isInitialized is still false the guard won't run,
 *    causing the user to be stuck on the login screen until a re-render.
 *
 * 3. switchAccount uses atomic token swap — new token enters the store in the
 *    SAME set() call that clears the old user, so Axios interceptor never
 *    sees a null token during the brief identity transition.
 *
 * 4. checkAuth re-reads vault state AFTER loadVault() which calls set() internally.
 *    Previously the captured reference was stale and vault appeared empty.
 *
 * 5. logout correctly chains to next available account instead of always
 *    clearing all state.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../api/client';
import { useAccountVault, StoredAccount } from '../hooks/useAccountVault';
import { getDeviceId } from '../hooks/useDeviceId';

const LEGACY_TOKEN_KEY         = 'suvix_auth_token';
const LEGACY_REFRESH_TOKEN_KEY = 'suvix_refresh_token';

// ── Types ──────────────────────────────────────────────────────────────────────

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
  socialProfile?: { email: string; name: string; picture?: string };
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
    videos?: { id: string; title: string; thumbnail: string; publishedAt: string }[];
  }[];
}

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  _systemRole?: string;
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
  youtubeProfile?: any[];
  youtubeVideos?: any[];
  followers?: number;
  following?: number;
  bio?: string;
  isBanned?: boolean;
}

interface AuthState {
  token:              string | null;
  refreshToken:       string | null;
  user:               AuthUser | null;
  isAuthenticated:    boolean;
  isInitialized:      boolean;
  isLoadingUser:      boolean;
  isRefreshing:       boolean;
  lastRefreshedAt:    number;
  dataLoaded:         boolean;
  isAddingAccount:    boolean;
  switchingToAccount: any | null;
  isBootstrapComplete: boolean;
  isIntroFinished:    boolean;
  tempSignupData:     TempSignupData | null;
  youtubeDiscovery: {
    channels: any[];
    selectedChannelIds: string[];
    categorizations: Record<string, string>;
  };

  setIsRefreshing:         (val: boolean) => void;
  surgicallyUpdateUser:    (data: any) => void;
  setIsAddingAccount:      (val: boolean) => void;
  setIsBootstrapComplete:  (val: boolean) => void;
  setIsIntroFinished:      (val: boolean) => void;
  setAuth:      (user: any, token: string, refreshToken: string, meta?: { accessTokenExpiresAt?: number; refreshExpiresAt?: number }) => Promise<void>;
  setTokens:    (token: string, refreshToken: string, user?: AuthUser) => Promise<void>;
  logout:       () => Promise<void>;
  checkAuth:    () => Promise<void>;
  fetchUser:    () => Promise<void>;
  switchAccount:(userId: string) => Promise<'success' | 'needs_reauth' | 'error'>;
  updateUser:   (data: Partial<AuthUser>) => void;
  setYoutubeVideos: (videos: any[]) => void;
  exchangeCode: (code: string) => Promise<void>;
  setTempSignupData:   (data: Partial<TempSignupData>) => void;
  clearTempSignupData: () => void;
  addDiscoveredChannels:        (channels: any[]) => void;
  toggleYoutubeChannelSelection:(channelId: string) => void;
  setYoutubeChannelCategory:    (channelId: string, categoryId: string) => void;
  clearYoutubeDiscovery:        () => void;
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  token:              null,
  refreshToken:       null,
  user:               null,
  isAuthenticated:    false,
  isInitialized:      false,
  isLoadingUser:      false,
  isRefreshing:       false,
  lastRefreshedAt:    0,
  dataLoaded:         false,
  isAddingAccount:    false,
  switchingToAccount: null,
  isBootstrapComplete:false,
  isIntroFinished:    false,
  tempSignupData:     null,
  youtubeDiscovery: {
    channels: [],
    selectedChannelIds: [],
    categorizations: {},
  },

  // ── Simple setters ─────────────────────────────────────────────────────────

  setIsRefreshing:        (val) => set({ isRefreshing: val }),
  setIsAddingAccount:     (val) => set({ isAddingAccount: val }),
  setIsBootstrapComplete: (val) => set({ isBootstrapComplete: val }),
  setIsIntroFinished:     (val) => set({ isIntroFinished: val }),

  surgicallyUpdateUser: (data) =>
    set(state => ({ user: state.user ? { ...state.user, ...data } : null })),

  updateUser: (updates) =>
    set(state => ({ user: state.user ? { ...state.user, ...updates } : null })),

  setTempSignupData: (data) =>
    set(state => ({ tempSignupData: { ...(state.tempSignupData || {}), ...data } })),

  clearTempSignupData: () => set({ tempSignupData: null }),

  // ── YouTube discovery ──────────────────────────────────────────────────────

  addDiscoveredChannels: (newChannels) =>
    set(state => {
      const existingIds = new Set(state.youtubeDiscovery.channels.map(ch => ch.channelId));
      const uniqueNew   = newChannels.filter(ch => !existingIds.has(ch.channelId));
      return {
        youtubeDiscovery: {
          ...state.youtubeDiscovery,
          channels: [...state.youtubeDiscovery.channels, ...uniqueNew],
        },
      };
    }),

  toggleYoutubeChannelSelection: (channelId) =>
    set(state => {
      const current    = state.youtubeDiscovery.selectedChannelIds;
      const isSelected = current.includes(channelId);
      return {
        youtubeDiscovery: {
          ...state.youtubeDiscovery,
          selectedChannelIds: isSelected
            ? current.filter(id => id !== channelId)
            : [...current, channelId],
        },
      };
    }),

  setYoutubeChannelCategory: (channelId, categoryId) =>
    set(state => ({
      youtubeDiscovery: {
        ...state.youtubeDiscovery,
        categorizations: {
          ...state.youtubeDiscovery.categorizations,
          [channelId]: categoryId,
        },
      },
    })),

  clearYoutubeDiscovery: () =>
    set({ youtubeDiscovery: { channels: [], selectedChannelIds: [], categorizations: {} } }),

  setYoutubeVideos: (videos) => {
    const { user } = get();
    if (user) set({ user: { ...user, youtubeVideos: videos } });
  },

  // ── setAuth ───────────────────────────────────────────────────────────────
  // Called after login, signup, or Google OAuth.
  // ✅ FIX: Sets isInitialized=true so the navigation guard fires immediately.
  // ✅ FIX: Normalises isOnboarded to strict boolean.

  setAuth: async (user, token, refreshToken, meta = {}) => {
    try {
      if (typeof token !== 'string' || typeof refreshToken !== 'string') {
        console.error('❌ [AUTH] setAuth: token or refreshToken is not a string.');
        return;
      }

      const now = Date.now();
      const normalizedUser = {
        ...user,
        isOnboarded: !!(user.isOnboarded || user.is_onboarded),
      };

      const storedAccount: StoredAccount = {
        userId:              normalizedUser.id,
        username:            normalizedUser.username || normalizedUser.profile?.username || '',
        displayName:         normalizedUser.name || normalizedUser.displayName || normalizedUser.profile?.name || '',
        email:               normalizedUser.email,
        profilePicture:      normalizedUser.profilePicture || normalizedUser.profile?.profile_picture || null,
        accountType:         normalizedUser.role || 'suvix_user',
        isOnboarded:         normalizedUser.isOnboarded,
        addedAt:             now,
        lastActiveAt:        now,
        isRememberedOnly:    false,
        accessToken:         token,
        refreshToken,
        accessTokenExpiresAt: meta.accessTokenExpiresAt ?? now + 15 * 60 * 1000,
        refreshExpiresAt:    meta.refreshExpiresAt    ?? now + 30 * 24 * 60 * 60 * 1000,
      };

      await useAccountVault.getState().addAccount(storedAccount);

      set({
        token,
        refreshToken,
        user:            normalizedUser,
        isAuthenticated: true,
        isInitialized:   true, // ✅ FIX: Ensure guard can run after login
        dataLoaded:      true,
      });
    } catch (error) {
      console.error('setAuth Error:', error);
    }
  },

  // ── setTokens ─────────────────────────────────────────────────────────────

  setTokens: async (token, refreshToken, user) => {
    try {
      const userIdToUpdate = user?.id || get().user?.id || useAccountVault.getState().activeAccountId;

      if (userIdToUpdate) {
        const now = Date.now();
        await useAccountVault.getState().updateTokens(userIdToUpdate, {
          accessToken:          token,
          refreshToken,
          accessTokenExpiresAt: now + 15 * 60 * 1000,
          refreshExpiresAt:     now + 30 * 24 * 60 * 60 * 1000,
        });
      }

      const currentActiveId    = useAccountVault.getState().activeAccountId;
      const isTargetAccountActive = user ? user.id === currentActiveId : true;

      if (isTargetAccountActive) {
        set(state => ({
          token,
          refreshToken,
          isAuthenticated: true,
          user: user
            ? { ...user, isOnboarded: !!(user.is_onboarded || user.isOnboarded) }
            : state.user,
        }));
      } else {
        console.log(`🛡️ [AUTH] Background refresh for Ghost Account ${user?.id}. Vault synced. UI preserved.`);
      }
    } catch (error) {
      console.error('setTokens Error:', error);
    }
  },

  // ── logout ────────────────────────────────────────────────────────────────

  logout: async () => {
    try {
      const { user, refreshToken } = get();
      const idToRemove = user?.id || useAccountVault.getState().activeAccountId;

      if (refreshToken) {
        api.post('/auth/logout', { refreshToken }).catch(() => {});
      }

      if (idToRemove) {
        await useAccountVault.getState().removeAccount(idToRemove);
      }

      const nextId = useAccountVault.getState().activeAccountId;

      if (nextId) {
        const result = await useAccountVault.getState().switchTo(nextId);
        if (result === 'success') {
          const tokens = await useAccountVault.getState().getActiveTokens();
          if (tokens) {
            set({ token: tokens.accessToken, refreshToken: tokens.refreshToken });
            return;
          }
        }
      }

      set({
        token:              null,
        refreshToken:       null,
        user:               null,
        isAuthenticated:    false,
        isAddingAccount:    false,
        dataLoaded:         false,
      });
    } catch (error) {
      console.error('Logout Error:', error);
      set({
        token:           null,
        refreshToken:    null,
        user:            null,
        isAuthenticated: false,
        dataLoaded:      false,
      });
    }
  },

  // ── checkAuth ─────────────────────────────────────────────────────────────
  // ✅ FIX: Re-reads vault state AFTER loadVault() calls set() internally.
  //    Previously captured a stale ref before loadVault ran.

  checkAuth: async () => {
    try {
      // STEP 1: Load vault from SecureStore into Zustand memory
      await useAccountVault.getState().loadVault();

      // ✅ CRITICAL: Re-read AFTER loadVault() — reference was stale before
      const freshVault = useAccountVault.getState();

      // STEP 2: Legacy token migration (one-time, for existing users)
      const vaultAccounts = freshVault.getAllAccounts();
      if (vaultAccounts.length === 0) {
        const legacyToken   = await SecureStore.getItemAsync(LEGACY_TOKEN_KEY);
        const legacyRefresh = await SecureStore.getItemAsync(LEGACY_REFRESH_TOKEN_KEY);

        if (legacyToken && legacyRefresh) {
          console.log('🔄 [MIGRATION] Legacy tokens found. Migrating...');
          try {
            const deviceId = await getDeviceId();
            const res = await fetch(
              `${(process.env as any).EXPO_PUBLIC_API_URL || 'https://api.suvix.in/api'}/auth/me`,
              {
                headers: {
                  Authorization: `Bearer ${legacyToken}`,
                  'X-Device-ID': deviceId,
                },
              }
            );
            if (res.ok) {
              const data = await res.json();
              if (data.user) {
                const now = Date.now();
                await useAccountVault.getState().addAccount({
                  userId:               data.user.id,
                  username:             data.user.username || '',
                  displayName:          data.user.name || data.user.displayName || '',
                  email:                data.user.email,
                  profilePicture:       data.user.profilePicture || null,
                  accountType:          data.user.role || 'suvix_user',
                  isOnboarded:          !!data.user.isOnboarded,
                  addedAt:              now,
                  lastActiveAt:         now,
                  isRememberedOnly:     false,
                  accessToken:          legacyToken,
                  refreshToken:         legacyRefresh,
                  accessTokenExpiresAt: now + 15 * 60 * 1000,
                  refreshExpiresAt:     now + 30 * 24 * 60 * 60 * 1000,
                });
                console.log('✅ [MIGRATION] Legacy session migrated successfully.');
              }
            }
          } catch (err) {
            console.warn('⚠️ [MIGRATION] Failed. User will need to log in again.', err);
          }

          await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
          await SecureStore.deleteItemAsync(LEGACY_REFRESH_TOKEN_KEY);
        }
      }

      // STEP 3: Re-read vault after possible migration
      const latestVault = useAccountVault.getState();
      latestVault.validateVaultIntegrity().catch(() => {});

      const activeId = latestVault.activeAccountId;

      if (!activeId) {
        console.log('🔒 [AUTH] No active account. Showing login.');
        set({ isInitialized: true, isAuthenticated: false });
        return;
      }

      const tokens = await latestVault.getActiveTokens();
      if (!tokens) {
        console.log('🔒 [AUTH] No tokens for active account. Showing login.');
        set({ isInitialized: true, isAuthenticated: false });
        return;
      }

      console.log(`✅ [AUTH] Session restored for account: ${activeId}`);
      set({
        token:           tokens.accessToken,
        refreshToken:    tokens.refreshToken,
        isAuthenticated: true,
        isInitialized:   true,
      });
    } catch (error) {
      console.error('checkAuth Error:', error);
      set({ isInitialized: true, isAuthenticated: false });
    }
  },

  // ── fetchUser ─────────────────────────────────────────────────────────────
  // ✅ FIX: Sets dataLoaded=true in ALL code paths.
  //    Previously the network-error path skipped setting dataLoaded,
  //    causing the navigation guard to spin indefinitely on server downtime.

  fetchUser: async () => {
    const { token, isRefreshing, lastRefreshedAt, setIsRefreshing } = get();
    if (!token) {
      set({ dataLoaded: true }); // No token — guard should proceed
      return;
    }

    const now = Date.now();
    if (now - lastRefreshedAt < 10_000 && !isRefreshing) {
      console.log('⏳ [THROTTLE] fetchUser suppressed (10s cooldown).');
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 800);
      return;
    }

    set({ isLoadingUser: true, isRefreshing: true, lastRefreshedAt: now });

    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        const normalizedUser = {
          ...res.data.user,
          isOnboarded: !!(res.data.user.isOnboarded || res.data.user.is_onboarded),
        };
        set({ user: normalizedUser, dataLoaded: true });
      } else {
        // Server responded but not success — still mark loaded
        set({ dataLoaded: true });
      }
    } catch (error: any) {
      const status = error.response?.status;

      if (status === 401 || status === 403 || status === 404) {
        console.warn('❌ [AUTH] Session expired. Clearing credentials.');
        const { user } = get();
        if (user?.id) await useAccountVault.getState().removeAccount(user.id);
        set({
          token:           null,
          refreshToken:    null,
          user:            null,
          isAuthenticated: false,
          isLoadingUser:   false,
          dataLoaded:      true, // ✅ Mark loaded even on auth failure
        });
        return;
      }

      // Network/server error — keep token, mark loaded so guard proceeds
      console.log('⚠️ [AUTH] Backend unreachable. Keeping token.');
      set({ dataLoaded: true }); // ✅ FIX: Was missing in original code
    } finally {
      set({ isLoadingUser: false, isRefreshing: false });
    }
  },

  // ── switchAccount ─────────────────────────────────────────────────────────
  // ✅ FIX: Atomic token swap — new token and cleared user in SAME set() call.
  //    Axios interceptor never sees a null token during the transition.

  switchAccount: async (userId: string) => {
    try {
      console.log(`🔄 [AUTH] Initiating atomic switch to ${userId}...`);

      const vault          = useAccountVault.getState();
      const targetIdentity = vault.accounts[userId];

      set({ isLoadingUser: true, switchingToAccount: targetIdentity || { username: 'Account' } });

      const vaultResult = await vault.switchTo(userId);

      if (vaultResult === 'needs_reauth') {
        set({ isLoadingUser: false, switchingToAccount: null });
        return 'needs_reauth';
      }
      if (vaultResult !== 'success') {
        set({ isLoadingUser: false, switchingToAccount: null });
        return 'error';
      }

      const freshTokens = await useAccountVault.getState().getActiveTokens();
      if (!freshTokens) {
        console.error('❌ [AUTH] switchTo succeeded but getActiveTokens returned null');
        set({ isLoadingUser: false, isAuthenticated: false, switchingToAccount: null });
        return 'error';
      }

      // ✅ ATOMIC SWAP: new token + cleared user in same set()
      // Axios interceptor always has a valid token during switch.
      set({
        token:           freshTokens.accessToken,
        refreshToken:    freshTokens.refreshToken,
        user:            null,   // Clear stale profile
        isAuthenticated: true,   // Never drop — prevents guard redirect loops
        dataLoaded:      false,  // Reset so guard waits for new profile
      });

      // Small settle delay for React state batching
      await new Promise(r => setTimeout(r, 100));

      const res = await api.get('/auth/me');

      if (res.data.user) {
        const updatedUser = {
          ...res.data.user,
          isOnboarded: !!(res.data.user.is_onboarded || res.data.user.isOnboarded),
        };
        console.log(`✅ [AUTH] Switch complete. Identity: @${updatedUser.username}`);

        await new Promise(r => setTimeout(r, 300));

        set({
          user:               updatedUser,
          isLoadingUser:      false,
          switchingToAccount: null,
          dataLoaded:         true,
        });
        return 'success';
      }

      set({ isLoadingUser: false, switchingToAccount: null, dataLoaded: true });
      return 'error';
    } catch (error) {
      console.error('❌ [AUTH] Atomic switch failed:', error);
      set({ isLoadingUser: false, switchingToAccount: null });
      return 'error';
    }
  },

  // ── exchangeCode ──────────────────────────────────────────────────────────

  exchangeCode: async (code: string) => {
    set({ isLoadingUser: true });
    try {
      const res = await api.post('/auth/exchange-code', { code });
      if (res.data.success) {
        const { user, token, refreshToken, accessTokenExpiresAt } = res.data;
        await get().setAuth(user, token, refreshToken, { accessTokenExpiresAt });
      }
    } catch (error) {
      console.error('❌ [AUTH] Code exchange failed:', error);
      throw error;
    } finally {
      set({ isLoadingUser: false });
    }
  },
}));