import { useCallback } from 'react';
import { useRefreshLimitStore } from '../store/useRefreshLimitStore';

/**
 * Custom hook to wrap fetch actions with a global rate limit.
 * Enforces 3 refreshes per 10 seconds.
 */
export const useRefreshManager = (onRefresh: () => Promise<void> | void) => {
  const { claimRefresh } = useRefreshLimitStore();

  const throttledRefresh = useCallback(async () => {
    const isAllowed = claimRefresh();
    
    if (isAllowed) {
      await onRefresh();
    } else {
      console.log('🛑 [REFRESH] Rate limit hit. Suppression active.');
    }
  }, [onRefresh, claimRefresh]);

  return throttledRefresh;
};
