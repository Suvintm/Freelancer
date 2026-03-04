import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlinePlay, HiOutlineVideoCamera, HiHeart } from "react-icons/hi2";
import { repairUrl } from "../utils/urlHelper.jsx";

const ReelGridItem = ({ reel, onPreviewStart }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isHolding, setIsHolding] = useState(false);
    const videoRef = useRef(null);
    const mediaUrl = repairUrl(reel.mediaUrl);

    // Interaction Overhaul:
    // Hold: Play locally
    // Click: Open Modal
    
    useEffect(() => {
        if (!videoRef.current || reel.mediaType !== "video") return;
        if (isHolding) {
            videoRef.current.play().catch(() => {});
        } else {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [isHolding, reel.mediaType]);

    const handleHoldStart = (e) => {
        setIsHolding(true);
    };

    const handleHoldEnd = () => {
        setIsHolding(false);
    };

    const handleClick = (e) => {
        // Only trigger click if we weren't "holding" for a long time?
        // Actually, user wants "Click: open popup".
        onPreviewStart(reel);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-[9/16] group cursor-pointer overflow-hidden rounded-xl bg-zinc-900"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                handleHoldEnd();
            }}
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onTouchEnd={handleHoldEnd}
            onClick={handleClick}
        >
            {/* Thumbnail */}
            {reel.mediaType === "video" ? (
                <video 
                    ref={videoRef}
                    src={mediaUrl} 
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                    muted 
                    playsInline
                    loop
                    crossOrigin="anonymous"
                />
            ) : (
                <img 
                    src={mediaUrl} 
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                    alt={reel.title}
                    crossOrigin="anonymous"
                />
            )}

            {/* Content Overlay */}
            <div className={`absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300 flex flex-col justify-end p-3 ${isHolding ? "opacity-0" : "opacity-100"}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <HiHeart className="text-white text-xs opacity-80" />
                        <span className="text-white text-[10px] font-bold">{reel.likesCount || 0}</span>
                    </div>
                </div>
            </div>

            {/* Media Icon & NEW Badge(Top Right) */}
            <div className={`absolute top-2 right-2 flex flex-col items-end gap-1.5 transition-opacity duration-300 ${isHolding ? "opacity-0" : "opacity-100"}`}>
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
                {isHovered && !isHolding && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <span className="bg-black/60 backdrop-blur-md text-white text-[8px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 shadow-xl">
                            Hold to play
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ReelGridItem;
