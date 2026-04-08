import { create } from 'zustand';
import { api } from '../api/client';

/**
 * DASHBOARD STORE (JioHotstar Zero-Latency)
 * 🚀 Pre-fetches analytics and home page components in the background.
 */
/**
 * DASHBOARD STORE (Unified Dynamic Workflow)
 * 🚀 Pre-fetches analytics and home page components in the background.
 */
interface DashboardState {
  stats: any | null;
  isLoading: boolean;
  isInitialized: boolean;
  fetchDashboardStats: (roleGroup: 'CLIENT' | 'PROVIDER') => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  isLoading: false,
  isInitialized: false,

  fetchDashboardStats: async () => {
    // Analytics system is currently being overhauled. 
    // Defunct endpoints (/editor/analytics/quick-stats) have been removed to prevent 404 errors.
    set({ isInitialized: true, stats: null });
  },

  // Legacy stubs kept as no-ops to prevent breakages in calling components
  fetchClientDashboard: async () => {},
  fetchEditorDashboard: async () => {},
}));
