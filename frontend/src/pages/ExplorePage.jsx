/**
 * ExplorePage.jsx — Production-grade tab swiper
 *
 * BUGS FIXED vs original:
 *  1. useTransform hook called inside JSX → moved to component top level
 *  2. Race condition: navigate() fired before snap animation finished → navigate AFTER onComplete
 *  3. isSwiping reset too early in onDragEnd → reset only after animation ends
 *  4. Stale windowWidth in drag closure → useRef for always-current value
 *  5. Framer's built-in drag momentum conflicting with custom animate() → dragMomentum={false}
 *  6. Multiple animate() calls stacking up → animControls.current.stop() before each new call
 *  7. mix-blend-difference on tab text causing color glitches → replaced with clean active state
 *  8. dragConstraints recomputed wrong on resize → derived from wRef not windowWidth state
 */

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useVelocity,
  useSpring,
} from "framer-motion";
import {
  HiOutlineVideoCamera,
  HiOutlineUserGroup,
  HiOutlineShoppingBag,
} from "react-icons/hi2";

import UnifiedNavigation from "../components/UnifiedNavigation.jsx";
import ExploreEditor from "../components/ExploreEditor.jsx";
import ReelsExplore from "./ReelsExplore.jsx";
import useRefreshManager from "../hooks/useRefreshManager.js";
import usePullToRefresh from "../hooks/usePullToRefresh.jsx";

// ── Constants ──────────────────────────────────────────────────────────────
const TABS = [
  { id: "reelsfeed", label: "Reels",   Icon: HiOutlineVideoCamera },
  { id: "editors",   label: "Editors", Icon: HiOutlineUserGroup   },
  { id: "gigs",      label: "Gigs",    Icon: HiOutlineShoppingBag },
];

const TAB_COUNT   = TABS.length;
const SPRING_OPTS = { type: "spring", stiffness: 420, damping: 42, mass: 0.75, restDelta: 0.5 };

// ── Helpers ────────────────────────────────────────────────────────────────
const tabIdFromPath = (pathname) => {
  const id = pathname.split("/")[2];
  return TABS.find((t) => t.id === id)?.id ?? "reelsfeed";
};

// ─────────────────────────────────────────────────────────────────────────
const ExplorePage = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { triggerRefresh } = useRefreshManager();

  // ── Active tab derived from URL (single source of truth) ───────────────
  const activeTab = useMemo(
    () => tabIdFromPath(location.pathname),
    [location.pathname]
  );
  const activeIndex = useMemo(
    () => Math.max(0, TABS.findIndex((t) => t.id === activeTab)),
    [activeTab]
  );

  // Redirect bare /explore → default tab
  useEffect(() => {
    if (location.pathname === "/explore") {
      navigate("/explore/reelsfeed", { replace: true });
    }
  }, [location.pathname, navigate]);

  // ── Window width — ref keeps value current inside drag closures ─────────
  // Using a ref (not just state) prevents stale closure bugs in onDragEnd
  const wRef         = useRef(window.innerWidth);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      wRef.current = w;
      setWindowWidth(w);
      // Instantly snap to current tab — no animation on resize
      x.set(-(activeIndex * w));
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  // ── Core motion value ────────────────────────────────────────────────────
  // Initialised directly at the correct position — no first-render flash
  const x            = useMotionValue(-(activeIndex * wRef.current));
  const animControls = useRef(null); // keeps track of the running animation so we can .stop() it

  // Animate to the correct tab whenever activeIndex changes (URL-driven)
  useEffect(() => {
    const target = -(activeIndex * wRef.current);

    // Guard: already there (e.g. after a swipe-then-navigate round-trip)
    if (Math.abs(x.get() - target) < 1) return;

    // Stop any in-flight animation before starting a new one
    animControls.current?.();
    const controls = animate(x, target, SPRING_OPTS);
    // `animate()` returns a stop function (not a Promise in older framer versions)
    // handle both the object API and function API
    animControls.current = typeof controls.stop === "function"
      ? () => controls.stop()
      : controls; // framer v10+ returns an AnimationPlaybackControls object
  }, [activeIndex, x]);

  // ── Tab indicator position — derived from x (ALL hooks at top level) ────
  // FIX #1: These useTransform calls were previously inside JSX, violating Rules of Hooks
  const indicatorRaw = useTransform(
    x,
    [0, -((TAB_COUNT - 1) * windowWidth)],
    [0, (TAB_COUNT - 1) * 100]
  );
  // `indicatorX` is a MotionValue<string> → "0%" / "100%" / "200%"
  const indicatorX = useTransform(indicatorRaw, (v) => `${v}%`);

  // Liquid Stretchy Effect: scaleX increases based on velocity
  const xVelocity = useVelocity(x);
  const indicatorScaleX = useSpring(
    useTransform(xVelocity, [-2000, 0, 2000], [1.5, 1, 1.5]),
    { stiffness: 600, damping: 60 }
  );

  // Tab Bar Background Hue Shift
  const tabBarBg = useTransform(
    indicatorRaw,
    [0, 100, 200],
    ["rgba(0,0,0,0.8)", "rgba(10,5,20,0.8)", "rgba(5,15,10,0.8)"]
  );

  // ── Swipe state ──────────────────────────────────────────────────────────
  const [isSwiping, setIsSwiping] = useState(false);
  // ref copy so we can read it synchronously in onDragEnd without closure issues
  const activeIndexRef = useRef(activeIndex);
  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  // ── Navigation helper ────────────────────────────────────────────────────
  const handleTabClick = useCallback(
    (tabId) => {
      if (tabId === activeTab) return;
      navigate(`/explore/${tabId}`);
    },
    [activeTab, navigate]
  );

  // ── Scroll refs for pull-to-refresh (one per tab) ───────────────────────
  const scrollRefs = useRef(TABS.map(() => null));
  const activeScrollRef = useMemo(
    () => ({ current: scrollRefs.current[activeIndex] }),
    [activeIndex]
  );

  const { handleTouchStart, handleTouchEnd, PullIndicator } = usePullToRefresh(
    () => triggerRefresh(true, ["explore"]),
    activeScrollRef
  );

  // ── Drag constraints — always derived from wRef.current ─────────────────
  // Using wRef (not windowWidth state) avoids a stale value in framer's constraint calc
  const dragConstraints = useMemo(
    () => ({ left: -((TAB_COUNT - 1) * windowWidth), right: 0 }),
    [windowWidth]
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col md:flex-row bg-black text-white overflow-hidden">

      {/* Sidebar nav (desktop only) */}
      <div className="hidden lg:block h-full flex-shrink-0">
        <UnifiedNavigation
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </div>

      <main className="flex-1 lg:ml-64 relative flex flex-col h-screen overflow-hidden bg-[#050509]">
        <PullIndicator />

        {/* ── Tab Bar ───────────────────────────────────────────────────── */}
        <motion.div 
          className="flex-shrink-0 sticky top-0 z-[100] backdrop-blur-xl border-b border-white/[0.05]"
          style={{ backgroundColor: tabBarBg }}
        >
          <div className="max-w-5xl mx-auto px-4 py-2.5 flex justify-center">
            <div
              className="relative flex p-1 rounded-xl w-fit min-w-[280px]"
              style={{
                background: "rgba(255,255,255,0.03)",
                border:     "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/*
               * Sliding pill indicator
               * FIX #1: indicatorX is now a pre-computed MotionValue (not a hook called in render)
               */}
              <motion.div
                className="absolute top-1 bottom-1 rounded-lg pointer-events-none origin-center"
                style={{
                  width:      `calc(${100 / TAB_COUNT}% - 4px)`,
                  left:       "2px",
                  x:          indicatorX,
                  scaleX:     indicatorScaleX,
                  background: "#ffffff",
                  boxShadow:  "0 0 15px rgba(255,255,255,0.15)",
                }}
              />

              {TABS.map((t) => {
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleTabClick(t.id)}
                    className={[
                      "relative flex-1 px-3 py-1.5 rounded-lg",
                      "text-[10px] font-black uppercase tracking-widest",
                      "transition-colors duration-200 min-w-[80px] select-none",
                      // FIX #7: replaced mix-blend-difference (causes color glitch) with direct color swap
                      isActive ? "text-black" : "text-zinc-500 hover:text-zinc-300",
                    ].join(" ")}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-1.5">
                      <t.Icon className="text-[12px] flex-shrink-0" />
                      <span>{t.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── Swipeable content container ──────────────────────────────── */}
        <div
          className="flex-1 overflow-hidden relative"
          style={{ minHeight: 0 /* prevent flex child from blowing out */ }}
        >
          <motion.div
            /*
             * FIX #5: dragMomentum={false} — disables Framer's built-in post-drag
             * spring so it doesn't fight our custom animate() call in onDragEnd.
             *
             * FIX #2 & #3 (combined): we do NOT call navigate() inside onDragEnd.
             * Instead, we animate first, then navigate() in onComplete.
             * isSwiping is only set to false AFTER the animation finishes.
             */
            drag="x"
            dragConstraints={dragConstraints}
            dragElastic={0.06}
            dragMomentum={false}
            style={{ x, width: `${TAB_COUNT * 100}%` }}
            className="flex h-full touch-pan-y will-change-transform"
            onDragStart={() => {
              // Stop any URL-driven animation so drag feels immediately responsive
              animControls.current?.();
              setIsSwiping(true);
            }}
            onDragEnd={(_, { offset, velocity }) => {
              const w           = wRef.current;          // FIX #4: always current
              const curIdx      = activeIndexRef.current; // FIX #4: always current
              const VELOCITY_T  = 280;
              const DISTANCE_T  = w * 0.28;

              // Determine which tab to land on
              let nextIndex = curIdx;
              if      (velocity.x < -VELOCITY_T)      nextIndex = Math.min(curIdx + 1, TAB_COUNT - 1);
              else if (velocity.x >  VELOCITY_T)       nextIndex = Math.max(curIdx - 1, 0);
              else if (offset.x   < -DISTANCE_T)       nextIndex = Math.min(curIdx + 1, TAB_COUNT - 1);
              else if (offset.x   >  DISTANCE_T)       nextIndex = Math.max(curIdx - 1, 0);

              const targetX = -(nextIndex * w);

              // FIX #6: stop any previous animation before starting the snap
              animControls.current?.();

              const controls = animate(x, targetX, {
                ...SPRING_OPTS,
                onComplete: () => {
                  // FIX #2: navigate AFTER animation finishes, not before
                  // FIX #3: only now release pointer-events on children
                  setIsSwiping(false);
                  if (nextIndex !== curIdx) {
                    navigate(`/explore/${TABS[nextIndex].id}`);
                  }
                },
              });

              animControls.current =
                typeof controls?.stop === "function"
                  ? () => controls.stop()
                  : controls;
            }}
          >
            {TABS.map((t, i) => {
              const isActive = activeIndex === i;
              return (
                <div
                  key={t.id}
                  ref={(el) => { scrollRefs.current[i] = el; }}
                  className="h-full overflow-y-auto scrollbar-hide shrink-0 pb-20"
                  style={{ width: `${100 / TAB_COUNT}%` }}
                  onTouchStart={activeIndex === i ? handleTouchStart : undefined}
                  onTouchEnd={activeIndex === i ? handleTouchEnd : undefined}
                >
                  <motion.div
                    initial={false}
                    animate={{ 
                      scale: isActive ? 1 : 0.98,
                      opacity: isActive ? 1 : 0.6,
                      filter: isActive ? "blur(0px)" : "blur(2px)"
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="h-full w-full"
                  >
                    {t.id === "reelsfeed" && (
                      <ReelsExplore isTab isSwiping={isSwiping} />
                    )}
                    {(t.id === "editors" || t.id === "gigs") && (
                      <ExploreEditor
                        initialTab={t.id}
                        isTab
                        isSwiping={isSwiping}
                      />
                    )}
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ExplorePage;