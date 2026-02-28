/**
 * useScrollRestore.js — Custom hook for saving and restoring scroll position.
 *
 * On mount:  Reads saved scroll position from Zustand store and scrolls to it.
 * On unmount: Saves the current window.scrollY to the store for this page key.
 *
 * Usage:
 *   useScrollRestore('clientHome');
 *   useScrollRestore('editorHome');
 */
import { useEffect } from "react";
import { useHomeStore } from "../store/homeStore";

const useScrollRestore = (pageKey) => {
  const scrollPositions = useHomeStore((s) => s.scrollPositions);
  const saveScroll = useHomeStore((s) => s.saveScroll);

  // 1. Mandatory Restore or Reset on Mount
  useEffect(() => {
    const saved = scrollPositions[pageKey];
    
    // Use a small delay for both cases to ensure DOM is ready
    const t = setTimeout(() => {
      if (saved !== undefined && saved > 0) {
        window.scrollTo({ top: saved, behavior: "instant" });
      } else {
        // CRITICAL: If no saved state, FORCE scroll to top.
        // This prevents "bleeding" from the previous page's scroll position.
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    }, 100);

    return () => clearTimeout(t);
  }, [pageKey]); // Re-run if pageKey changes (useful for tab switches)

  // 2. Save on Unmount/Switch
  useEffect(() => {
    return () => {
      // Save current position before the component is destroyed
      saveScroll(pageKey, window.scrollY);
    };
  }, [pageKey, saveScroll]);
};

export default useScrollRestore;
