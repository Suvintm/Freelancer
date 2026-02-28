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
    const triggerRefresh = useCallback(async (isManual = false) => {
        const now = Date.now();

        // 1. Manual Rate Limiting (Cooldown)
        if (isManual && now - lastManualRefresh < MANUAL_COOLDOWN) {
            console.log("[Refresh] Skipping manual refresh: Cooldown active.");
            
            // Show "Wait a moment" notice
            setShowCooldownNotice(true);
            setTimeout(() => setShowCooldownNotice(false), 2000);
            
            return false;
        }

        console.log(`[Refresh] Triggering ${isManual ? "MANUAL" : "AUTO"} refresh...`);
        
        setIsRefreshing(true);
        if (isManual) setLastManualRefresh(now);
        setLastHomeRefresh(now);

        try {
            // Invalidate all queries tagged with 'homeData' or 'home-ads'
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['homeData'] }),
                queryClient.invalidateQueries({ queryKey: ['home-ads'] })
            ]);
            
            // Optional: Add a slight artificial delay for the spinner to feel "premium"
            await new Promise(resolve => setTimeout(resolve, 400));
            return true;
        } catch (err) {
            console.error("[Refresh] Refresh failed:", err);
            return false;
        } finally {
            setIsRefreshing(false);
        }
    }, [queryClient, lastManualRefresh, setLastHomeRefresh, setLastManualRefresh, setIsRefreshing]);

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
