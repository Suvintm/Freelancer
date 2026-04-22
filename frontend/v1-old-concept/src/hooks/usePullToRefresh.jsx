import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner } from "react-icons/fa";

const PULL_THRESHOLD = 70; // px
const DAMPING = 0.5;       // Resistance factor
const COOLDOWN_MS = 10000; // 10 seconds

/**
 * usePullToRefresh — High-fidelity gesture tracking for pull-down refresh.
 * 
 * @param {Function} onRefresh - Triggered when pull exceeds threshold.
 * @param {Object} containerRef - Scrollable container ref.
 */
const usePullToRefresh = (onRefresh, containerRef) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const touchStart = useRef(0);
    const isPulling = useRef(false);
    const lastRefreshTime = useRef(0);

    const getElement = useCallback(() => {
        const current = containerRef.current;
        // If it's a Lenis instance, use its wrapper DOM element
        return (current && typeof current.on === 'function' && current.wrapper) ? current.wrapper : current;
    }, [containerRef]);

    const handleTouchStart = useCallback((e) => {
        const el = getElement();
        // Only start if we are at the top of the container
        if (el && el.scrollTop <= 0) {
            touchStart.current = e.touches[0].clientY;
            isPulling.current = true;
        }
    }, [getElement]);

    const handleTouchMove = useCallback((e) => {
        if (!isPulling.current) return;

        const currentTouch = e.touches[0].clientY;
        const dy = currentTouch - touchStart.current;
        const el = getElement();

        // Only allow pulling down at the top
        if (dy > 0 && el && el.scrollTop <= 0) {
            // Apply dampening (iOS style)
            const dampenedDist = Math.min(dy * DAMPING, PULL_THRESHOLD + 20);
            setPullDistance(dampenedDist);
            
            // Prevent default scroll if we are pulling down at the top
            if (e.cancelable) e.preventDefault();
        } else {
            // Reset if user scrolls up or starts scrolling normally
            isPulling.current = false;
            setPullDistance(0);
        }
    }, [containerRef]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling.current) return;
        
        const now = Date.now();
        const canRefresh = now - lastRefreshTime.current >= COOLDOWN_MS;

        if (pullDistance >= PULL_THRESHOLD) {
            if (canRefresh) {
                setIsRefreshing(true);
                lastRefreshTime.current = now;
                try {
                    await onRefresh();
                } finally {
                    setIsRefreshing(false);
                }
            } else {
                console.log("[PTR] Cooldown active. Skipping refresh.");
            }
        }

        setPullDistance(0);
        isPulling.current = false;
    }, [pullDistance, onRefresh]);

    // Attach non-passive move listener to allow preventDefault
    useEffect(() => {
        const el = getElement();
        if (!el || typeof el.addEventListener !== 'function') return;

        el.addEventListener("touchmove", handleTouchMove, { passive: false });
        return () => el.removeEventListener("touchmove", handleTouchMove);
    }, [handleTouchMove, getElement]);

    // PullIndicator Component
    const PullIndicator = () => {
        const now = Date.now();
        const onCooldown = now - lastRefreshTime.current < COOLDOWN_MS;

        return (
            <AnimatePresence>
                {(pullDistance > 0 || isRefreshing) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ 
                            height: isRefreshing ? 70 : Math.min(pullDistance, 90),
                            opacity: 1 
                        }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex items-center justify-center overflow-hidden w-full bg-transparent z-[100] relative"
                    >
                        <div className="flex flex-col items-center gap-1.5 py-4">
                            <div className="relative">
                                {/* Outer Glow Ring (Visible when threshold met) */}
                                {pullDistance >= PULL_THRESHOLD && !isRefreshing && !onCooldown && (
                                    <motion.div 
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1.5, opacity: 0.4 }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="absolute inset-0 bg-emerald-500 rounded-full blur-xl"
                                    />
                                )}
                                
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${isRefreshing ? "bg-white/10 backdrop-blur-md border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : (pullDistance >= PULL_THRESHOLD ? (onCooldown ? "bg-zinc-800 border-zinc-700 opacity-50" : "bg-emerald-500 border-emerald-400 scale-110 shadow-lg") : "bg-white/5 backdrop-blur-sm border-white/20")}`}>
                                    {isRefreshing ? (
                                        <FaSpinner className="text-emerald-400 animate-spin text-xl" />
                                    ) : (
                                        <div className={`transition-transform duration-300 ${pullDistance >= PULL_THRESHOLD ? "rotate-180 scale-125" : "scale-100"}`}>
                                            <div className={`w-2 h-2 rounded-full ${pullDistance >= PULL_THRESHOLD ? (onCooldown ? "bg-zinc-500" : "bg-white") : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"}`} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${pullDistance >= PULL_THRESHOLD ? (onCooldown ? "text-zinc-500" : "text-emerald-400 translate-y-0 opacity-100") : "text-white/40 translate-y-1 opacity-80"}`}>
                                {isRefreshing ? "Refreshing Feed" : (pullDistance >= PULL_THRESHOLD ? (onCooldown ? "Recently Updated" : "Release to Refresh") : "Pull to Refresh")}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    };

    return { 
        pullDistance, 
        isRefreshing,
        handleTouchStart, 
        handleTouchEnd,
        PullIndicator
    };
};

export default usePullToRefresh;
