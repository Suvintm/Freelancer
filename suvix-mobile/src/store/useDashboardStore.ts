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
  // Legacy stubs for compatibility during refactor
  fetchClientDashboard: () => Promise<void>;
  fetchEditorDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  isLoading: false,
  isInitialized: false,

  fetchDashboardStats: async (roleGroup) => {
    try {
      set({ isLoading: true });
      // Resolve endpoint based on Group
      const endpoint = roleGroup === 'CLIENT' 
        ? '/client/analytics/dashboard' 
        : '/editor/analytics/quick-stats';
        
      const res = await api.get(endpoint);
      if (res.data.success) {
        set({ 
          stats: res.data.analytics || res.data.stats, 
          isInitialized: true 
        });
      }
    } catch (error) {
      console.error('Fetch Dashboard Stats Error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Compatibility Layers
  fetchClientDashboard: () => get().fetchDashboardStats('CLIENT'),
  fetchEditorDashboard: () => get().fetchDashboardStats('PROVIDER'),
}));
