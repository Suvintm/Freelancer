import { useState, useEffect } from 'react';
import { persistenceService } from '../services/persistenceService';

/**
 * PRODUCTION-GRADE CACHE HOOK
 * 
 * Provides a React-friendly interface for the "Redis-like" PersistenceService.
 * Automatically loads data on mount and provides setters that persist.
 */

export function useCache<T>(key: string, initialValue: T | null = null) {
  const [data, setData] = useState<T | null>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const cached = await persistenceService.getCache<T>(key);
      if (cached !== null) {
        setData(cached);
      }
      setIsLoading(false);
    }
    load();
  }, [key]);

  const updateCache = async (newValue: T) => {
    setData(newValue);
    await persistenceService.setCache(key, newValue);
  };

  const clearCache = async () => {
    setData(null);
    await persistenceService.clear(key);
  };

  return { data, updateCache, clearCache, isLoading };
}
