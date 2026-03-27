import { QueryClient } from '@tanstack/react-query';

// Production-grade Query Client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false, // Prevents unnecessary refetching on mobile
    },
    mutations: {
      retry: 1,
    },
  },
});
