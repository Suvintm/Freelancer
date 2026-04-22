/**
 * queryClient.js — React Query configuration
 *
 * Strategy:
 * - staleTime: 5 minutes — data is considered fresh for 5 min.
 *   No refetch will happen on navigation or component remount within this window.
 * - gcTime: 30 minutes — unused data is kept in memory for 30 min.
 *   Coming back to a page within 30 min = instant, zero API calls.
 * - refetchOnWindowFocus: false — browser tab regaining focus will NOT trigger refetch.
 * - refetchOnMount: false — remounting a component will NOT trigger refetch if cache is fresh.
 * - retry: 1 — failed requests retry once before giving up.
 */
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            5 * 60 * 1000,  // 5 minutes
      gcTime:              30 * 60 * 1000,  // 30 minutes in memory
      refetchOnWindowFocus: false,
      refetchOnMount:       false,
      refetchOnReconnect:   false,
      retry:                1,
    },
  },
});
