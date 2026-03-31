import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * PRODUCTION-GRADE PERSISTENCE SERVICE
 * Simulates the "Redis-like" experience for the mobile app.
 * Provides instant access to metadata, user settings, and cached feeds.
 */

class PersistenceService {
  /**
   * Store sensitive data (e.g. auth tokens, keys)
   */
  public async setSecure(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.error(`❌ [Persistence] Secure set failed for ${key}:`, e);
    }
  }

  /**
   * Retrieve sensitive data
   */
  public async getSecure(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  }

  /**
   * Store non-sensitive metadata (e.g. Reels metadata, UI states)
   * This is our "Redis" equivalent for the mobile frontend.
   */
  public async setCache(key: string, value: any, ttlInMinutes: number = 60) {
    try {
      const data = {
        value,
        expiry: Date.now() + ttlInMinutes * 60000,
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
      console.log(`💾 [Persistence] Cached: ${key}`);
    } catch (e) {
      console.error(`❌ [Persistence] Cache set failed for ${key}:`, e);
    }
  }

  /**
   * Get cached metadata with expiry check
   */
  public async getCache<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return null;
      }

      if (!parsed || typeof parsed !== 'object' || !('value' in parsed) || !('expiry' in parsed)) {
        return null;
      }

      const { value, expiry } = parsed;
      if (Date.now() > expiry) {
        await AsyncStorage.removeItem(key);
        console.log(`⏰ [Persistence] Cache expired: ${key}`);
        return null;
      }

      return value as T;
    } catch (e) {
      console.error(`❌ [Persistence] Cache retrieval failed for ${key}:`, e);
      return null;
    }
  }

  /**
   * Clear specific cache key
   */
  public async clear(key: string) {
    await AsyncStorage.removeItem(key);
  }
}

export const persistenceService = new PersistenceService();
