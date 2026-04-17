import { create } from 'zustand';

interface RefreshLimitState {
  refreshHistory: number[]; // Array of last 3 completion timestamps
  isVisible: boolean;
  
  /**
   * Attempts to 'claim' a refresh slot.
   * Returns true if allowed, or false if rate-limited.
   */
  claimRefresh: () => boolean;
  setVisible: (visible: boolean) => void;
}

const LIMIT_COUNT = 2;
const TIME_WINDOW_MS = 10000; // 10 seconds

export const useRefreshLimitStore = create<RefreshLimitState>((set, get) => ({
  refreshHistory: [],
  isVisible: false,

  claimRefresh: () => {
    const now = Date.now();
    const { refreshHistory } = get();

    // 1. Clean history (only keep refreshes within the 10s window)
    const validHistory = refreshHistory.filter(ts => now - ts < TIME_WINDOW_MS);

    // 2. Check if we have room
    if (validHistory.length >= LIMIT_COUNT) {
      set({ isVisible: true });
      return false;
    }

    // 3. Update history with a new attempt
    set({ refreshHistory: [...validHistory, now] });
    return true;
  },

  setVisible: (visible) => set({ isVisible: visible }),
}));
