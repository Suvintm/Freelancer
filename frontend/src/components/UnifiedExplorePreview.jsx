
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    HiOutlineChevronRight,
    HiOutlineStar,
    HiSparkles,
    HiOutlineBriefcase,
    HiOutlineUserGroup,
    HiOutlineCheckBadge,
    HiOutlineArrowRight
} from "react-icons/hi2";
import { FaStar, FaShoppingBag, FaUsers } from "react-icons/fa";
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
            try {
                const [editorsRes, gigsRes] = await Promise.all([
                    axios.get(`${backendURL}/api/explore/editors?limit=4`),
                    axios.get(`${backendURL}/api/explore/gigs?limit=4`)
                ]);
                setEditors(editorsRes.data.editors || []);
                setGigs(gigsRes.data.gigs || []);
            } catch (err) {
                console.error("Failed to fetch explore previews", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [backendURL]);

    const PreviewSection = ({ title, items, type, icon: Icon, color, link }) => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 ${color} rounded-lg flex items-center justify-center`}>
                        <Icon className="text-white text-xs" />
                    </div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h2>
                </div>
                <button 
                    onClick={() => navigate(link)}
                    className="group text-[10px] font-bold text-gray-500 hover:text-white flex items-center gap-1 uppercase tracking-widest transition-all"
                >
                    View All <HiOutlineArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 px-0">
                {items.map((item) => (
                    <motion.div
                        key={item._id}
                        whileHover={{ y: -4 }}
                        onClick={() => navigate(type === 'editor' ? `/editor/${item._id}` : `/explore-editors?tab=gigs`)}
                        className="bg-[#0d0d12] border border-white/[0.06] rounded-2xl overflow-hidden cursor-pointer group hover:border-violet-500/30 transition-all shadow-lg"
                    >
                        {/* Image/Thumbnail Container */}
                        <div className="relative aspect-[4/3] w-full overflow-hidden">
                            <img 
                                src={type === 'editor' 
                                    ? (item.profilePicture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png')
                                    : (item.thumbnail || item.images?.[0] || 'https://via.placeholder.com/300x200')
                                } 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                alt=""
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                            
                            {/* Stats Badge */}
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1">
                                <FaStar className="text-amber-400 text-[8px]" />
                                <span className="text-[9px] font-bold text-white">{item.rating || '4.9'}</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-3">
                            <div className="flex items-center gap-1.5 mb-1 text-[8px] font-black text-violet-400 uppercase tracking-tighter">
                                {type === 'editor' ? (
                                    <>
                                        <HiOutlineUserGroup className="text-[10px]" />
                                        <span>Editor</span>
                                    </>
                                ) : (
                                    <>
                                        <HiOutlineBriefcase className="text-[10px]" />
                                        <span>Gig</span>
                                    </>
                                )}
                            </div>
                            <h3 className="text-xs font-bold text-white truncate group-hover:text-violet-400 transition-colors">
                                {type === 'editor' ? item.name : item.title}
                            </h3>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-[10px] text-zinc-500 font-medium truncate max-w-[70%]">
                                    {type === 'editor' ? (item.skills?.[0] || 'Professional') : `Starting at ₹${item.price || 499}`}
                                </span>
                                {type === 'editor' && item.isVerified && (
                                    <HiOutlineCheckBadge className="text-indigo-400 text-sm" />
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Mobile "See More" redirect component is visually integrated above */}
        </div>
    );

    if (loading) return (
        <div className="space-y-8 animate-pulse">
            <div className="h-48 bg-white/5 rounded-3xl" />
            <div className="h-48 bg-white/5 rounded-3xl" />
        </div>
    );

    return (
        <div className="space-y-10">
            {/* Featured Editors */}
            <PreviewSection 
                title="Featured Editors" 
                items={editors} 
                type="editor" 
                icon={HiOutlineUserGroup} 
                color="bg-violet-600"
                link="/explore-editors?tab=editors"
            />

            {/* Featured Gigs */}
            <PreviewSection 
                title="Elite Gigs" 
                items={gigs} 
                type="gig" 
                icon={HiOutlineBriefcase} 
                color="bg-emerald-600"
                link="/explore-editors?tab=gigs"
            />

            {/* Redirect Button at very bottom of section (optional, as headers have it) */}
            <div className="flex justify-center pt-2">
                <button
                    onClick={() => navigate('/explore-editors')}
                    className="px-8 py-3 bg-white text-black text-xs font-bold rounded-full hover:bg-gray-200 transition-all flex items-center gap-2 shadow-xl"
                >
                    Expand Explore Page <HiOutlineChevronRight className="text-sm" />
                </button>
            </div>
        </div>
    );
};

export default UnifiedExplorePreview;
