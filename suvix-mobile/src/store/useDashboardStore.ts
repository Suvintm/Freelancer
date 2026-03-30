import { create } from 'zustand';
import { api } from '../api/client';

/**
 * DASHBOARD STORE (JioHotstar Zero-Latency)
 * 🚀 Pre-fetches analytics and home page components in the background.
 */
interface DashboardState {
  clientStats: any | null;
  editorStats: any | null;
  isLoading: boolean;
  isInitialized: boolean;
  fetchClientDashboard: () => Promise<void>;
  fetchEditorDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  clientStats: null,
  editorStats: null,
  isLoading: false,
  isInitialized: false,

  fetchClientDashboard: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/client/analytics/dashboard');
      if (res.data.success) {
        set({ clientStats: res.data.analytics, isInitialized: true });
      }
    } catch (error) {
      console.error('Fetch Client Dashboard Error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchEditorDashboard: async () => {
    try {
      set({ isLoading: true });
      // We use the "quick-stats" for the home dashboard and full analytics for details
      const res = await api.get('/editor/analytics/quick-stats');
      if (res.data.success) {
        set({ editorStats: res.data.stats, isInitialized: true });
      }
    } catch (error) {
      console.error('Fetch Editor Dashboard Error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
