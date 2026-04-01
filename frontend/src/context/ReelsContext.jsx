import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";

/**
 * ReelsContext — Global state that survives navigation.
 *
 * DSA Upgrade: Feed cache upgraded from plain Array (O(N) dedup) to
 * JavaScript Map (O(1) get/set/delete, insertion-order preserved).
 * LRU eviction applied when cap is exceeded: oldest entry is dropped.
 *
 * Algorithm: LRU Cache using Map (insertion-order in JS ES2015+)
 *   - get:    O(1) — Map.has()
 *   - set:    O(1) — Map.set()
 *   - evict:  O(1) — Map.keys().next() + Map.delete()
 *
 * Cache is valid for 15 minutes. After that, pull-to-refresh fetches fresh reels.
 */

const ReelsContext = createContext(null);
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const LRU_MAX_SIZE = 200; // Max reels to hold in client memory

// ── LRU Cache (Map-based, O(1) operations) ───────────────────────────────────
class LRUCache {
    constructor(maxSize = LRU_MAX_SIZE) {
        this.maxSize = maxSize;
        this.map = new Map(); // Preserves insertion order → oldest = first entry
    }

    /** O(1) — Check if a key exists */
    has(key) { return this.map.has(key); }

    /** O(1) — Get a value. Promotes to "most recent" by re-inserting. */
    get(key) {
        if (!this.map.has(key)) return undefined;
        const value = this.map.get(key);
        // Promote to end (most recently used)
        this.map.delete(key);
        this.map.set(key, value);
        return value;
    }

    /** O(1) — Set a value. Evicts oldest if at capacity. */
    set(key, value) {
        if (this.map.has(key)) this.map.delete(key); // Re-insert to promote
        else if (this.map.size >= this.maxSize) {
            // Evict the oldest entry (first key in Map iteration order)
            const oldest = this.map.keys().next().value;
            this.map.delete(oldest);
        }
        this.map.set(key, value);
    }

    /** O(1) — Delete a specific key */
    delete(key) { this.map.delete(key); }

    /** O(1) — Get all values in insertion order (oldest → newest) */
    values() { return [...this.map.values()]; }

    /** O(1) — Current count */
    get size() { return this.map.size; }

    /** O(N) — Clear all entries */
    clear() { this.map.clear(); }

    /**
     * Deduplicated merge: add new reels to cache.
     * Existing entries are refreshed (promoted to newest). O(M) where M = newReels.length
     */
    mergeReels(newReels) {
        for (const reel of newReels) {
            this.set(String(reel._id), reel);
        }
    }

    /** Update a specific reel's fields in the cache. O(1) */
    update(key, updates) {
        if (!this.map.has(key)) return;
        const current = this.map.get(key);
        const updated = { ...current, ...updates };
        this.map.set(key, updated);
    }

    /**
     * Returns all cached reels as an array, newest last.
     */
    toArray() { return this.values(); }
}

export const ReelsProvider = ({ children }) => {
    // Replace plain array ref with LRU Cache
    const feedLRU = useRef(new LRUCache(LRU_MAX_SIZE));
    const activeIndexCache = useRef(0);
    const pageCache = useRef(1);
    const lastFetchTime = useRef(null);
    const scrollPositionCache = useRef(0);

    // — PERSISTENCE: Initialize Cache from LocalStorage on first load —
    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {
        try {
            const navigation = performance.getEntriesByType("navigation")[0];
            const isHardReload = navigation?.type === "reload";
            
            const savedCache = localStorage.getItem("suvix_reels_cache_v1");
            if (savedCache) {
                const { data, timestamp, page, activeIndex } = JSON.parse(savedCache);
                
                // — PRODUCT LOGIC: Instagram/TikTok Style Persistence —
                // 1. If Hard Reload (F5): Reset position and invalidate cache -> Get fresh feed
                // 2. If Cold Start (Initial Load): Restore cache but start at position 0
                // 3. If SPA Navigation (Internal): Keep everything persistent (handled by memory)
                
                if (isHardReload) {
                    console.info("[ReelsContext] Hard Reload detected. Invalidating cache for fresh feed.");
                    // No restore -> triggers fetch in ReelsPage
                } else {
                    // Only restore if cache is reasonably young (e.g. 24 hours) or user is offline
                    const isRelevant = Date.now() - timestamp < 24 * 60 * 60 * 1000 || !navigator.onLine;
                    
                    if (isRelevant && data?.length > 0) {
                        feedLRU.current.clear();
                        feedLRU.current.mergeReels(data);
                        lastFetchTime.current = timestamp;
                        // For a cold start, we still reset to page 1 / index 0 usually, 
                        // but we keep the data so it loads instantly.
                        // pageCache.current = page || 1;
                        // activeIndexCache.current = activeIndex || 0;
                    }
                }
            }
        } catch (err) {
            console.error("[ReelsContext] Persistence Restore Error:", err);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    // Helper to sync to disk
    const syncToDisk = useCallback(() => {
        try {
            const cacheData = {
                data: feedLRU.current.toArray(),
                timestamp: lastFetchTime.current,
                page: pageCache.current,
                activeIndex: activeIndexCache.current
            };
            localStorage.setItem("suvix_reels_cache_v1", JSON.stringify(cacheData));
        } catch (err) {
            console.warn("[ReelsContext] Persistence Save Error (likely quota):", err);
        }
    }, []);

    // Global preferences — Persistent across sessions
    const [globalMuted, _setGlobalMuted] = useState(() => {
        const saved = localStorage.getItem("reels_global_muted");
        // Default to false (unmuted) as requested by user, unless they've explicitly muted before
        return saved === null ? false : saved === "true";
    });

    const setGlobalMuted = useCallback((val) => {
        const newValue = typeof val === 'function' ? val(globalMuted) : val;
        _setGlobalMuted(newValue);
        localStorage.setItem("reels_global_muted", String(newValue));
    }, [globalMuted]);

    // Backward-compat: expose feedCache.current as an array (used by ReelsPage)
    // This is a computed ref so consumers get array-like access
    const feedCache = {
        get current() { return feedLRU.current.toArray(); },
    };

    /** Returns true if the feed cache is still fresh enough to use. */
    const isCacheValid = useCallback(() => {
        if (!lastFetchTime.current || feedLRU.current.size === 0) return false;
        // Extend validity for offline mode
        if (!navigator.onLine) return true;
        return Date.now() - lastFetchTime.current < CACHE_DURATION_MS;
    }, []);

    /** Saves a new batch of reels to the cache (replaces current). */
    const updateCache = useCallback((reels, page) => {
        feedLRU.current.clear();
        feedLRU.current.mergeReels(reels);
        pageCache.current = page;
        lastFetchTime.current = Date.now();
        syncToDisk();
    }, [syncToDisk]);

    /**
     * Appends more reels to cache (infinite scroll).
     * LRU Map auto-deduplicates by _id and auto-evicts when over LRU_MAX_SIZE.
     */
    const appendToCache = useCallback((newReels, page) => {
        feedLRU.current.mergeReels(newReels);
        pageCache.current = page;
        lastFetchTime.current = Date.now();
        syncToDisk();
    }, [syncToDisk]);

    /** Invalidates the cache, forcing a fresh fetch on next visit. */
    const invalidateCache = useCallback(() => {
        feedLRU.current.clear();
        lastFetchTime.current = null;
        pageCache.current = 1;
        activeIndexCache.current = 0;
        scrollPositionCache.current = 0;
        localStorage.removeItem("suvix_reels_cache_v1");
    }, []);

    /** Partially updates a reel's state in the cache (Likes, Follows, etc.) */
    const updateReelInCache = useCallback((reelId, updates) => {
        feedLRU.current.update(String(reelId), updates);
        syncToDisk();
    }, [syncToDisk]);

    /** Updates the remembered scroll position (active reel index). */
    const savePosition = useCallback((index) => {
        activeIndexCache.current = index;
        syncToDisk(); // Update active index in persistent storage too
    }, [syncToDisk]);

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
                updateReelInCache,
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
