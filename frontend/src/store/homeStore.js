/**
 * homeStore.js — Zustand global store for persistent UI state across navigation.
 *
 * Problem solved: When user navigates away from a page and returns, tabs and
 * scroll positions were reset. This store preserves them in memory for the
 * lifetime of the session (same as Instagram's in-memory tab state).
 *
 * Usage:
 *   import { useHomeStore } from '../store/homeStore';
 *   const { clientMainTab, setClientMainTab } = useHomeStore();
 */
import { create } from "zustand";

export const useHomeStore = create((set) => ({
  // ── Client Home ──────────────────────────────────────────────────────────
  clientMainTab:   "home",      // "home" | "dashboard"
  exploreTab: "editors",   // Global sub-tab in explore section ("editors" | "gigs" | "jobs")

  setClientMainTab:   (tab) => set({ clientMainTab: tab }),
  setExploreTab:      (tab) => set({ exploreTab: tab }),

  // ── Editor Home ──────────────────────────────────────────────────────────
  editorMainTab:    "home",     // "home" | "dashboard"

  setEditorMainTab:    (tab) => set({ editorMainTab: tab }),

  // ── Refresh Management ────────────────────────────────────────────────
  lastHomeRefresh:   0,      // Timestamp of last auto/manual refresh
  lastManualRefresh: 0,      // Timestamp of last manual pull-to-refresh
  isRefreshing:      false,  // Global refreshing state for UI indicators
  showCooldownNotice: false, // Show "Wait a moment" when refreshing too fast

  setLastHomeRefresh:   (t) => set({ lastHomeRefresh: t }),
  setLastManualRefresh: (t) => set({ lastManualRefresh: t }),
  setIsRefreshing:      (b) => set({ isRefreshing: b }),
  setShowCooldownNotice:(b) => set({ showCooldownNotice: b }),

  // ── Scroll Positions (per page key) ──────────────────────────────────────
  // Map: { pageKey: scrollY }
  scrollPositions: {},

  saveScroll: (pageKey, y) =>
    set((state) => ({
      scrollPositions: { ...state.scrollPositions, [pageKey]: y },
    })),

  getScroll: (pageKey) => (get) => get().scrollPositions[pageKey] || 0,
}));
