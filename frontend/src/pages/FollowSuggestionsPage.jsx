import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserPlus, FaCheck, FaUsers, FaUser, FaVideo, FaStar } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import {
    HiOutlineArrowLeft, HiOutlineMagnifyingGlass, HiOutlineXMark,
    HiOutlineAdjustmentsHorizontal, HiOutlineUserGroup, HiOutlineSparkles,
    HiOutlineFire, HiOutlineClock, HiOutlineCheckCircle, HiOutlineArrowPath,
    HiOutlineArrowRight,
} from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import ClientNavbar from "../components/ClientNavbar";
import { repairUrl } from "../utils/urlHelper.jsx";

// ─── Constants ──────────────────────────────────────────────────────────────
const FILTERS = [
    { id: "all",    label: "All",      icon: HiOutlineUserGroup },
    { id: "editor", label: "Editors",  icon: FaVideo },
    { id: "client", label: "Clients",  icon: FaUsers },
];
const SORTS = [
    { id: "relevant", label: "For You",  icon: HiOutlineSparkles },
    { id: "popular",  label: "Popular",  icon: HiOutlineFire },
    { id: "newest",   label: "Newest",   icon: HiOutlineClock },
];
const MAX_RECENT = 6;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getAvatar = (item) => {
    const pic = item?.profilePicture;
    if (typeof pic === "string" && pic.length > 0) return repairUrl(pic);
    if (pic?.url) return repairUrl(pic.url);
    return null;
};

const fmt = (n) => {
    if (!n) return "0";
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
};

// ─── Main Component ───────────────────────────────────────────────────────────
const FollowSuggestionsPage = () => {
    const { user, setUser, backendURL } = useAppContext();
    const navigate = useNavigate();

    const [suggestions, setSuggestions]   = useState([]);       // all fetched users
    const [loading, setLoading]           = useState(true);
    const [refreshing, setRefreshing]     = useState(false);
    const [followStates, setFollowStates] = useState({});

    // Search
    const [rawQuery, setRawQuery]         = useState("");        // live input value
    const [committedQ, setCommittedQ]     = useState("");        // applied after pressing Search
    const [liveResults, setLiveResults]   = useState([]);        // dropdown list
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [recentSearches, setRecentSearches] = useState(() => {
        try { return JSON.parse(localStorage.getItem("suvix_recent_people") || "[]"); }
        catch { return []; }
    });

    // Filters (only apply to the grid, NOT to the dropdown)
    const [activeFilter, setActiveFilter] = useState("all");
    const [activeSort, setActiveSort]     = useState("relevant");
    const [showFilters, setShowFilters]   = useState(false);

    const searchRef  = useRef(null);
    const dropdownRef = useRef(null);

    // ── Fetch all suggestions on mount ──────────────────────────────────────
    const fetchSuggestions = useCallback(async (silent = false) => {
        if (!user?.token) return;
        silent ? setRefreshing(true) : setLoading(true);
        try {
            const { data } = await axios.get(`${backendURL}/api/user/suggestions?limit=50`, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            const list = data.suggestions || [];
            setSuggestions(list);
            const states = {};
            list.forEach(s => {
                const isFollowed = user?.following?.some(id => id.toString() === s._id.toString());
                states[s._id] = { loading: false, isFollowing: !!isFollowed, isPending: false };
            });
            setFollowStates(states);
        } catch {
            toast.error("Failed to load people");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.token, backendURL]);

    useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

    // ── Live autocomplete — fires as user types, ignores filters ───────────
    useEffect(() => {
        const q = rawQuery.trim().toLowerCase();
        if (!q) { setLiveResults([]); return; }

        const matches = suggestions
            .filter(u =>
                u.name?.toLowerCase().includes(q) ||
                u.country?.toLowerCase().includes(q) ||
                u.skills?.some(s => s.toLowerCase().includes(q))
            )
            .slice(0, 6);  // max 6 in dropdown
        setLiveResults(matches);
        setShowDropdown(true);
    }, [rawQuery, suggestions]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                searchRef.current && !searchRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── Commit search (Search button / Enter) ───────────────────────────────
    const commitSearch = () => {
        const q = rawQuery.trim();
        setCommittedQ(q);
        setShowDropdown(false);
        if (q) {
            const updated = [q, ...recentSearches.filter(r => r !== q)].slice(0, MAX_RECENT);
            setRecentSearches(updated);
            localStorage.setItem("suvix_recent_people", JSON.stringify(updated));
        }
    };

    const clearSearch = () => {
        setRawQuery("");
        setCommittedQ("");
        setLiveResults([]);
        setShowDropdown(false);
        searchRef.current?.focus();
    };

    const removeRecent = (item) => {
        const updated = recentSearches.filter(r => r !== item);
        setRecentSearches(updated);
        localStorage.setItem("suvix_recent_people", JSON.stringify(updated));
    };

    // ── Navigate to profile from dropdown ──────────────────────────────────
    const goToProfile = (item) => {
        setShowDropdown(false);
        setRawQuery(item.name);
        navigate(item.role === "editor" ? `/editor/${item._id}` : `/public-profile/${item._id}`);
    };

    // ── Follow handler ──────────────────────────────────────────────────────
    const handleFollow = async (e, targetUser) => {
        e.stopPropagation();
        const tid = targetUser._id;
        if (followStates[tid]?.loading) return;
        setFollowStates(prev => ({ ...prev, [tid]: { ...prev[tid], loading: true } }));
        try {
            const { data } = await axios.post(`${backendURL}/api/user/follow/${tid}`, {}, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            setFollowStates(prev => ({
                ...prev,
                [tid]: { loading: false, isFollowing: !!data.isFollowing, isPending: !!data.isPending },
            }));
            if (data.isFollowing) {
                setUser(prev => ({ ...prev, following: [...(prev?.following || []), tid] }));
            } else if (!data.isPending) {
                setUser(prev => ({
                    ...prev,
                    following: (prev?.following || []).filter(id => id.toString() !== tid),
                }));
            }
            if (data.isPending) toast.info("Follow request sent");
            else if (data.isFollowing) toast.success(`Following ${targetUser.name}`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Action failed");
            setFollowStates(prev => ({ ...prev, [tid]: { ...prev[tid], loading: false } }));
        }
    };

    // ── Grid — filtered + sorted (uses committedQ, not rawQuery) ───────────
    const displayed = suggestions
        .filter(u => {
            if (activeFilter !== "all" && u.role !== activeFilter) return false;
            if (!committedQ) return true;
            const q = committedQ.toLowerCase();
            return (
                u.name?.toLowerCase().includes(q) ||
                u.country?.toLowerCase().includes(q) ||
                u.skills?.some(s => s.toLowerCase().includes(q))
            );
        })
        .sort((a, b) => {
            if (activeSort === "popular") return (b.followersCount || 0) - (a.followersCount || 0);
            if (activeSort === "newest")  return new Date(b.createdAt) - new Date(a.createdAt);
            return 0;
        });

    const followedCount = Object.values(followStates).filter(s => s.isFollowing).length;
    const isFiltered = activeFilter !== "all" || activeSort !== "relevant" || committedQ;

    return (
        <div className="min-h-screen bg-[#050509] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            <ClientNavbar />

            {/* ── HEADER ────────────────────────────────────────────────── */}
            <div className="pt-16">
                <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-4 pb-3">

                    {/* Title row */}
                    <div className="flex items-center gap-2.5 mb-4">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate(-1)}
                            className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors flex-shrink-0"
                        >
                            <HiOutlineArrowLeft className="text-sm" />
                        </motion.button>
                        <div className="flex-1 min-w-0">
                            <p className="text-[8px] font-black uppercase tracking-[0.22em] text-zinc-700">SuviX</p>
                            <h1 className="text-base font-black text-white leading-none tracking-tight">Discover People</h1>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <AnimatePresence>
                                {followedCount > 0 && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                                    >
                                        <HiOutlineCheckCircle className="text-emerald-400 text-[10px]" />
                                        <span className="text-[9px] font-black text-emerald-400">{followedCount}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => fetchSuggestions(true)}
                                className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                            >
                                <HiOutlineArrowPath className={`text-sm ${refreshing ? "animate-spin" : ""}`} />
                            </motion.button>
                        </div>
                    </div>

                    {/* ── SEARCH BAR + LIVE DROPDOWN ─────────────────────── */}
                    <div className="relative mb-3">
                        {/* Input row */}
                        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                            searchFocused
                                ? "bg-white/[0.08] border-white/20 shadow-[0_0_0_3px_rgba(255,255,255,0.04)]"
                                : "bg-white/[0.05] border-white/[0.08] hover:border-white/[0.14]"
                        }`}>
                            <HiOutlineMagnifyingGlass className={`text-sm flex-shrink-0 transition-colors ${searchFocused ? "text-white" : "text-zinc-500"}`} />

                            <input
                                ref={searchRef}
                                type="text"
                                value={rawQuery}
                                onChange={e => { setRawQuery(e.target.value); setShowDropdown(true); }}
                                onFocus={() => { setSearchFocused(true); setShowDropdown(true); }}
                                onBlur={() => setSearchFocused(false)}
                                onKeyDown={e => { if (e.key === "Enter") commitSearch(); if (e.key === "Escape") setShowDropdown(false); }}
                                placeholder="Search people, skills, location…"
                                className="flex-1 bg-transparent text-[13px] text-white placeholder:text-zinc-600 outline-none min-w-0"
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck="false"
                            />

                            {/* Clear */}
                            <AnimatePresence>
                                {rawQuery && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                                        onClick={clearSearch}
                                        className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
                                    >
                                        <HiOutlineXMark className="text-sm" />
                                    </motion.button>
                                )}
                            </AnimatePresence>

                            {/* Divider */}
                            <div className="w-px h-4 bg-white/[0.08] flex-shrink-0" />

                            {/* Filter toggle */}
                            <button
                                onClick={() => setShowFilters(p => !p)}
                                className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                    showFilters ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                                }`}
                            >
                                <HiOutlineAdjustmentsHorizontal className="text-sm" />
                            </button>

                            {/* Search button */}
                            <motion.button
                                whileTap={{ scale: 0.94 }}
                                onClick={commitSearch}
                                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-white text-black text-[10px] font-black uppercase tracking-wider hover:bg-zinc-100 transition-colors"
                            >
                                Search
                            </motion.button>
                        </div>

                        {/* ── LIVE DROPDOWN ──────────────────────────────── */}
                        <AnimatePresence>
                            {showDropdown && (rawQuery ? liveResults.length > 0 : recentSearches.length > 0) && (
                                <motion.div
                                    ref={dropdownRef}
                                    initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                                    exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
                                    style={{ transformOrigin: "top" }}
                                    className="absolute top-full left-0 right-0 mt-1.5 z-[200] bg-[#0e0e13] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl shadow-black/70"
                                >
                                    {/* Section label */}
                                    <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600">
                                            {rawQuery ? `${liveResults.length} match${liveResults.length !== 1 ? "es" : ""}` : "Recent searches"}
                                        </span>
                                        {!rawQuery && recentSearches.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    setRecentSearches([]);
                                                    localStorage.removeItem("suvix_recent_people");
                                                }}
                                                className="text-[8px] font-bold text-zinc-600 hover:text-zinc-400 transition-colors"
                                            >
                                                Clear all
                                            </button>
                                        )}
                                    </div>

                                    {/* Live user suggestions */}
                                    {rawQuery ? liveResults.map((item, i) => (
                                        <DropdownItem
                                            key={item._id}
                                            item={item}
                                            query={rawQuery}
                                            onClick={() => goToProfile(item)}
                                            delay={i * 0.03}
                                        />
                                    )) : recentSearches.map((r, i) => (
                                        <RecentItem
                                            key={r}
                                            text={r}
                                            onSelect={() => { setRawQuery(r); setCommittedQ(r); setShowDropdown(false); }}
                                            onRemove={() => removeRecent(r)}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── FILTER PANEL ────────────────────────────────────── */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mb-3"
                            >
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] space-y-3">
                                    <FilterRow label="Show" items={FILTERS} active={activeFilter} setActive={setActiveFilter} />
                                    <FilterRow label="Sort" items={SORTS}   active={activeSort}   setActive={setActiveSort} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── RESULT COUNT STRIP ──────────────────────────────── */}
                    {!loading && (
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                                    <span className="text-white font-black">{displayed.length}</span>
                                    {committedQ ? " results" : " people"}
                                    {committedQ && <span className="text-zinc-600"> for "{committedQ}"</span>}
                                </span>
                            </div>
                            {isFiltered && (
                                <button
                                    onClick={() => { setActiveFilter("all"); setActiveSort("relevant"); clearSearch(); }}
                                    className="flex items-center gap-1 text-[9px] font-bold text-zinc-600 hover:text-white transition-colors"
                                >
                                    <HiOutlineXMark className="text-[10px]" /> Reset
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── GRID ─────────────────────────────────────────────────────── */}
            <main className="max-w-2xl mx-auto px-3 sm:px-4 pb-24">
                {loading ? (
                    <SkeletonGrid />
                ) : displayed.length === 0 ? (
                    <EmptyState query={committedQ} onClear={clearSearch} />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                        <AnimatePresence>
                            {displayed.map((item, idx) => (
                                <UserCard
                                    key={item._id}
                                    item={item}
                                    idx={idx}
                                    state={followStates[item._id] || {}}
                                    onCardClick={() => navigate(item.role === "editor" ? `/editor/${item._id}` : `/public-profile/${item._id}`)}
                                    onFollow={e => handleFollow(e, item)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
};

// ─── Dropdown item (live user result) ─────────────────────────────────────────
const DropdownItem = ({ item, query, onClick, delay }) => {
    const [imgErr, setImgErr] = useState(false);
    const src = getAvatar(item);

    // Highlight matching part of name
    const highlight = (text, q) => {
        if (!q || !text) return text;
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <span className="text-white font-black">{text.slice(idx, idx + q.length)}</span>
                {text.slice(idx + q.length)}
            </>
        );
    };

    return (
        <motion.button
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            onClick={onClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors text-left group"
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden ring-1 ring-white/[0.06]">
                    {src && !imgErr ? (
                        <img src={src} alt={item.name} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <FaUser className="text-zinc-600 text-xs" />
                        </div>
                    )}
                </div>
                {item.role === "editor" && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-[#0e0e13] flex items-center justify-center">
                        <MdVerified className="text-white text-[6px]" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-zinc-300 truncate group-hover:text-white transition-colors">
                    {highlight(item.name, query)}
                </p>
                <p className="text-[9px] text-zinc-600 truncate">
                    {item.role === "editor" ? "Editor" : "Client"}
                    {item.country && ` · ${item.country}`}
                </p>
            </div>

            <HiOutlineArrowRight className="text-zinc-700 text-xs flex-shrink-0 group-hover:text-zinc-400 transition-colors" />
        </motion.button>
    );
};

// ─── Recent search item ───────────────────────────────────────────────────────
const RecentItem = ({ text, onSelect, onRemove }) => (
    <div className="flex items-center group">
        <button
            onClick={onSelect}
            className="flex-1 flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.04] transition-colors text-left"
        >
            <HiOutlineClock className="text-zinc-700 text-xs flex-shrink-0" />
            <span className="text-[12px] text-zinc-400 truncate group-hover:text-zinc-200 transition-colors">{text}</span>
        </button>
        <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            className="px-3 py-2.5 text-zinc-700 hover:text-zinc-400 transition-colors"
        >
            <HiOutlineXMark className="text-xs" />
        </button>
    </div>
);

// ─── Filter row ───────────────────────────────────────────────────────────────
const FilterRow = ({ label, items, active, setActive }) => (
    <div>
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-700 mb-2">{label}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
            {items.map(it => (
                <motion.button
                    key={it.id}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setActive(it.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all ${
                        active === it.id
                            ? "bg-white text-black border-white"
                            : "bg-white/[0.03] text-zinc-500 border-white/[0.06] hover:border-white/15 hover:text-zinc-300"
                    }`}
                >
                    <it.icon className="text-[9px]" />
                    {it.label}
                </motion.button>
            ))}
        </div>
    </div>
);

// ─── User Card ────────────────────────────────────────────────────────────────
const UserCard = ({ item, idx, state, onCardClick, onFollow }) => {
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError]   = useState(false);
    const src = getAvatar(item);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: Math.min(idx * 0.035, 0.28), duration: 0.22, ease: "easeOut" }}
            onClick={onCardClick}
            className="relative bg-[#0c0c10] border border-white/[0.06] rounded-xl overflow-hidden cursor-pointer group hover:border-white/[0.14] hover:-translate-y-0.5 transition-all duration-200"
        >
            {/* Hover shimmer */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />

            <div className="p-3 flex flex-col items-center text-center gap-2.5">

                {/* Role badge */}
                <div className="h-[18px] flex items-center">
                    {item.role === "editor" && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                            <MdVerified className="text-blue-400 text-[7px]" />
                            <span className="text-[6.5px] font-black text-blue-400 uppercase tracking-widest">Editor</span>
                        </div>
                    )}
                </div>

                {/* Avatar */}
                <div className="relative">
                    <div className="w-14 h-14 rounded-full p-[1.5px] bg-gradient-to-br from-white/10 via-white/5 to-transparent">
                        <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden relative">
                            {src && !imgError && (
                                <img
                                    src={src}
                                    alt={item.name}
                                    loading="lazy"
                                    onLoad={() => setImgLoaded(true)}
                                    onError={() => setImgError(true)}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.3s" }}
                                />
                            )}
                            {(!imgLoaded || imgError) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                                    <FaUser className="text-zinc-600 text-base" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0c0c10] ring-1 ring-emerald-500/40" />
                </div>

                {/* Name */}
                <div className="w-full">
                    <h3 className="text-[12px] font-bold text-white truncate leading-tight">
                        {item.name}
                    </h3>
                    {item.country && (
                        <p className="text-[8px] text-zinc-700 font-semibold uppercase tracking-wider mt-0.5 truncate">
                            {item.country}
                        </p>
                    )}
                </div>

                {/* Stats */}
                {(item.followersCount > 0 || item.rating > 0) && (
                    <div className="flex items-center justify-center gap-2.5 w-full">
                        {item.followersCount > 0 && (
                            <StatBit value={fmt(item.followersCount)} label="followers" />
                        )}
                        {item.rating > 0 && (
                            <StatBit
                                value={item.rating.toFixed(1)}
                                label="rating"
                                icon={<FaStar className="text-[6px] text-amber-400" />}
                            />
                        )}
                    </div>
                )}

                {/* Skills */}
                {item.role === "editor" && item.skills?.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 w-full">
                        {item.skills.slice(0, 2).map(skill => (
                            <span key={skill} className="px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.05] text-[7px] font-semibold text-zinc-600 truncate max-w-[64px]">
                                {skill}
                            </span>
                        ))}
                    </div>
                )}

                {/* Follow button */}
                <FollowBtn state={state} onFollow={onFollow} />
            </div>
        </motion.div>
    );
};

// ─── Stat bit ──────────────────────────────────────────────────────────────────
const StatBit = ({ value, label, icon }) => (
    <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-0.5">
            {icon}
            <span className="text-[10px] font-black text-white leading-none">{value}</span>
        </div>
        <span className="text-[6.5px] font-semibold text-zinc-700 uppercase tracking-wider">{label}</span>
    </div>
);

// ─── Follow button ─────────────────────────────────────────────────────────────
const FollowBtn = ({ state, onFollow }) => {
    if (state.loading) return (
        <button disabled className="w-full py-1.5 rounded-lg bg-white/[0.04] flex items-center justify-center">
            <div className="w-3 h-3 border-[1.5px] border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
        </button>
    );
    if (state.isFollowing) return (
        <button
            onClick={onFollow}
            className="w-full py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[8px] font-black text-zinc-400 uppercase tracking-wider hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all duration-150 flex items-center justify-center gap-1 group/btn"
        >
            <FaCheck className="text-[6px] group-hover/btn:hidden" />
            <span className="group-hover/btn:hidden">Following</span>
            <span className="hidden group-hover/btn:block">Unfollow</span>
        </button>
    );
    if (state.isPending) return (
        <button disabled className="w-full py-1.5 rounded-lg bg-white/[0.03] text-[8px] font-black text-zinc-700 uppercase tracking-wider cursor-default">
            Requested
        </button>
    );
    return (
        <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onFollow}
            className="w-full py-1.5 rounded-lg bg-white text-black text-[8px] font-black uppercase tracking-wider hover:bg-zinc-100 transition-colors flex items-center justify-center gap-1"
        >
            <FaUserPlus className="text-[7px]" />
            Follow
        </motion.button>
    );
};

// ─── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
        {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="bg-white/[0.03] rounded-xl p-3 flex flex-col items-center gap-2.5 border border-white/[0.04]">
                <div className="w-12 h-2.5 bg-white/[0.06] rounded-full animate-pulse" />
                <div className="w-14 h-14 rounded-full bg-white/[0.06] animate-pulse" />
                <div className="w-16 h-2.5 bg-white/[0.06] rounded-full animate-pulse" />
                <div className="w-full h-7 bg-white/[0.06] rounded-lg animate-pulse" />
            </div>
        ))}
    </div>
);

// ─── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ query, onClear }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 gap-3 text-center"
    >
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <HiOutlineUserGroup className="text-lg text-zinc-600" />
        </div>
        <div>
            <p className="text-sm font-bold text-zinc-400">
                {query ? `No results for "${query}"` : "No suggestions found"}
            </p>
            <p className="text-[10px] text-zinc-700 mt-1">
                {query ? "Try a different keyword" : "Check back soon"}
            </p>
        </div>
        {query && (
            <button
                onClick={onClear}
                className="px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] font-bold text-zinc-400 hover:text-white transition-colors"
            >
                Clear search
            </button>
        )}
    </motion.div>
);

export default FollowSuggestionsPage;