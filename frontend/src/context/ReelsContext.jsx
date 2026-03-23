import { createContext, useContext, useRef, useState, useCallback } from "react";

/**
 * ReelsContext — Global state that survives navigation.
 * 
 * Stores the feed array, current scroll position, page number,
 * and global mute preference so the user returns to exactly where they left off.
 * Cache is valid for 5 minutes. After that, pull-to-refresh fetches fresh reels.
 */

const ReelsContext = createContext(null);

const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const ReelsProvider = ({ children }) => {
    // Feed cache — persists between navigations
    const feedCache = useRef([]);
    const activeIndexCache = useRef(0);
    const pageCache = useRef(1);
    const lastFetchTime = useRef(null);
    const scrollPositionCache = useRef(0);

    // Global preferences
    const [globalMuted, setGlobalMuted] = useState(true); // Start muted for reliable browser autoplay

    /**
     * Returns true if the feed cache is still fresh enough to use.
     */
    const isCacheValid = useCallback(() => {
        if (!lastFetchTime.current || feedCache.current.length === 0) return false;
        return Date.now() - lastFetchTime.current < CACHE_DURATION_MS;
    }, []);

    /**
     * Saves a new batch of reels to the cache.
     */
    const updateCache = useCallback((reels, page) => {
        feedCache.current = reels;
        pageCache.current = page;
        lastFetchTime.current = Date.now();
    }, []);

    /**
     * Appends more reels to the existing cache (infinite scroll).
     * Automatically handles deduplication by _id.
     */
    const appendToCache = useCallback((newReels, page) => {
        const combined = [...feedCache.current, ...newReels];
        // Deduplicate by _id to ensure no components render with duplicate keys
        const unique = Array.from(new Map(combined.map(r => [r._id, r])).values());
        
        feedCache.current = unique;
        pageCache.current = page;
        lastFetchTime.current = Date.now();
    }, []);

    /**
     * Invalidates the cache, forcing a fresh fetch on next visit.
     */
    const invalidateCache = useCallback(() => {
        feedCache.current = [];
        lastFetchTime.current = null;
        pageCache.current = 1;
        activeIndexCache.current = 0;
        scrollPositionCache.current = 0;
    }, []);

    /**
     * Updates the remembered scroll position (active reel index).
     */
    const savePosition = useCallback((index) => {
        activeIndexCache.current = index;
    }, []);

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
