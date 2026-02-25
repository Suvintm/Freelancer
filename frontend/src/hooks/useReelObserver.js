import { useEffect, useRef } from "react";

/**
 * useReelObserver — Precise per-reel active detection using IntersectionObserver.
 *
 * Unlike scroll-event + Math.round(), this fires exactly when a reel
 * crosses the 75% visibility threshold — giving us pixel-perfect
 * active detection with ZERO scroll-jank.
 *
 * @param {number} reelCount - number of reels currently in the list
 * @param {function} onActiveChange - called with the new active index
 * @param {string} prefix - element ID prefix (default: "reel")
 */
const useReelObserver = (reelCount, onActiveChange, prefix = "reel") => {
    const observersRef = useRef([]);

    useEffect(() => {
        // Disconnect all previous observers
        observersRef.current.forEach((obs) => obs.disconnect());
        observersRef.current = [];

        for (let i = 0; i < reelCount; i++) {
            const el = document.getElementById(`${prefix}-${i}`);
            if (!el) continue;

            const obs = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        onActiveChange(i);
                    }
                },
                {
                    threshold: 0.75, // Reel is 75% visible → it's active
                    rootMargin: "0px",
                }
            );

            obs.observe(el);
            observersRef.current.push(obs);
        }

        return () => {
            observersRef.current.forEach((obs) => obs.disconnect());
        };
    }, [reelCount, prefix]);
};

export default useReelObserver;
