import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FixedSizeList as List } from "react-window";
import { FaSpinner } from "react-icons/fa";
import { HiOutlineChevronLeft } from "react-icons/hi2";
import { BiRefresh } from "react-icons/bi";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useReelsContext } from "../context/ReelsContext";
import ReelCard from "../components/ReelCard";
import ReelSkeleton from "../components/ReelSkeleton";
import ReelAdCard from "../components/ReelAdCard";
import ReelCommentsDrawer from "../components/ReelCommentsDrawer";
import usePullToRefresh from "../hooks/usePullToRefresh.jsx";

const ReelsPage = ({ isActive = true }) => {
    const { backendURL } = useAppContext();
    const {
        feedCache,
        activeIndexCache,
        pageCache,
        isCacheValid,
        updateCache,
        appendToCache,
        invalidateCache,
        savePosition,
        globalMuted,
        setGlobalMuted,
    } = useReelsContext();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const targetReelId = searchParams.get("id");

    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [activeReelIndex, setActiveReelIndex] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [activeReel, setActiveReel] = useState(null);
    const [reelAds, setReelAds] = useState([]);
    const [skippedAdIndices, setSkippedAdIndices] = useState(new Set());
    const [targetAd, setTargetAd] = useState(null);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);

    const listRef = useRef(null);
    const viewedReelsRef = useRef(new Set());

    // Track window height for FixedSizeList
    useEffect(() => {
        const handleResize = () => setWindowHeight(window.innerHeight);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // ─────────────────────────────────────────────────────────────
    // FETCH REELS — Concurrent Candidate Retrieval (O(1) Wait)
    // ─────────────────────────────────────────────────────────────
    const fetchReels = useCallback(async (pageNum = 1, isLoadMore = false) => {
        // — OFFLINE PROTECTION —
        if (!navigator.onLine) {
            console.warn("[Reels] Device is offline. Skipping network fetch.");
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
            // If we have cached content but current reels list is empty, restore it
            if (feedCache.current.length > 0 && reels.length === 0) {
                setReels(feedCache.current);
            }
            return;
        }

        try {
            if (!isLoadMore && pageNum === 1 && reels.length === 0) setLoading(true);
            
            const excludeIdsArr = isLoadMore
                ? feedCache.current.map((r) => r?._id).filter(Boolean)
                : (targetReelId ? [targetReelId] : []);
            const excludeIds = excludeIdsArr.join(",");

            // Increased limit to 10 for fewer network requests
            const feedPromise = axios.get(`${backendURL}/api/reels/feed?page=${pageNum}&limit=10&exclude=${excludeIds}`);
            
            // Fetch target reel or ad in parallel to global feed
            const specificPromise = (!isLoadMore && pageNum === 1 && targetReelId && !targetReelId.startsWith("ad_"))
                ? axios.get(`${backendURL}/api/reels/${targetReelId}`).catch(() => null)
                : Promise.resolve(null);
            
            const adPromise = (!isLoadMore && pageNum === 1 && targetReelId?.startsWith("ad_"))
                ? axios.get(`${backendURL}/api/ads/${targetReelId.replace("ad_", "")}`).catch(() => null)
                : Promise.resolve(null);

            const [feedRes, specificRes, adRes] = await Promise.all([feedPromise, specificPromise, adPromise]);

            let fetchedReels = feedRes.data.reels || [];
            
            // Integrate high-priority target if found
            if (specificRes?.data?.reel) {
                fetchedReels = [specificRes.data.reel, ...fetchedReels];
            } else if (adRes?.data?.ad) {
                setTargetAd(adRes.data.ad);
            }

            if (isLoadMore) {
                const combined = [...feedCache.current, ...fetchedReels];
                const uniqueReels = Array.from(new Map(combined.map(r => [r._id, r])).values());
                setReels(uniqueReels);
                appendToCache(fetchedReels, pageNum);
            } else {
                const uniqueInitial = Array.from(new Map(fetchedReels.map(r => [r?._id, r])).values()).filter(r => r?._id);
                setReels(uniqueInitial);
                updateCache(uniqueInitial, pageNum);
            }

            setHasMore(feedRes.data.pagination.hasMore);
        } catch (err) {
            console.error("[Reels] Fetch error:", err.message);
            // Fallback: If network fails but we have cached data, ensure it stays visible
            if (reels.length === 0 && feedCache.current.length > 0) {
                setReels(feedCache.current);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [backendURL, updateCache, appendToCache, targetReelId, feedCache, reels.length]);

    // ─────────────────────────────────────────────────────────────
    // ON MOUNT/ACTIVE — Optimized state-restoration
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isActive) return;

        // If switching tabs and we already have content, don't show black screen or loading pulses
        if (reels.length > 0) setLoading(false);

        if (targetReelId) {
            const isAlreadyInFeed = reels.some(r => r?._id === targetReelId || (r?.type === 'ad' && r?.content?._id === targetReelId.replace('ad_', '')));
            const currentFirstId = (reels.length > 0) ? (reels[0].type === 'ad' ? `ad_${reels[0].content?._id}` : reels[0]._id) : null;
            
            if (targetReelId !== currentFirstId && !isAlreadyInFeed) {
                // Brand new deep link -> Reset and fresh parallel fetch
                setLoading(true);
                setReels([]);
                setTargetAd(null); 
                setActiveReelIndex(0);
                listRef.current?.scrollTo(0);
                fetchReels(1, false);
            } else if (isAlreadyInFeed) {
                const foundIndex = reels.findIndex(r => r?._id === targetReelId || (r?.type === 'ad' && r?.content?._id === targetReelId.replace('ad_', '')));
                if (foundIndex !== -1 && foundIndex !== activeReelIndex) {
                    setActiveReelIndex(foundIndex);
                    setTimeout(() => listRef.current?.scrollToItem(foundIndex, "start"), 50);
                }
            }
        } else if (isCacheValid() && reels.length === 0) {
            // Tab return -> Restore instantly from LRU Cache
            setReels(feedCache.current);
            setPage(pageCache.current);
            setLoading(false);
            const savedIndex = activeIndexCache.current;
            setTimeout(() => {
                listRef.current?.scrollToItem(savedIndex, "start");
                setActiveReelIndex(savedIndex);
            }, 100);
        } else if (reels.length === 0) {
            fetchReels(1, false);
        }
    }, [isActive, targetReelId, fetchReels, isCacheValid, reels.length, feedCache, pageCache, activeIndexCache]);

    // Fetch ads for reels feed injection
    useEffect(() => {
        const fetchReelAds = async () => {
            try {
                const { data } = await axios.get(`${backendURL}/api/ads`);
                setReelAds(data.ads || []);
            } catch (err) {
                console.error("Ad fetch error:", err);
            }
        };
        fetchReelAds();
    }, [backendURL]);

    // Track views
    useEffect(() => {
        const reel = reels[activeReelIndex];
        if (!reel || viewedReelsRef.current.has(reel._id)) return;
        viewedReelsRef.current.add(reel._id);
        axios.post(`${backendURL}/api/reels/${reel._id}/view`).catch(() => {});
    }, [activeReelIndex, reels, backendURL]);

    // Handle deep linked comments
    useEffect(() => {
        const openComments = searchParams.get("openComments");
        if (openComments === "true" && targetReelId && reels.length > 0) {
            const firstReel = reels[0];
            if (firstReel?._id === targetReelId) {
                setActiveReel(firstReel);
                setShowComments(true);
            }
        }
    }, [searchParams, targetReelId, reels]);

    // ─────────────────────────────────────────────────────────────
    // UNIFIED FEED — Ad Injection & Dynamic Layout
    // ─────────────────────────────────────────────────────────────
    const combinedFeed = React.useMemo(() => {
        const feed = [];
        let adCounter = 0;
        
        if (targetAd && targetReelId === `ad_${targetAd._id}`) {
             feed.push({ type: 'ad', content: targetAd, id: `ad-target-${targetAd._id}` });
        }

        reels.forEach((reel, index) => {
            feed.push({ type: 'reel', content: reel, id: reel._id });
            
            // Spacing Algorithm: Guaranteed Ad every 3 reels
            // with a safety gap of 2 after a targetAd.
            const isTargetAdVisible = targetAd && targetReelId === `ad_${targetAd._id}`;
            const skipRandomInjection = isTargetAdVisible && index < 2;

            // Simple fixed interval (O(1) calculation)
            // index + 1 ensures the first ad is after 3 reels (0,1,2 -> Ad)
            const isAdSlot = ((index + 1) % 3 === 0) && reelAds.length > 0 && !skipRandomInjection;
            
            if (isAdSlot) {
                const adIndex = adCounter % reelAds.length;
                const ad = reelAds[adIndex];
                if (targetAd && ad._id === targetAd._id) {
                    adCounter++;
                    return;
                }
                const adId = `ad-random-${reel._id}-${index}`;
                if (!skippedAdIndices.has(adId)) {
                    feed.push({ type: 'ad', content: ad, id: adId });
                    adCounter++;
                }
            }
        });

        return feed;
    }, [reels, reelAds, skippedAdIndices, targetAd, targetReelId]);

    const urlUpdateTimerRef = useRef(null);

    const handleScroll = useCallback(({ scrollOffset }) => {
        if (loading) return;
        
        // — PERFORMANCE CONCEPT: High-Speed Index Calculation —
        // We use a zero-latency bitwise or floor calculation to find the candidate index.
        const index = Math.round(scrollOffset / windowHeight);
        
        if (index !== activeReelIndex && index >= 0 && index < combinedFeed.length) {
            setActiveReelIndex(index);
            savePosition(index);
            
            // — PERFORMANCE CONCEPT: Debounced Side-Effects —
            // history.replaceState is expensive and can drop frames during the snap animation.
            // We debounce it by 100ms to ensure the animation settles before updating the URL.
            if (urlUpdateTimerRef.current) clearTimeout(urlUpdateTimerRef.current);
            urlUpdateTimerRef.current = setTimeout(() => {
                const item = combinedFeed[index];
                if (item && item.id) {
                    const currentUrl = new URL(window.location.href);
                    const stableId = item.type === 'ad' ? `ad_${item.content._id}` : item.content._id;
                    if (currentUrl.searchParams.get("id") !== stableId) {
                        currentUrl.searchParams.set("id", stableId);
                        window.history.replaceState(null, '', currentUrl.pathname + currentUrl.search);
                    }
                }
            }, 100);

            if (index >= combinedFeed.length - 2 && hasMore && !loadingMore) loadMore();
        }
    }, [windowHeight, activeReelIndex, combinedFeed, loading, hasMore, loadingMore, savePosition]);

    const loadMore = async () => {
        if (loadingMore) return;
        setLoadingMore(true);
        if (!hasMore) {
            viewedReelsRef.current.clear();
            await fetchReels(1, true);
            return;
        }
        const nextPage = page + 1;
        setPage(nextPage);
        await fetchReels(nextPage, true);
    };

    const outerRef = useRef(null);
    const { handleTouchStart, handleTouchEnd, PullIndicator } = usePullToRefresh(
        async () => {
            setRefreshing(true);
            invalidateCache();
            viewedReelsRef.current.clear();
            setPage(1);
            setActiveReelIndex(0);
            await fetchReels(1, false);
            listRef.current?.scrollToItem(0, "start");
            setRefreshing(false);
        }, 
        outerRef
    );

    const handleCommentClick = (reelId) => {
        const reel = reels.find(r => r._id === reelId);
        setActiveReel(reel);
        setShowComments(true);
    };

    const handleCommentAdded = (newCount) => {
        setReels(prev => prev.map(r => r._id === activeReel?._id ? { ...r, commentsCount: newCount } : r));
    };

    return (
        <div className="relative h-full w-full bg-black flex flex-col overflow-hidden">
            <div className="absolute top-0 left-0 right-0 px-4 py-4 z-40 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors pointer-events-auto">
                    <HiOutlineChevronLeft className="text-2xl" />
                </button>
                <div />
                <div className="w-10 h-10" /> {/* Spacer to maintain symmetry */}
            </div>

            <PullIndicator />

            {/* Offline Indicator Overlay */}
            {!navigator.onLine && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-2xl flex items-center gap-2 animate-pulse pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
                    <span className="text-white text-[10px] font-bold uppercase tracking-widest text-shadow">
                        Offline Mode • Cached Content
                    </span>
                </div>
            )}

            <div
                className={`flex-1 overflow-hidden origin-top bg-black h-full relative transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${showComments ? "scale-[0.95] translate-y-[-20px] rounded-[20px]" : "scale-100 translate-y-0 rounded-none"}`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {loading && <div className="absolute inset-0 z-50"><ReelSkeleton /></div>}

                {!loading && combinedFeed.length > 0 && (
                    <List
                        ref={listRef}
                        outerRef={outerRef}
                        className="scrollbar-hide snap-y snap-mandatory touch-pan-y"
                        height={windowHeight}
                        itemCount={combinedFeed.length}
                        itemSize={windowHeight}
                        width="100%"
                        onScroll={handleScroll}
                        itemKey={(index) => combinedFeed[index]?.id || `reel-fallback-${index}`}
                        overscanCount={6} 
                        style={{ overflowX: 'hidden' }}
                    >
                        {({ index, style }) => {
                            const item = combinedFeed[index];
                            if (!item) return null;
                            return (
                                <div style={{ ...style, willChange: 'transform' }} className="snap-start snap-always w-full h-full bg-black">
                                    {item.type === 'reel' ? (
                                        <ReelCard
                                            reel={item.content}
                                            isActive={isActive && index === activeReelIndex}
                                            isNearActive={Math.abs(index - activeReelIndex) <= 1}
                                            isPreloading={index === activeReelIndex + 1 || index === activeReelIndex - 1}
                                            onCommentClick={handleCommentClick}
                                            globalMuted={globalMuted}
                                            setGlobalMuted={setGlobalMuted}
                                        />
                                    ) : (
                                        <ReelAdCard
                                            ad={item.content}
                                            isActive={isActive && index === activeReelIndex}
                                            isNearActive={Math.abs(index - activeReelIndex) <= 1}
                                            isPreloading={index === activeReelIndex + 1 || index === activeReelIndex - 1}
                                            globalMuted={globalMuted}
                                            setGlobalMuted={setGlobalMuted}
                                            onSkip={() => setSkippedAdIndices(prev => new Set([...prev, item.id]))}
                                        />
                                    )}
                                </div>
                            );
                        }}
                    </List>
                )}

                {!loading && reels.length === 0 && (
                    <div className="w-full h-screen flex flex-col items-center justify-center text-white gap-4">
                        <span className="text-5xl">🎬</span>
                        <p className="text-lg font-semibold">No reels yet</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showComments && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[55]" onClick={() => setShowComments(false)} />
                        <ReelCommentsDrawer reel={activeReel} onClose={() => setShowComments(false)} onCommentAdded={handleCommentAdded} />
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReelsPage;
