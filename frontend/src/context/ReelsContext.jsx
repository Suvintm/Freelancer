import { createContext, useContext, useRef, useState } from "react";

/**
 * ReelsContext — Global state that survives navigation.
 * 
 * Stores the feed array, current scroll position, page number,
 * and global mute preference so the user returns to exactly where they left off.
 * Cache is valid for 5 minutes. After that, pull-to-refresh fetches fresh reels.
 */

const ReelsContext = createContext(null);

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const ReelsProvider = ({ children }) => {
    // Feed cache — persists between navigations
    const feedCache = useRef([]);
    const activeIndexCache = useRef(0);
    const pageCache = useRef(1);
    const lastFetchTime = useRef(null);
    const scrollPositionCache = useRef(0);

    // Global preferences
    const [globalMuted, setGlobalMuted] = useState(false); // Start unmuted

    /**
     * Returns true if the feed cache is still fresh enough to use.
     */
    const isCacheValid = () => {
        if (!lastFetchTime.current || feedCache.current.length === 0) return false;
        return Date.now() - lastFetchTime.current < CACHE_DURATION_MS;
    };

    /**
     * Saves a new batch of reels to the cache.
     */
    const updateCache = (reels, page) => {
        feedCache.current = reels;
        pageCache.current = page;
        lastFetchTime.current = Date.now();
    };

    /**
     * Appends more reels to the existing cache (infinite scroll).
     */
    const appendToCache = (newReels, page) => {
        feedCache.current = [...feedCache.current, ...newReels];
        pageCache.current = page;
        lastFetchTime.current = Date.now();
    };

    /**
     * Invalidates the cache, forcing a fresh fetch on next visit.
     */
    const invalidateCache = () => {
        feedCache.current = [];
        lastFetchTime.current = null;
        pageCache.current = 1;
        activeIndexCache.current = 0;
        scrollPositionCache.current = 0;
    };

    /**
     * Updates the remembered scroll position (active reel index).
     */
    const savePosition = (index) => {
        activeIndexCache.current = index;
    };

    return (
        <ReelsContext.Provider
            value={{
                feedCache,
                activeIndexCache,
                pageCache,
                scrollPositionCache,
                globalMuted,
                setGlobalMuted,
                isCacheValid,
                updateCache,
                appendToCache,
                invalidateCache,
                savePosition,
            }}
        >
            {children}
        </ReelsContext.Provider>
    );
};

export const useReelsContext = () => {
    const ctx = useContext(ReelsContext);
    if (!ctx) throw new Error("useReelsContext must be used inside <ReelsProvider>");
    return ctx;
};
