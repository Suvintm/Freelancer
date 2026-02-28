import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlinePlay, HiOutlineVideoCamera, HiHeart } from "react-icons/hi2";
import { repairUrl } from "../utils/urlHelper.jsx";

const ReelGridItem = ({ reel, onPreviewStart }) => {
    const [isHovered, setIsHovered] = useState(false);
    const holdTimerRef = useRef(null);
    const mediaUrl = repairUrl(reel.mediaUrl);

    // Instagram-style Hold to Preview logic
    const handleHoldStart = (e) => {
        // Prevent context menu on mobile
        // e.preventDefault(); 
        
        holdTimerRef.current = setTimeout(() => {
            onPreviewStart(reel);
        }, 300); // Trigger preview after 300ms hold
    };

    const handleHoldEnd = () => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        };
    }, []);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-[9/16] group cursor-pointer overflow-hidden rounded-xl bg-zinc-900 border border-white/5"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                handleHoldEnd();
            }}
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onTouchEnd={handleHoldEnd}
        >
            {/* Thumbnail */}
            {reel.mediaType === "video" ? (
                <video 
                    src={mediaUrl} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    muted 
                    playsInline
                    crossOrigin="anonymous"
                />
            ) : (
                <img 
                    src={mediaUrl} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt={reel.title}
                    crossOrigin="anonymous"
                />
            )}

            {/* Content Overlay */}
            <div className={`absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-end p-3`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <HiHeart className="text-white text-xs opacity-80" />
                        <span className="text-white text-[10px] font-bold">{reel.likesCount || 0}</span>
                    </div>
                </div>
            </div>

            {/* Media Icon & NEW Badge(Top Right) */}
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5">
                {/* NEW Badge */}
                {(() => {
                    const isNew = reel.createdAt && (new Date() - new Date(reel.createdAt)) < 24 * 60 * 60 * 1000;
                    if (!isNew) return null;
                    return (
                        <motion.div 
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="px-2 py-0.5 rounded-full border border-white/50 bg-white/5 backdrop-blur-sm flex items-center justify-center min-w-[35px]"
                        >
                            <span className="text-white text-[7px] font-medium uppercase tracking-tight">
                                NEW
                            </span>
                        </motion.div>
                    );
                })()}

                <div className="p-1.5 rounded-full bg-black/30 backdrop-blur-md opacity-70 group-hover:opacity-100 transition-opacity">
                    {reel.mediaType === "video" ? (
                        <HiOutlineVideoCamera className="text-white text-[10px]" />
                    ) : (
                        <HiOutlinePlay className="text-white text-[10px]" />
                    )}
                </div>
            </div>

            {/* Instructions (only on hover) */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <span className="bg-black/60 backdrop-blur-md text-white text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg border border-white/10">
                            Hold to peek
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ReelGridItem;
