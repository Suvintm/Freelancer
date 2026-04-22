import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useHomeStore } from "../store/homeStore";

const AUTO_REFRESH_THRESHOLD = 10 * 60 * 1000; // 10 minutes
const MANUAL_COOLDOWN = 5 * 1000;              // 5 seconds

/**
 * useRefreshManager — A central hook to manage data freshness across Home pages.
 * Handles auto-refresh on mount/tab refocus and manual pull-to-refresh.
 */
const useRefreshManager = () => {
    const queryClient = useQueryClient();
    const { 
        lastHomeRefresh, 
        lastManualRefresh, 
        setLastHomeRefresh, 
        setLastManualRefresh,
        setIsRefreshing,
        setShowCooldownNotice 
    } = useHomeStore();

    // ── CORE REFRESH LOGIC ───────────────────────────────────────────────
    /**
     * triggerRefresh — Invalidates queries.
     * @param {boolean} isManual - Whether this was triggered by user action.
     * @param {string[]} queryKeys - Specific keys to invalidate. If empty, invalidates ALL tab keys.
     */
    const triggerRefresh = useCallback(async (isManual = false, queryKeys = []) => {
        const now = Date.now();
        const COOLDOWN = 10000; // 10 seconds

        // 1. Manual Rate Limiting (Cooldown)
        if (isManual && now - lastManualRefresh < COOLDOWN) {
            console.log("[Refresh] Skipping manual refresh: Cooldown active.");
            setShowCooldownNotice(true);
            setTimeout(() => setShowCooldownNotice(false), 2000);
            return false;
        }

        console.log(`[Refresh] Triggering ${isManual ? "MANUAL" : "AUTO"} refresh for keys:`, queryKeys.length ? queryKeys : "ALL");
        
        setIsRefreshing(true);
        if (isManual) setLastManualRefresh(now);
        setLastHomeRefresh(now);

        try {
            // Define all tab-related query keys
            const allKeys = [
                ['homeData'], ['home-ads'], ['orders'], ['explore'], 
                ['editorStats'], ['editorGigStats'], ['profile'], 
                ['profileCompletion'], ['storageStatus'], ['location', 'nearby'], 
                ['jobs'], ['banners'], ['jobApplications'], ['notifications'],
                ['reels'], ['completionStatus']
            ];

            // Determine which keys to invalidate
            const keysToInvalidate = queryKeys.length > 0 
                ? queryKeys.map(k => Array.isArray(k) ? k : [k]) 
                : allKeys;

            await Promise.all(
                keysToInvalidate.map(key => queryClient.invalidateQueries({ queryKey: key }))
            );
            
            return true;
        } catch (err) {
            console.error("[Refresh] Refresh failed:", err);
            return false;
        } finally {
            setIsRefreshing(false);
        }
    }, [queryClient, lastManualRefresh, setLastHomeRefresh, setLastManualRefresh, setIsRefreshing, setShowCooldownNotice]);

    // ── AUTO REFRESH TRIGGER ─────────────────────────────────────────────
    useEffect(() => {
        const checkAutoRefresh = () => {
            const now = Date.now();
            if (now - lastHomeRefresh > AUTO_REFRESH_THRESHOLD) {
                triggerRefresh(false);
            }
        };

        // Check on mount
        checkAutoRefresh();

        // Check on window/tab focus (Instagram style)
        window.addEventListener("focus", checkAutoRefresh);
        return () => window.removeEventListener("focus", checkAutoRefresh);
    }, [lastHomeRefresh, triggerRefresh]);

    return { triggerRefresh };
};

export default useRefreshManager;
