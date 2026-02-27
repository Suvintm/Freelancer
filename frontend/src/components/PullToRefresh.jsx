/**
 * PullToRefresh - Smooth pull-to-refresh wrapper using Framer Motion
 * Shows a white dot spinner on pull, hides after refresh completes.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

const PULL_THRESHOLD = 72;  // px needed to trigger refresh
const MAX_PULL = 110;       // max stretch in px

const PullToRefresh = ({ onRefresh, children }) => {
  const [phase, setPhase] = useState("idle"); // idle | pulling | releasing | refreshing | done
  const pullY = useMotionValue(0);
  const containerRef = useRef(null);
  const startY = useRef(null);
  const isRefreshing = useRef(false);

  // Derived values from pull distance
  const spinnerY = useTransform(pullY, [0, MAX_PULL], [-56, 18]);
  const spinnerOpacity = useTransform(pullY, [10, 48], [0, 1]);
  const spinnerScale = useTransform(pullY, [10, 56], [0.4, 1]);
  const contentY = useTransform(pullY, [0, MAX_PULL], [0, MAX_PULL - 10]);

  const canPull = () => {
    const el = containerRef.current;
    return el ? el.scrollTop <= 0 : false;
  };

  const triggerRefresh = useCallback(async () => {
    if (isRefreshing.current) return;
    isRefreshing.current = true;
    setPhase("refreshing");
    pullY.set(PULL_THRESHOLD);
    try {
      await onRefresh?.();
    } finally {
      setPhase("done");
      // Smooth snap back
      const animate = () => {
        const current = pullY.get();
        if (current <= 1) {
          pullY.set(0);
          setPhase("idle");
          isRefreshing.current = false;
          return;
        }
        pullY.set(current * 0.82);
        requestAnimationFrame(animate);
      };
      setTimeout(() => requestAnimationFrame(animate), 400);
    }
  }, [onRefresh, pullY]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (!canPull()) return;
      startY.current = e.touches[0].clientY;
      setPhase("pulling");
    };

    const onTouchMove = (e) => {
      if (startY.current === null || isRefreshing.current) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta < 0) { startY.current = null; setPhase("idle"); return; }
      // Apply rubber-band easing
      const eased = Math.min(MAX_PULL, delta * (1 - delta / (4 * MAX_PULL)));
      pullY.set(Math.max(0, eased));
      if (delta > 10) e.preventDefault();
    };

    const onTouchEnd = () => {
      if (isRefreshing.current) return;
      const current = pullY.get();
      startY.current = null;
      if (current >= PULL_THRESHOLD) {
        triggerRefresh();
      } else {
        setPhase("releasing");
        const snap = () => {
          const v = pullY.get();
          if (v <= 1) { pullY.set(0); setPhase("idle"); return; }
          pullY.set(v * 0.78);
          requestAnimationFrame(snap);
        };
        requestAnimationFrame(snap);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullY, triggerRefresh]);

  return (
    <div ref={containerRef} className="relative overflow-y-auto h-full w-full" style={{ overscrollBehavior: "none" }}>
      {/* Spinner Container — fixed to top, slides in with pull */}
      <motion.div
        className="absolute left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
        style={{ top: -56, y: spinnerY, opacity: spinnerOpacity, scale: spinnerScale }}
      >
        <AnimatePresence mode="wait">
          {phase !== "idle" && (
            <motion.div
              key="spinner"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-9 h-9 rounded-full bg-white shadow-xl flex items-center justify-center"
            >
              <motion.div
                className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-gray-700"
                animate={
                  phase === "refreshing"
                    ? { rotate: 360 }
                    : { rotate: 0 }
                }
                transition={
                  phase === "refreshing"
                    ? { duration: 0.65, repeat: Infinity, ease: "linear" }
                    : { duration: 0.2 }
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Content — shifts down slightly with pull */}
      <motion.div style={{ y: contentY }}>
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
