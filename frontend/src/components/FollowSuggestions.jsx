import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserPlus, FaCheck, FaUser } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { HiOutlineArrowRight, HiUserGroup } from "react-icons/hi2";
import { repairUrl } from "../utils/urlHelper.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import FollowingAnimation from "./FollowingAnimation";

// ─── PRODUCTION-SAFE scroll target resolver ───────────────────────────────
//
// Identical strategy as SuggestedReels:
//  • Verify scrollability via scrollHeight (not just overflow style)
//  • Retry loop so we survive async CSS loads in production
//  • Always attach window as a simultaneous fallback
//
const resolveScrollTargets = (componentEl) => {
    const targets = new Set();

    const isScrollable = (el) => {
        if (!el || el === window) return true;
        try {
            const style = window.getComputedStyle(el);
            const oy = style.overflowY || style.overflow;
            return (oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 2;
        } catch {
            return false;
        }
    };

    const mainEl = document.querySelector("main");
    if (mainEl && isScrollable(mainEl)) targets.add(mainEl);

    let node = componentEl?.parentElement;
    while (node && node !== document.body) {
        if (isScrollable(node)) { targets.add(node); break; }
        node = node.parentElement;
    }

    // window is always the guaranteed fallback
    targets.add(window);
    return [...targets];
};

// ─── Main Component ────────────────────────────────────────────────────────
const FollowSuggestions = () => {
    const { user, setUser, backendURL } = useAppContext();
    const navigate = useNavigate();
    const [followStates, setFollowStates] = useState({});
    const scrollRef = useRef(null);
    const mainContainerRef = useRef(null);
    const isInteracting = useRef(false);

    const { data: suggestions = [], isLoading: loading } = useQuery({
        queryKey: ["homeData", "follow-suggestions", backendURL, user?.token],
        queryFn: async () => {
            const res = await axios.get(`${backendURL}/api/user/suggestions?limit=10`, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            const states = {};
            (res.data.suggestions || []).forEach(s => {
                const isFollowed = user?.following?.some(id => id.toString() === s._id.toString());
                states[s._id] = { loading: false, isFollowing: !!isFollowed, isPending: false, showAnimation: false };
            });
            setFollowStates(states);
            return res.data.suggestions || [];
        },
        staleTime: 5 * 60 * 1000,
        enabled: !!user?.token,
    });

    // ── Auto-reset horizontal scroll on vertical scroll — production-safe ──
    useEffect(() => {
        const listeners = []; // { target, fn } — cleaned up on unmount

        const attachListeners = (targets) => {
            const seen = new Set();
            // Each target tracks its own lastY independently
            const lastY = new Map();
            let ticking = false;

            targets.forEach((target) => {
                const key = target === window ? "window" : target;
                if (seen.has(key)) return;
                seen.add(key);

                const fn = () => {
                    if (ticking || isInteracting.current) return;
                    ticking = true;

                    window.requestAnimationFrame(() => {
                        const currentY = target === window ? window.scrollY : target.scrollTop;
                        const prev = lastY.get(key) ?? currentY;
                        const diffY = Math.abs(currentY - prev);

                        if (diffY > 10 && scrollRef.current?.scrollLeft > 20) {
                            const el = mainContainerRef.current;
                            if (el) {
                                const rect = el.getBoundingClientRect();
                                const center = rect.top + rect.height / 2;
                                const vh = window.innerHeight;
                                if (Math.abs(center - vh / 2) > vh * 0.4) {
                                    scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
                                }
                            }
                        }

                        lastY.set(key, currentY);
                        ticking = false;
                    });
                };

                target.addEventListener("scroll", fn, { passive: true });
                listeners.push({ target, fn });
            });
        };

        // Retry loop — handles production CSS async load race condition
        let retries = 0;
        const MAX_RETRIES = 8;
        const RETRY_MS = 400;
        let retryTimer = null;

        const tryAttach = () => {
            const targets = resolveScrollTargets(mainContainerRef.current);
            const hasRealContainer = targets.some(t => t !== window);

            if (hasRealContainer || retries >= MAX_RETRIES) {
                attachListeners(targets);
            } else {
                retries++;
                retryTimer = setTimeout(tryAttach, RETRY_MS);
            }
        };

        const initTimer = setTimeout(tryAttach, 300);

        return () => {
            clearTimeout(initTimer);
            clearTimeout(retryTimer);
            listeners.forEach(({ target, fn }) => target.removeEventListener("scroll", fn));
        };
    }, []);

    // ── Interaction guards ─────────────────────────────────────────────────
    const handleTouchStart = () => { isInteracting.current = true; };
    const handleTouchEnd  = () => { setTimeout(() => { isInteracting.current = false; }, 1000); };

    // ── Follow / Unfollow ──────────────────────────────────────────────────
    const handleFollow = async (e, targetUser) => {
        e.stopPropagation();
        const targetId = targetUser._id;
        if (followStates[targetId]?.loading) return;

        setFollowStates(prev => ({ ...prev, [targetId]: { ...prev[targetId], loading: true } }));

        try {
            const res = await axios.post(`${backendURL}/api/user/follow/${targetId}`, {}, {
                headers: { Authorization: `Bearer ${user.token}` },
            });

            if (res.data.isFollowing) {
                setFollowStates(prev => ({
                    ...prev,
                    [targetId]: { loading: false, isFollowing: true, isPending: false, showAnimation: true },
                }));
                setUser(prev => ({ ...prev, following: [...(prev?.following || []), targetId] }));
                setTimeout(() => {
                    setFollowStates(prev => ({ ...prev, [targetId]: { ...prev[targetId], showAnimation: false } }));
                }, 2000);
            } else {
                setFollowStates(prev => ({
                    ...prev,
                    [targetId]: { loading: false, isFollowing: false, isPending: !!res.data.isPending, showAnimation: false },
                }));
                if (!res.data.isPending) {
                    setUser(prev => ({
                        ...prev,
                        following: (prev?.following || []).filter(id => id.toString() !== targetId.toString()),
                    }));
                }
                if (res.data.isPending) toast.info("Follow request sent");
                else toast.info(`Unfollowed ${targetUser.name}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Action failed");
            setFollowStates(prev => ({ ...prev, [targetId]: { ...prev[targetId], loading: false } }));
        }
    };

    // ── Skeletons ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="space-y-4 py-2">
                <div className="flex items-center justify-between px-1">
                    <div className="h-4 w-36 bg-white/5 rounded-lg animate-pulse" />
                    <div className="h-4 w-16 bg-white/5 rounded-lg animate-pulse" />
                </div>
                <div className="flex gap-3 overflow-hidden px-1">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex-shrink-0 w-[148px] h-[196px] bg-white/[0.03] rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (suggestions.length === 0) return null;

    return (
        <div ref={mainContainerRef} className="space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <HiUserGroup className="text-zinc-400 text-sm" />
                        <h2 className="text-[11px] font-black text-white tracking-[0.18em] uppercase">
                            Suggested for you
                        </h2>
                    </div>
                    <div className="flex items-center gap-2 ml-5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-600">
                            Connect with creators
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => navigate("/follow-suggestions")}
                    className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-200"
                >
                    <span className="text-[9px] font-bold text-zinc-500 group-hover:text-zinc-300 uppercase tracking-widest transition-colors">
                        View All
                    </span>
                    <HiOutlineArrowRight className="text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </button>
            </div>

            {/* Scroll row */}
            <div
                ref={scrollRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={() => { isInteracting.current = true; }}
                onMouseUp={() => { setTimeout(() => { isInteracting.current = false; }, 1000); }}
                className="flex gap-3 overflow-x-auto pb-3 px-1 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                <AnimatePresence>
                    {suggestions.map((item, idx) => {
                        const state = followStates[item._id] || {};
                        return (
                            <SuggestionCard
                                key={item._id}
                                item={item}
                                idx={idx}
                                state={state}
                                onCardClick={() =>
                                    navigate(item.role === "editor"
                                        ? `/editor/${item._id}`
                                        : `/public-profile/${item._id}`)
                                }
                                onFollow={(e) => handleFollow(e, item)}
                                onAnimationComplete={() =>
                                    setFollowStates(prev => ({
                                        ...prev,
                                        [item._id]: { ...prev[item._id], showAnimation: false },
                                    }))
                                }
                            />
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

// ─── Suggestion Card ───────────────────────────────────────────────────────
const SuggestionCard = ({ item, idx, state, onCardClick, onFollow, onAnimationComplete }) => {
    const [imgLoaded, setImgLoaded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            onClick={onCardClick}
            className="relative flex-shrink-0 w-[148px] bg-[#0c0c10] border border-white/[0.06] rounded-2xl overflow-hidden cursor-pointer group hover:border-white/[0.12] transition-all duration-300"
        >
            {/* Top shimmer on hover */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

            <AnimatePresence>
                {state.showAnimation && (
                    <FollowingAnimation variant="local" onComplete={onAnimationComplete} />
                )}
            </AnimatePresence>

            <div className="p-4 flex flex-col items-center text-center">
                {item.role === "editor" && (
                    <div className="flex items-center gap-1 mb-3 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <MdVerified className="text-blue-400 text-[9px]" />
                        <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest">Editor</span>
                    </div>
                )}

                <div className={`relative mb-3 ${item.role !== "editor" ? "mt-2" : ""}`}>
                    <div className="w-[60px] h-[60px] rounded-full p-[1.5px] bg-gradient-to-br from-white/10 via-white/5 to-transparent">
                        <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 relative">
                            <img
                                src={
                                    typeof item.profilePicture === "string" && item.profilePicture.length > 0
                                        ? repairUrl(item.profilePicture)
                                        : item.profilePicture?.url
                                        ? repairUrl(item.profilePicture.url)
                                        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop"
                                }
                                alt={item.name}
                                loading="lazy"
                                onLoad={() => setImgLoaded(true)}
                                onError={e => {
                                    e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop";
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.4s ease" }}
                            />
                            {!imgLoaded && (
                                <div className="absolute inset-0 bg-zinc-800 rounded-full flex items-center justify-center">
                                    <FaUser className="text-zinc-600 text-sm" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full mb-4">
                    <h3 className="text-[12px] font-bold text-white truncate leading-tight mb-0.5 group-hover:text-zinc-100 transition-colors">
                        {item.name}
                    </h3>
                    <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-wider truncate">
                        {item.country || "Global User"}
                    </p>
                </div>

                <FollowButton state={state} onFollow={onFollow} />
            </div>
        </motion.div>
    );
};

// ─── Follow Button ─────────────────────────────────────────────────────────
const FollowButton = ({ state, onFollow }) => {
    if (state.loading) return (
        <button disabled className="w-full py-2 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center">
            <div className="w-3 h-3 border-[1.5px] border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
        </button>
    );

    if (state.isFollowing) return (
        <button
            onClick={onFollow}
            className="w-full py-2 rounded-xl bg-white/[0.06] border border-white/10 text-[9px] font-black text-zinc-300 uppercase tracking-wider hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-400 transition-all duration-200 flex items-center justify-center gap-1.5 group/btn"
        >
            <FaCheck className="text-[7px] group-hover/btn:hidden" />
            <span className="group-hover/btn:hidden">Following</span>
            <span className="hidden group-hover/btn:inline text-[9px]">Unfollow</span>
        </button>
    );

    if (state.isPending) return (
        <button disabled className="w-full py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[9px] font-black text-zinc-600 uppercase tracking-wider cursor-default">
            Requested
        </button>
    );

    return (
        <button
            onClick={onFollow}
            className="w-full py-2 rounded-xl bg-white text-black text-[9px] font-black uppercase tracking-wider hover:bg-zinc-100 active:scale-95 transition-all duration-150 flex items-center justify-center gap-1.5 shadow-lg shadow-white/5"
        >
            <FaUserPlus className="text-[8px]" />
            Follow
        </button>
    );
};

export default FollowSuggestions;