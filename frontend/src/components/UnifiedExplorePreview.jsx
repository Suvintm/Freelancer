
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
    HiStar
} from "react-icons/hi2";
import { FaStar, FaShoppingBag, FaUsers, FaCheckCircle } from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const UnifiedExplorePreview = () => {
    const { backendURL, user } = useAppContext();
    const navigate = useNavigate();
    const [editors, setEditors] = useState([]);
    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            // Individual fetch with separate error handling to prevent one failure from killing the entire view
            const fetchEditors = async () => {
                try {
                    const res = await axios.get(`${backendURL}/api/explore/editors?limit=8`);
                    setEditors(res.data.editors || []);
                } catch (err) {
                    console.error("Failed to fetch featured editors", err);
                    setEditors([]);
                }
            };

            const fetchGigs = async () => {
                try {
                    const res = await axios.get(`${backendURL}/api/explore/gigs?limit=4`);
                    setGigs(res.data.gigs || []);
                } catch (err) {
                    console.error("Failed to fetch elite gigs", err);
                    setGigs([]);
                }
            };

            await Promise.allSettled([fetchEditors(), fetchGigs()]);
            setLoading(false);
        };
        fetchData();
    }, [backendURL]);

    const PreviewSection = ({ title, items, type, icon: Icon, color, link, subLabel }) => (
        <div className="space-y-5">
            <div className="flex items-center justify-between px-1">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon className="text-white text-base" />
                        <h2 className="text-[11px] font-black text-white light:text-slate-900 tracking-[0.15em] uppercase">{title}</h2>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-40 ml-5">
                         <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[9px] font-bold uppercase tracking-wider">{subLabel}</span>
                    </div>
                </div>
                <button 
                    onClick={() => navigate(link)}
                    className="group/btn flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                    <span className="text-[9px] font-black text-zinc-400 group-hover/btn:text-white uppercase tracking-widest">View All</span>
                    <HiOutlineArrowRight className="text-xs text-zinc-500 group-hover/btn:text-white transition-colors" />
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 px-0">
                {items.map((item, idx) => (
                    <motion.div
                        key={item._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        onClick={() => navigate(type === 'editor' ? `/editor/${item._id}` : `/explore-editors?tab=gigs`)}
                        className={`bg-[#0f0f15]/80 backdrop-blur-xl border border-white/[0.06] rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden cursor-pointer group hover:border-violet-500/30 transition-all shadow-2xl relative ${
                            type === 'editor' 
                                ? 'flex flex-col items-center p-5 min-h-[320px] lg:min-h-[360px]' 
                                : 'aspect-square'
                        }`}
                    >
                        {type === 'editor' ? (
                            <>
                                {/* Top Header / Background Accent */}
                                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-br from-violet-600/20 via-transparent to-transparent opacity-50" />
                                
                                {/* Large Rounded Avatar */}
                                <div className="relative z-10 mt-2 mb-4">
                                    <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full p-1 bg-gradient-to-tr from-violet-500 via-purple-500 to-blue-500 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#0d0d12]">
                                            <img 
                                                src={item.user?.profilePicture || item.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop'} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                alt={item.user?.name || item.name}
                                            />
                                        </div>
                                    </div>
                                    {/* Verified Badge */}
                                    {item.user?.isVerified && (
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 border-2 border-[#0d0d12] flex items-center justify-center text-white shadow-lg z-20">
                                            <FaCheckCircle className="text-[10px]" />
                                        </div>
                                    )}
                                </div>

                                {/* Identity & Subtitle */}
                                <div className="text-center z-10 w-full px-2">
                                    <h3 className="text-sm lg:text-base font-black text-white group-hover:text-violet-400 transition-colors leading-tight mb-1 truncate">
                                        {item.user?.name || item.name}
                                    </h3>
                                    <div className="flex items-center justify-center gap-2 mb-3">
                                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-black text-violet-300 uppercase tracking-wider">
                                            {item.experience || 'Professional'}
                                        </span>
                                        {item.location?.country && (
                                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">
                                                📍 {item.location.country}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Skills / Tags */}
                                <div className="flex flex-wrap justify-center gap-1.5 mb-5 z-10">
                                    {(item.skills?.slice(0, 2) || ['Visual Storyteller', 'Editor']).map((skill, sIdx) => (
                                        <span key={sIdx} className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">
                                            {skill}
                                        </span>
                                    ))}
                                </div>

                                {/* Stats Footer */}
                                <div className="mt-auto w-full pt-4 border-t border-white/5 grid grid-cols-3 gap-1 z-10">
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1">
                                            <HiStar className="text-amber-400 text-[10px]" />
                                            <span className="text-[10px] font-black text-white">{item.ratingStats?.averageRating || item.rating || '4.9'}</span>
                                        </div>
                                        <span className="text-[7px] font-black text-zinc-600 uppercase">Rating</span>
                                    </div>
                                    <div className="flex flex-col items-center border-x border-white/5">
                                        <span className="text-[10px] font-black text-violet-400">{item.user?.suvixScore?.total || item.suvixScore?.total || '98'}</span>
                                        <span className="text-[7px] font-black text-zinc-600 uppercase">Score</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] font-black text-emerald-400">₹{item.hourlyRate?.min ?? (typeof item.hourlyRate === 'number' ? item.hourlyRate : 499)}</span>
                                        <span className="text-[7px] font-black text-zinc-600 uppercase">Rate/Hr</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Redesigned Compact Square Gig Cards */
                            <div className="absolute inset-0">
                                <img 
                                    src={item.thumbnail || item.images?.[0] || 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=2070&auto=format&fit=crop'} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    alt={item.title}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                
                                {/* Top Badge: Rating */}
                                <div className="absolute top-3 right-3 z-10 px-1.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1">
                                    <HiStar className="text-amber-400 text-[10px]" />
                                    <span className="text-[9px] font-black text-white">{item.rating || '4.9'}</span>
                                </div>

                                {/* Bottom Info: Title, Editor, and Green Price */}
                                <div className="absolute inset-x-0 bottom-0 p-3 lg:p-4 bg-gradient-to-t from-black/95 via-black/40 to-transparent">
                                    <h3 className="text-[10px] lg:text-xs font-black text-white group-hover:text-violet-400 transition-colors truncate mb-1">
                                        {item.title}
                                    </h3>
                                    
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            {item.editor?.profilePicture && (
                                                <img 
                                                    src={item.editor.profilePicture} 
                                                    className="w-3.5 h-3.5 rounded-full border border-white/20 object-cover flex-shrink-0"
                                                    alt=""
                                                />
                                            )}
                                            <p className="text-[7px] lg:text-[8px] text-zinc-400 font-bold truncate">
                                                by {item.editor?.name || 'Pro'}
                                            </p>
                                        </div>
                                        <p className="text-[9px] lg:text-[10px] text-emerald-400 font-black">₹{item.price || 999}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Neon Hover Glow */}
                        <div className="absolute inset-0 border border-violet-500/0 group-hover:border-violet-500/30 transition-all duration-500 rounded-[2.5rem] pointer-events-none z-20 shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]" />
                    </motion.div>
                ))}
            </div>
        </div>
    );

    if (loading) return (
        <div className="space-y-12">
            {[1, 2].map((i) => (
                <div key={i} className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <div className="h-6 w-40 bg-white/5 rounded-lg animate-pulse" />
                        <div className="h-8 w-20 bg-white/5 rounded-full animate-pulse" />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="aspect-[4/5] bg-white/5 rounded-[2rem] animate-pulse" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-14">
            {/* Featured Editors - 2 Row Grid (8 items) */}
            <PreviewSection 
                title="Featured Editors" 
                items={editors} 
                type="editor" 
                icon={HiUserGroup} 
                subLabel="Elite Talent"
                link="/explore-editors?tab=editors"
            />

            {/* Elite Gigs - Professional Selection */}
            <PreviewSection 
                title="Elite Gigs" 
                items={gigs} 
                type="gig" 
                icon={HiBriefcase} 
                subLabel="Top Services"
                link="/explore-editors?tab=gigs"
            />

            {/* Expand Explore Discovery */}
            <div className="flex justify-center pt-4">
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/explore-editors')}
                    className="px-8 py-3.5 bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-full hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all flex items-center gap-2"
                >
                    Expand Explore Page <HiOutlineChevronRight className="text-sm" />
                </motion.button>
            </div>
        </div>
    );
};

export default UnifiedExplorePreview;
