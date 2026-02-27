import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaPlay, FaEye, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";

const SuggestedReels = () => {
    const { backendURL } = useAppContext();
    const navigate = useNavigate();
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestedReels = async () => {
            try {
                // Fetch a small batch of reels for the horizontal row
                const { data } = await axios.get(`${backendURL}/api/reels/feed?page=1&limit=10`);
                setReels(data.reels || []);
            } catch (err) {
                console.error("Failed to fetch suggested reels:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSuggestedReels();
    }, [backendURL]);

    if (loading) {
        return (
            <div className="flex gap-4 overflow-hidden py-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-shrink-0 w-36 h-64 bg-white/5 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (reels.length === 0) return null;

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <FaPlay className="text-purple-500 text-[10px]" />
                    </div>
                    <h2 className="text-sm font-bold text-white light:text-slate-900">Suggested Reels</h2>
                </div>
                <button 
                    onClick={() => navigate("/reels")}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition-colors"
                >
                    View all <FaArrowRight className="text-[8px]" />
                </button>
            </div>

            <div className="relative">
                {/* Horizontal Scroll Area */}
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {reels.map((reel, idx) => (
                        <ReelThumbnail key={reel._id} reel={reel} index={idx} />
                    ))}
                    
                    {/* View More Card */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/reels")}
                        className="flex-shrink-0 w-36 h-64 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all snap-start"
                    >
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                            <FaArrowRight className="text-purple-400" />
                        </div>
                        <span className="text-xs font-semibold text-white">View More</span>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

const ReelThumbnail = ({ reel, index }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            if (isHovered) {
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }
    }, [isHovered]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => navigate(`/reels?id=${reel._id}`)}
            className="flex-shrink-0 w-36 h-64 bg-[#0a0a0c] rounded-2xl overflow-hidden relative cursor-pointer border border-white/5 hover:border-purple-500/30 transition-all snap-start group"
        >
            {/* Video Preview */}
            {reel.mediaType === "video" ? (
                <video
                    ref={videoRef}
                    src={reel.mediaUrl}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                    muted
                    loop
                    playsInline
                />
            ) : (
                <img
                    src={reel.mediaUrl}
                    alt={reel.title}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                <div className="flex items-center gap-1 mb-1">
                    <FaEye className="text-[10px] text-white/70" />
                    <span className="text-[9px] font-medium text-white/70">{reel.viewsCount || 0}</span>
                </div>
                <p className="text-[10px] font-semibold text-white line-clamp-2 leading-tight">
                    {reel.title}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                    <img 
                        src={reel.editor?.profilePicture} 
                        alt={reel.editor?.name}
                        className="w-4 h-4 rounded-full border border-white/20"
                    />
                    <span className="text-[8px] text-white/80 truncate font-medium">{reel.editor?.name}</span>
                </div>
            </div>

            {/* Play Icon (when not hovered) */}
            {!isHovered && reel.mediaType === "video" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <FaPlay className="text-white text-[10px] ml-0.5" />
                </div>
            )}
        </motion.div>
    );
};

export default SuggestedReels;
