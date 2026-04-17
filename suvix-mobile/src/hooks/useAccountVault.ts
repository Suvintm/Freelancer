/**
 * useAccountVault.ts — The Multi-Account Session Vault
 *
 * ARCHITECTURE:
 * We split storage into multiple SecureStore keys to avoid the 2048-byte limit:
 *   - 'suvix_vault_meta'    → Vault metadata (active account ID, identity list — no tokens)
 *   - 'suvix_token_{userId}' → Per-user tokens (kept small and separate)
 *
 * This means each SecureStore write is tiny, fast, and never hits the byte limit.
 */
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../api/client';

// ─── Storage Key Helpers ────────────────────────────────────────────────────
const VAULT_META_KEY = 'suvix_vault_meta_v1';
const tokenKey = (userId: string) => `suvix_token_${userId}`;

// ─── Types ──────────────────────────────────────────────────────────────────
export interface AccountIdentity {
  userId: string;
  username: string;
  displayName: string;
  email: string;
  profilePicture: string | null;
  accountType: string;
  isOnboarded: boolean;
  addedAt: number;
  lastActiveAt: number;
  isRememberedOnly: boolean; // true = token expired, shows "Tap to log in" UI
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number; // Unix ms — for proactive refresh
  refreshExpiresAt: number;     // Unix ms — if expired, must re-login
}

export interface StoredAccount extends AccountIdentity, StoredTokens {}

interface VaultMeta {
  version: 1;
  activeAccountId: string | null;
  accounts: Record<string, AccountIdentity>;
}

interface AccountVaultState {
  // In-memory state (rebuilt from SecureStore on boot)
  activeAccountId: string | null;
  accounts: Record<string, AccountIdentity>;
  isLoaded: boolean;

  // Boot — loads vault from SecureStore into RAM
  loadVault: () => Promise<void>;

  // Add or overwrite an account (called after login)
  addAccount: (account: StoredAccount) => Promise<void>;

  // Remove an account (called on logout or "Remove Account")
  // Returns the userId of the next account to switch to, or null if none left
  removeAccount: (userId: string) => Promise<string | null>;

  // Switch the active account. Handles proactive token refresh.
  // Returns 'success' | 'needs_reauth' | 'error'
  switchTo: (userId: string) => Promise<'success' | 'needs_reauth' | 'error'>;

  // Get the current active account's tokens from SecureStore
  getActiveTokens: () => Promise<StoredTokens | null>;

  // Get all account identities for the switcher UI
  getAllAccounts: () => AccountIdentity[];

  // Get a specific account's tokens (for the 401 handler in client.ts)
  getTokensFor: (userId: string) => Promise<StoredTokens | null>;

  // Update tokens after a silent refresh
  updateTokens: (userId: string, tokens: StoredTokens) => Promise<void>;

  // Mark an account as "remembered only" (refresh token expired)
  markAsRemembered: (userId: string) => Promise<void>;

  // 🛰️ SANITIZATION — Compare local vault against server DB
  // This will remove any accounts that no longer exist on the server.
  validateVaultIntegrity: () => Promise<void>;

  // Complete vault wipe (nuclear option)
  clearAll: () => Promise<void>;
}

// ─── Vault Store ────────────────────────────────────────────────────────────
export const useAccountVault = create<AccountVaultState>((set, get) => ({
  activeAccountId: null,
  accounts: {},
  isLoaded: false,

  loadVault: async () => {
    try {
      const raw = await SecureStore.getItemAsync(VAULT_META_KEY);
      if (!raw) {
        set({ isLoaded: true });
        return;
      }
      const meta: VaultMeta = JSON.parse(raw);
      set({
        activeAccountId: meta.activeAccountId,
        accounts: meta.accounts || {},
        isLoaded: true,
      });
    } catch {
      // Corrupted vault — start fresh
      await SecureStore.deleteItemAsync(VAULT_META_KEY);
      set({ isLoaded: true });
    }
  },

  addAccount: async (account) => {
    const { accounts } = get();

    // 1. Save identity (no tokens) to meta
    const identity: AccountIdentity = {
      userId: account.userId,
      username: account.username,
      displayName: account.displayName,
      email: account.email,
      profilePicture: account.profilePicture,
      accountType: account.accountType,
      isOnboarded: account.isOnboarded,
      addedAt: accounts[account.userId]?.addedAt ?? Date.now(), // Preserve original add time
      lastActiveAt: Date.now(),
      isRememberedOnly: false,
    };

    const newAccounts = { ...accounts, [account.userId]: identity };

    const meta: VaultMeta = {
      version: 1,
      activeAccountId: account.userId, // Newly added account becomes active
      accounts: newAccounts,
    };
    await SecureStore.setItemAsync(VAULT_META_KEY, JSON.stringify(meta));

    // 2. Save tokens separately (keeps each key small)
    const tokens: StoredTokens = {
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      accessTokenExpiresAt: account.accessTokenExpiresAt,
      refreshExpiresAt: account.refreshExpiresAt,
    };
    await SecureStore.setItemAsync(tokenKey(account.userId), JSON.stringify(tokens));

    set({ accounts: newAccounts, activeAccountId: account.userId });
  },

  removeAccount: async (userId) => {
    const { accounts, activeAccountId } = get();

    // Delete tokens for this account
    await SecureStore.deleteItemAsync(tokenKey(userId));

    const newAccounts = { ...accounts };
    delete newAccounts[userId];

    // Determine next active account
    const remainingIds = Object.keys(newAccounts);
    let newActiveId: string | null = null;

    if (activeAccountId === userId) {
      // We removed the active one — pick the most recently used alternative
      if (remainingIds.length > 0) {
        const sorted = remainingIds.sort(
          (a, b) => (newAccounts[b].lastActiveAt ?? 0) - (newAccounts[a].lastActiveAt ?? 0)
        );
        newActiveId = sorted[0];
      }
    } else {
      newActiveId = activeAccountId;
    }

    const meta: VaultMeta = {
      version: 1,
      activeAccountId: newActiveId,
      accounts: newAccounts,
    };
    await SecureStore.setItemAsync(VAULT_META_KEY, JSON.stringify(meta));
    set({ accounts: newAccounts, activeAccountId: newActiveId });

    return newActiveId;
  },

  switchTo: async (userId) => {
    const { accounts } = get();
    const identity = accounts[userId];
    if (!identity) return 'error';

    if (identity.isRememberedOnly) return 'needs_reauth';

    // Load tokens for this account
    const tokens = await get().getTokensFor(userId);
    if (!tokens) return 'needs_reauth';

    const now = Date.now();

    // Case 1: Access token still valid → just switch
    if (tokens.accessTokenExpiresAt > now + 30_000) { // 30s buffer
      await _setActiveAccount(userId, accounts);
      set({ activeAccountId: userId });
      return 'success';
    }

    // Case 2: Access expired, refresh token still valid → silent refresh
    if (tokens.refreshExpiresAt > now) {
      try {
        const res = await api.post('/auth/refresh-token', {
          refreshToken: tokens.refreshToken,
        });
        if (res.data.success) {
          const newTokens: StoredTokens = {
            accessToken: res.data.token,
            refreshToken: res.data.refreshToken,
            accessTokenExpiresAt: res.data.accessTokenExpiresAt ?? now + 15 * 60 * 1000,
            refreshExpiresAt: tokens.refreshExpiresAt, // Server rotation gives new one
          };
          await get().updateTokens(userId, newTokens);
          await _setActiveAccount(userId, accounts);
          set({ activeAccountId: userId });
          return 'success';
        }
      } catch {
        // Refresh failed — mark as remembered only
        await get().markAsRemembered(userId);
        return 'needs_reauth';
      }
    }

    // Case 3: Both expired → mark remembered, require re-login
    await get().markAsRemembered(userId);
    return 'needs_reauth';
  },

  getActiveTokens: async () => {
    const { activeAccountId } = get();
    if (!activeAccountId) return null;
    return get().getTokensFor(activeAccountId);
  },

  getTokensFor: async (userId) => {
    try {
      const raw = await SecureStore.getItemAsync(tokenKey(userId));
      if (!raw) return null;
      return JSON.parse(raw) as StoredTokens;
    } catch {
      return null;
    }
  },

  getAllAccounts: () => {
    const { accounts } = get();
    return Object.values(accounts).sort(
      (a, b) => (b.lastActiveAt ?? 0) - (a.lastActiveAt ?? 0)
    );
  },

  updateTokens: async (userId, tokens) => {
    await SecureStore.setItemAsync(tokenKey(userId), JSON.stringify(tokens));
  },

  markAsRemembered: async (userId) => {
    const { accounts } = get();
    if (!accounts[userId]) return;

    const newAccounts = {
      ...accounts,
      [userId]: { ...accounts[userId], isRememberedOnly: true },
    };

    const meta: VaultMeta = {
      version: 1,
      activeAccountId: get().activeAccountId,
      accounts: newAccounts,
    };
    await SecureStore.setItemAsync(VAULT_META_KEY, JSON.stringify(meta));
    set({ accounts: newAccounts });
  },

  validateVaultIntegrity: async () => {
    const { accounts } = get();
    const userIds = Object.keys(accounts);

    if (userIds.length === 0) return;

    try {
      console.log('🛰️ [VAULT] Initiating background integrity sync with DB...');
      const res = await api.post('/auth/validate-vault', { userIds });

      if (res.data.success && Array.isArray(res.data.validIds)) {
        const validIds = new Set(res.data.validIds);
        const toRemove = userIds.filter(id => !validIds.has(id));

        if (toRemove.length > 0) {
          console.log(`🧹 [VAULT] Purging ${toRemove.length} ghost accounts from device...`);
          for (const id of toRemove) {
            await get().removeAccount(id);
          }
        } else {
          console.log('✅ [VAULT] Integrity check passed. All accounts are valid.');
        }
      }
    } catch (error) {
      console.warn('⚠️ [VAULT] Background integrity sync failed:', error);
    }
  },

  clearAll: async () => {
    const { accounts } = get();
    // Delete all token keys
    for (const userId of Object.keys(accounts)) {
      await SecureStore.deleteItemAsync(tokenKey(userId));
    }
    await SecureStore.deleteItemAsync(VAULT_META_KEY);
    set({ activeAccountId: null, accounts: {} });
  },
}));

// ─── Internal Helper ─────────────────────────────────────────────────────────
async function _setActiveAccount(
  userId: string,
  accounts: Record<string, AccountIdentity>
) {
  const updatedAccounts = {
    ...accounts,
    [userId]: { ...accounts[userId], lastActiveAt: Date.now() },
  };
  const meta: VaultMeta = {
    version: 1,
    activeAccountId: userId,
    accounts: updatedAccounts,
  };
  await SecureStore.setItemAsync(VAULT_META_KEY, JSON.stringify(meta));
}
