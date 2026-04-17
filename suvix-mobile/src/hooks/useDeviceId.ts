/**
 * useDeviceId.ts
 *
 * Generates and persists a unique, permanent device fingerprint.
 * Survives app restarts. May survive reinstall on iOS (Keychain persists).
 * This ID is bound to every session on the backend for security tracking.
 */
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = 'suvix_device_id';
let cachedDeviceId: string | null = null;

/**
 * Gets or generates the permanent device ID.
 * Call this at app boot. Result is cached in memory after first call.
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    // Try reading existing ID from SecureStore
    const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }

    // First install — generate a new UUID
    const newId = Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
    cachedDeviceId = newId;
    return newId;
  } catch (error) {
    // Fallback: generate a non-persistent ID (won't survive reinstall but won't crash)
    if (!cachedDeviceId) {
      cachedDeviceId = Crypto.randomUUID();
    }
    return cachedDeviceId;
  }
}

/**
 * Synchronous getter — only works after getDeviceId() has been called at least once.
 * Safe to use inside Axios interceptors where async is not available.
 */
export function getDeviceIdSync(): string | null {
  return cachedDeviceId;
}
