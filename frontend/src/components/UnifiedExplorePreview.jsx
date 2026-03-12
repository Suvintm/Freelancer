import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    HiOutlineStar,
    HiSparkles,
    HiOutlineBriefcase,
    HiOutlineUserGroup,
    HiOutlineCheckBadge,
    HiOutlineArrowRight,
    HiOutlineChevronRight,
    HiUserGroup,
    HiBriefcase,
    HiStar,
    HiOutlineMapPin
} from "react-icons/hi2";
import { FaCheckCircle } from "react-icons/fa";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, subLabel, link, navigate }) => (
    <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center">
                    <Icon className="text-zinc-400 text-sm" />
                </div>
                <h2 className="text-[11px] font-black text-white tracking-[0.18em] uppercase">
                    {title}
                </h2>
            </div>
            <div className="flex items-center gap-2 ml-7">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-600">
                    {subLabel}
                </span>
            </div>
        </div>

        <button
            onClick={() => navigate(link)}
            className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/15 transition-all duration-200"
        >
            <span className="text-[9px] font-bold text-zinc-500 group-hover:text-zinc-300 uppercase tracking-widest transition-colors">
                View All
            </span>
            <HiOutlineArrowRight className="text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </button>
    </div>
);

// ─── Editor Card ──────────────────────────────────────────────────────────────
const EditorCard = ({ item, idx, navigate }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        onClick={() => navigate(`/editor/${item.user?._id || item.user || item._id}`)}
        className="relative bg-[#0c0c10] border border-white/[0.06] rounded-2xl overflow-hidden cursor-pointer group hover:border-white/[0.12] transition-all duration-300"
    >
        {/* Subtle top glow on hover */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="p-4 flex flex-col items-center text-center gap-3">
            {/* Avatar */}
            <div className="relative mt-1">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 shadow-lg">
                    <img
                        src={item.user?.profilePicture || item.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={item.user?.name || item.name}
                    />
                </div>
                {item.user?.isVerified && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0c0c10] border border-white/10 flex items-center justify-center">
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            {/* Name */}
            <div className="w-full">
                <h3 className="text-[13px] font-bold text-white group-hover:text-zinc-200 transition-colors truncate leading-tight mb-1">
                    {item.user?.name || item.name}
                </h3>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-[8px] font-bold text-zinc-400 uppercase tracking-wider">
                        {item.experience || 'Professional'}
                    </span>
                    {item.location?.country && (
                        <span className="flex items-center gap-0.5 text-[8px] font-semibold text-zinc-600 uppercase">
                            <HiOutlineMapPin className="text-[9px]" />
                            {item.location.country}
                        </span>
                    )}
                </div>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap justify-center gap-1 w-full min-h-[36px]">
                {(item.skills?.slice(0, 3) || ['Editor']).map((skill, sIdx) => (
                    <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded-md bg-zinc-900 border border-white/[0.05] text-[8px] font-semibold text-zinc-500 uppercase tracking-tight"
                    >
                        {skill}
                    </span>
                ))}
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-white/[0.05]" />

            {/* Stats row */}
            <div className="w-full grid grid-cols-3 gap-0">
                <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-0.5">
                        <HiStar className="text-amber-400 text-[9px]" />
                        <span className="text-[11px] font-black text-white">
                            {item.ratingStats?.averageRating?.toFixed(1) || item.rating || '—'}
                        </span>
                    </div>
                    <span className="text-[7px] font-semibold text-zinc-700 uppercase tracking-wider">Rating</span>
                </div>

                <div className="flex flex-col items-center gap-0.5 border-x border-white/[0.05]">
                    <span className="text-[11px] font-black text-zinc-300">
                        {item.user?.suvixScore?.total || item.suvixScore?.total || '—'}
                    </span>
                    <span className="text-[7px] font-semibold text-zinc-700 uppercase tracking-wider">Score</span>
                </div>

                <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[11px] font-black text-emerald-400">
                        {(item.hourlyRate?.min ?? (typeof item.hourlyRate === 'number' ? item.hourlyRate : null)) !== null
                            ? `₹${item.hourlyRate?.min ?? item.hourlyRate}`
                            : '—'}
                    </span>
                    <span className="text-[7px] font-semibold text-zinc-700 uppercase tracking-wider">Rate/Hr</span>
                </div>
            </div>
        </div>
    </motion.div>
);

// ─── Gig Card ─────────────────────────────────────────────────────────────────
const GigCard = ({ item, idx, navigate }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        onClick={() => navigate(`/explore-editors?tab=gigs`)}
        className="relative rounded-2xl overflow-hidden cursor-pointer group aspect-[4/5] bg-zinc-900"
    >
        {/* Thumbnail */}
        <img
            src={item.thumbnail || item.images?.[0] || 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=800&auto=format&fit=crop'}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            alt={item.title}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Rating badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10">
            <HiStar className="text-amber-400 text-[9px]" />
            <span className="text-[9px] font-black text-white">{item.rating?.toFixed(1) || '4.9'}</span>
        </div>

        {/* Bottom info */}
        <div className="absolute inset-x-0 bottom-0 p-3">
            <h3 className="text-[10px] font-bold text-white line-clamp-2 leading-tight mb-2 group-hover:text-zinc-200 transition-colors">
                {item.title}
            </h3>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                    {item.editor?.profilePicture && (
                        <img
                            src={item.editor.profilePicture}
                            className="w-4 h-4 rounded-full border border-white/20 object-cover flex-shrink-0"
                            alt=""
                        />
                    )}
                    <span className="text-[8px] text-zinc-400 font-semibold truncate">
                        {item.editor?.name || 'Pro Editor'}
                    </span>
                </div>
                <span className="text-[10px] font-black text-emerald-400 flex-shrink-0">
                    ₹{item.price || 999}
                </span>
            </div>
        </div>
    </motion.div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonGrid = ({ count = 4, aspect = "editor" }) => (
    <div className={`grid gap-3 ${aspect === 'editor' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                className={`bg-white/[0.03] rounded-2xl animate-pulse ${aspect === 'editor' ? 'h-60' : 'aspect-[4/5]'}`}
            />
        ))}
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const UnifiedExplorePreview = () => {
    const { backendURL } = useAppContext();
    const navigate = useNavigate();

    const { data, isLoading: loading } = useQuery({
        queryKey: ['homeData', 'unified-explore', backendURL],
        queryFn: async () => {
            const [editorsRes, gigsRes] = await Promise.allSettled([
                axios.get(`${backendURL}/api/explore/editors?limit=8`),
                axios.get(`${backendURL}/api/explore/gigs?limit=4`)
            ]);
            return {
                editors: editorsRes.status === 'fulfilled' ? (editorsRes.value.data.editors || []) : [],
                gigs: gigsRes.status === 'fulfilled' ? (gigsRes.value.data.gigs || []) : []
            };
        },
        staleTime: 5 * 60 * 1000,
    });

    const editors = data?.editors || [];
    const gigs = data?.gigs || [];

    return (
        <div className="space-y-12">

            {/* ── Featured Editors ── */}
            <section>
                <SectionHeader
                    icon={HiUserGroup}
                    title="Featured Editors"
                    subLabel="Elite Talent"
                    link="/explore-editors?tab=editors"
                    navigate={navigate}
                />
                {loading ? (
                    <SkeletonGrid count={4} aspect="editor" />
                ) : editors.length === 0 ? (
                    <div className="py-12 text-center text-zinc-700 text-xs uppercase tracking-widest">No editors found</div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {editors.slice(0, 8).map((item, idx) => (
                            <EditorCard key={item._id} item={item} idx={idx} navigate={navigate} />
                        ))}
                    </div>
                )}
            </section>

            {/* ── Elite Gigs ── */}
            <section>
                <SectionHeader
                    icon={HiBriefcase}
                    title="Elite Gigs"
                    subLabel="Top Services"
                    link="/explore-editors?tab=gigs"
                    navigate={navigate}
                />
                {loading ? (
                    <SkeletonGrid count={4} aspect="gig" />
                ) : gigs.length === 0 ? (
                    <div className="py-12 text-center text-zinc-700 text-xs uppercase tracking-widest">No gigs found</div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {gigs.slice(0, 4).map((item, idx) => (
                            <GigCard key={item._id} item={item} idx={idx} navigate={navigate} />
                        ))}
                    </div>
                )}
            </section>

            {/* ── CTA ── */}
            <div className="flex justify-center pt-2 pb-4">
                <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/explore-editors')}
                    className="group flex items-center gap-2.5 px-7 py-3 rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/[0.10] hover:border-white/20 transition-all duration-200"
                >
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">
                        Explore Full Directory
                    </span>
                    <HiOutlineChevronRight className="text-xs text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
                </motion.button>
            </div>

        </div>
    );
};

export default UnifiedExplorePreview;