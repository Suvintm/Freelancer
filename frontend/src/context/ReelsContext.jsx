import { createContext, useContext, useRef, useState, useCallback, useEffect, useMemo } from "react";
import { get, set, del } from "idb-keyval";

/**
 * ReelsContext — Pro-Level Async Smart Engine.
 *
 * ARCHITECTURE:
 * 1. HOT (Memory): LRU Cache (Map) for O(1) synchronous UI access.
 * 2. WARM (Disk): IndexedDB (Asynchronous) via idb-keyval. No main-thread blocking.
 * 3. INTELLIGENCE: Network-Aware preloading depth (WiFi vs 4G).
 * 4. EFFICIENCY: Debounced Persistence to prevent disk I/O congestion.
 */

const ReelsContext = createContext(null);
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const LRU_MAX_SIZE = 250; // Increased for Pro-Level capacity
const PERSISTENCE_KEY = "suvix_reels_v2_idb";

// ── LRU Cache (Map-based, O(1) operations) ───────────────────────────────────
class LRUCache {
    constructor(maxSize = LRU_MAX_SIZE) {
        this.maxSize = maxSize;
        this.map = new Map();
    }

    has(key) { return this.map.has(key); }

    get(key) {
        if (!this.map.has(key)) return undefined;
        const value = this.map.get(key);
        this.map.delete(key);
        this.map.set(key, value);
        return value;
    }

    set(key, value) {
        if (this.map.has(key)) this.map.delete(key);
        else if (this.map.size >= this.maxSize) {
            const oldest = this.map.keys().next().value;
            this.map.delete(oldest);
        }
        this.map.set(key, value);
    }

    delete(key) { this.map.delete(key); }
    values() { return [...this.map.values()]; }
    get size() { return this.map.size; }
    clear() { this.map.clear(); }

    mergeReels(newReels) {
        for (const reel of newReels) {
            if (reel?._id) this.set(String(reel._id), reel);
        }
    }

    update(key, updates) {
        if (!this.map.has(key)) return;
        const current = this.map.get(key);
        this.map.set(key, { ...current, ...updates });
    }

    toArray() { return this.values(); }
}

export const ReelsProvider = ({ children }) => {
    const feedLRU = useRef(new LRUCache(LRU_MAX_SIZE));
    const activeIndexCache = useRef(0);
    const pageCache = useRef(1);
    const lastFetchTime = useRef(null);
    const scrollPositionCache = useRef(0);
    const syncTimeoutRef = useRef(null);

    const [isInitialized, setIsInitialized] = useState(false);
    
    // — NEURAL SENSOR: Network Type Detection —
    const [networkType, setNetworkType] = useState(() => {
        return navigator.connection?.effectiveType || "4g";
    });

    useEffect(() => {
        const handleConnectionChange = () => {
            setNetworkType(navigator.connection?.effectiveType || "4g");
        };
        navigator.connection?.addEventListener("change", handleConnectionChange);
        return () => navigator.connection?.removeEventListener("change", handleConnectionChange);
    }, []);

    // — PERFORMANCE POLICY: High-Precision Preloading Depth —
    const preloadDepth = useMemo(() => {
        if (networkType === "wifi" || networkType === "4g") return 2; // Preload 2 ahead
        if (networkType === "3g") return 1; // Preload only 1 ahead
        return 0; // Slow/2G: No preloading
    }, [networkType]);

    // — PERSISTENCE: Initialize from IndexedDB (Async/Non-blocking) —
    useEffect(() => {
        const init = async () => {
            try {
                const navigation = performance.getEntriesByType("navigation")[0];
                const isHardReload = navigation?.type === "reload";
                
                const savedCache = await get(PERSISTENCE_KEY);
                if (savedCache) {
                    const { data, timestamp, page, activeIndex } = savedCache;
                    
                    if (isHardReload) {
                        console.info("[ReelsContext] Hard Reload. Clearing position for fresh discovery.");
                    } else {
                        const isRelevant = Date.now() - timestamp < 24 * 60 * 60 * 1000 || !navigator.onLine;
                        if (isRelevant && data?.length > 0) {
                            feedLRU.current.clear();
                            feedLRU.current.mergeReels(data);
                            lastFetchTime.current = timestamp;
                            pageCache.current = page || 1;
                            activeIndexCache.current = activeIndex || 0;
                        }
                    }
                }
            } catch (err) {
                console.error("[ReelsContext] IDB Restore Error:", err);
            } finally {
                setIsInitialized(true);
            }
        };
        init();
    }, []);

    // — SMART SYNC: Debounced Async Writing —
    const syncToDisk = useCallback(() => {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        
        syncTimeoutRef.current = setTimeout(async () => {
            try {
                const cacheData = {
                    data: feedLRU.current.toArray(),
                    timestamp: lastFetchTime.current,
                    page: pageCache.current,
                    activeIndex: activeIndexCache.current
                };
                // Async IndexedDB call won't block the UI thread during scroll
                await set(PERSISTENCE_KEY, cacheData);
            } catch (err) {
                console.warn("[ReelsContext] IDB Save Error:", err);
            }
        }, 3000); // Wait 3s after last interaction to write to disk
    }, []);

    const [globalMuted, _setGlobalMuted] = useState(() => {
        const saved = localStorage.getItem("reels_global_muted");
        return saved === null ? false : saved === "true";
    });

    const setGlobalMuted = useCallback((val) => {
        const newValue = typeof val === 'function' ? val(globalMuted) : val;
        _setGlobalMuted(newValue);
        localStorage.setItem("reels_global_muted", String(newValue));
    }, [globalMuted]);

    const feedCache = {
        get current() { return feedLRU.current.toArray(); },
    };

    const isCacheValid = useCallback(() => {
        if (!lastFetchTime.current || feedLRU.current.size === 0) return false;
        if (!navigator.onLine) return true;
        return Date.now() - lastFetchTime.current < CACHE_DURATION_MS;
    }, []);

    const updateCache = useCallback((reels, page) => {
        feedLRU.current.clear();
        feedLRU.current.mergeReels(reels);
        pageCache.current = page;
        lastFetchTime.current = Date.now();
        syncToDisk();
    }, [syncToDisk]);

    const appendToCache = useCallback((newReels, page) => {
        feedLRU.current.mergeReels(newReels);
        pageCache.current = page;
        lastFetchTime.current = Date.now();
        syncToDisk();
    }, [syncToDisk]);

    const invalidateCache = useCallback(async () => {
        feedLRU.current.clear();
        lastFetchTime.current = null;
        pageCache.current = 1;
        activeIndexCache.current = 0;
        await del(PERSISTENCE_KEY);
    }, []);

    const prePopulateCache = useCallback((reels) => {
        if (!reels || !reels.length) return;
        feedLRU.current.mergeReels(reels);
        // We don't update lastFetchTime because this is a "warm leak" from another page, 
        // not a formal feed refresh.
        syncToDisk();
    }, [syncToDisk]);

    const findReelById = useCallback((id) => {
        return feedLRU.current.get(String(id));
    }, []);

    const updateReelInCache = useCallback((reelId, updates) => {
        feedLRU.current.update(String(reelId), updates);
        syncToDisk();
    }, [syncToDisk]);

    const savePosition = useCallback((index) => {
        activeIndexCache.current = index;
        syncToDisk();
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
                prePopulateCache,
                findReelById,
                updateReelInCache,
                invalidateCache,
                savePosition,
                preloadDepth,
                networkType
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
