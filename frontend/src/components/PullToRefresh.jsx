/**
 * PullToRefresh — iOS-style pull-to-refresh.
 *
 * Behaviour:
 * - Navbar stays fixed (it lives OUTSIDE this component).
 * - When the user pulls from the very top, the page content slides DOWN
 *   revealing a white spinner in the gap between the navbar and content.
 * - Releasing past the threshold triggers a real page reload (window.location.reload).
 * - Framer Motion drives every animation — zero glitches, buttery smooth.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";

const THRESHOLD = 72;   // pull distance that triggers refresh
const MAX_PULL  = 105;  // rubber-band ceiling

export default function PullToRefresh({ children }) {
  const pullY    = useMotionValue(0);
  const phase    = useRef("idle"); // idle | pulling | refreshing
  const startY   = useRef(null);
  const [show, setShow] = useState(false);

  // Spinner state derived from pullY
  const spinnerOpacity = useTransform(pullY, [20, THRESHOLD], [0, 1]);
  const spinnerScale   = useTransform(pullY, [20, THRESHOLD], [0.5, 1]);

  /* ── Animate content back to 0 ── */
  const snapBack = useCallback(() => {
    const tick = () => {
      const v = pullY.get();
      if (v < 1) { pullY.set(0); setShow(false); return; }
      pullY.set(v * 0.72);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [pullY]);

  /* ── After spinner shows briefly, do real reload ── */
  const doRefresh = useCallback(() => {
    phase.current = "refreshing";
    // Lock spinner at threshold while the page reloads
    pullY.set(THRESHOLD);
    setShow(true);
    // Give the spinner time to render, then reload
    setTimeout(() => window.location.reload(), 650);
  }, [pullY]);

  useEffect(() => {
    const onTouchStart = (e) => {
      if (phase.current !== "idle") return;
      if (window.scrollY > 2) return; // only active at very top
      startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (phase.current === "refreshing") return;
      if (startY.current === null) return;

      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) { startY.current = null; return; }

      phase.current = "pulling";
      setShow(true);

      // Rubber-band curve: fast at start, slows near ceiling
      const resistance = 1 - delta / (3.2 * MAX_PULL);
      const eased = Math.min(MAX_PULL, delta * Math.max(0.05, resistance));
      pullY.set(eased);

      // Prevent the browser from doing its own overscroll behaviour
      e.preventDefault();
    };

    const onTouchEnd = () => {
      if (phase.current === "refreshing") return;
      const v = pullY.get();
      startY.current = null;

      if (v >= THRESHOLD) {
        doRefresh();
      } else {
        phase.current = "idle";
        snapBack();
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove",  onTouchMove,  { passive: false }); // must be non-passive to preventDefault
    document.addEventListener("touchend",   onTouchEnd,   { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove",  onTouchMove);
      document.removeEventListener("touchend",   onTouchEnd);
    };
  }, [pullY, doRefresh, snapBack]);

  return (
    <div className="relative">
      {/* ── Spinner: sits between navbar and content, revealed as content slides down ── */}
      <AnimatePresence>
        {show && (
          <motion.div
            key="ptr"
            className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none"
            style={{
              // Spinner height matches the gap opened by pulling content down
              height: pullY,
            }}
          >
            <motion.div
              style={{ opacity: spinnerOpacity, scale: spinnerScale }}
              className="w-9 h-9 rounded-full bg-white shadow-xl flex items-center justify-center"
            >
              <motion.div
                className="w-5 h-5 rounded-full border-[2.5px] border-gray-200 border-t-gray-600"
                animate={phase.current === "refreshing" ? { rotate: 360 } : { rotate: 0 }}
                transition={
                  phase.current === "refreshing"
                    ? { duration: 0.6, repeat: Infinity, ease: "linear" }
                    : { duration: 0.15 }
                }
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content: slides down on pull, snaps back after ── */}
      <motion.div style={{ y: pullY }}>
        {children}
      </motion.div>
    </div>
  );
}
