import { createContext, useContext, useRef, useState, useCallback } from "react";

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
        return Date.now() - lastFetchTime.current < CACHE_DURATION_MS;
    }, []);

    /** Saves a new batch of reels to the cache (replaces current). */
    const updateCache = useCallback((reels, page) => {
        feedLRU.current.clear();
        feedLRU.current.mergeReels(reels);
        pageCache.current = page;
        lastFetchTime.current = Date.now();
    }, []);

    /**
     * Appends more reels to cache (infinite scroll).
     * LRU Map auto-deduplicates by _id and auto-evicts when over LRU_MAX_SIZE.
     */
    const appendToCache = useCallback((newReels, page) => {
        feedLRU.current.mergeReels(newReels);
        pageCache.current = page;
        lastFetchTime.current = Date.now();
    }, []);

    /** Invalidates the cache, forcing a fresh fetch on next visit. */
    const invalidateCache = useCallback(() => {
        feedLRU.current.clear();
        lastFetchTime.current = null;
        pageCache.current = 1;
        activeIndexCache.current = 0;
        scrollPositionCache.current = 0;
    }, []);

    /** Updates the remembered scroll position (active reel index). */
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
