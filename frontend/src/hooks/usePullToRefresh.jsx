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

    const handleTouchStart = useCallback((e) => {
        // Only start if we are at the top of the container
        if (containerRef.current?.scrollTop <= 0) {
            touchStart.current = e.touches[0].clientY;
            isPulling.current = true;
        }
    }, [containerRef]);

    const handleTouchMove = useCallback((e) => {
        if (!isPulling.current) return;

        const currentTouch = e.touches[0].clientY;
        const dy = currentTouch - touchStart.current;

        // Only allow pulling down at the top
        if (dy > 0 && containerRef.current?.scrollTop <= 0) {
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
        const el = containerRef.current;
        if (!el) return;

        el.addEventListener("touchmove", handleTouchMove, { passive: false });
        return () => el.removeEventListener("touchmove", handleTouchMove);
    }, [handleTouchMove, containerRef]);

    // PullIndicator Component
    const PullIndicator = () => (
        <AnimatePresence>
            {(pullDistance > 0 || isRefreshing) && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ 
                        height: isRefreshing ? 60 : Math.min(pullDistance, 80),
                        opacity: 1 
                    }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex items-center justify-center overflow-hidden w-full bg-transparent"
                >
                    <div className={`transition-transform duration-200 ${pullDistance >= PULL_THRESHOLD ? "rotate-180" : ""}`}>
                        {isRefreshing ? (
                            <FaSpinner className="text-emerald-500 animate-spin text-xl" />
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="text-zinc-500 text-xs font-bold tracking-widest uppercase mb-1">
                                    {pullDistance >= PULL_THRESHOLD ? "Release to Refresh" : "Pull to Refresh"}
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return { 
        pullDistance, 
        isRefreshing,
        handleTouchStart, 
        handleTouchEnd,
        PullIndicator
    };
};

export default usePullToRefresh;
