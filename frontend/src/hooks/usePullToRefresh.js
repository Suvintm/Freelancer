import { useRef, useState, useCallback, useEffect } from "react";

const PULL_THRESHOLD = 120; // px
const DAMPING = 0.4;        // Resistance factor

/**
 * usePullToRefresh — High-fidelity gesture tracking for pull-down refresh.
 * 
 * @param {Function} onRefresh - Triggered when pull exceeds threshold.
 * @param {Object} containerRef - scrollable container ref.
 */
const usePullToRefresh = (onRefresh, containerRef) => {
    const [pullDistance, setPullDistance] = useState(0);
    const touchStart = useRef(0);
    const isPulling = useRef(false);

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

        if (dy > 0) {
            // Apply dampening (iOS style)
            const dampenedDist = Math.pow(dy, 0.85) * DAMPING;
            setPullDistance(dampenedDist);
            
            // Prevent default scroll if we are pulling down at the top
            if (e.cancelable) e.preventDefault();
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (!isPulling.current) return;
        
        if (pullDistance > PULL_THRESHOLD) {
            onRefresh(true);
        }

        // Snap back
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

    return { 
        pullDistance, 
        handleTouchStart, 
        handleTouchEnd 
    };
};

export default usePullToRefresh;
