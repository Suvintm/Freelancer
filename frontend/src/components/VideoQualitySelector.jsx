import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCheck, HiChevronDown } from 'react-icons/hi2';

const VideoQualitySelector = ({ 
    currentQuality, 
    availableQualities = [], 
    preferredQuality, 
    setPreferredQuality,
    onMenuOpen,
    onMenuClose
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = (e) => {
        e.stopPropagation();
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState) {
            onMenuOpen && onMenuOpen();
        } else {
            onMenuClose && onMenuClose();
        }
    };

    const handleSelect = (e, qualityStr) => {
        e.stopPropagation();
        setPreferredQuality(qualityStr);
        setIsOpen(false);
        onMenuClose && onMenuClose();
    };

    // Always include standard HD/SD targets so the user can set them globally,
    // combined with the exact specific heights the HLS stream parsed!
    const standardQualities = [1080, 720, 480, 360];
    const combinedQualities = [...new Set([...standardQualities, ...availableQualities])].sort((a, b) => b - a);

    const displayBadgeText = preferredQuality === "Auto" 
        ? `Auto (${currentQuality})` 
        : preferredQuality + "p";

    return (
        <div className="absolute top-[60px] right-5 z-50 flex flex-col items-end">
            <button 
                onClick={handleToggle}
                className="flex items-center gap-1 text-[9px] font-bold text-white/90 border border-white/40 rounded px-2 py-0.5 tracking-widest drop-shadow-md bg-black/20 backdrop-blur-md uppercase hover:bg-white/10 transition-colors"
            >
                {isOpen ? "Select Quality" : displayBadgeText}
                <HiChevronDown className={`ml-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 5 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="mt-2 w-32 bg-black/80 backdrop-blur-xl border border-white/20 rounded-lg overflow-hidden shadow-2xl flex flex-col z-[60]"
                    >
                        {/* Auto Option */}
                        <button
                            onClick={(e) => handleSelect(e, 'Auto')}
                            className={`flex items-center justify-between px-3 py-2 text-xs font-semibold hover:bg-white/10 transition text-left ${preferredQuality === 'Auto' ? 'text-white' : 'text-white/60'}`}
                        >
                            Auto
                            {preferredQuality === 'Auto' && <HiCheck className="text-white" />}
                        </button>
                        
                        <div className="h-px w-full bg-white/10" />

                        {/* Specific Resolutions */}
                        <div className="max-h-60 overflow-y-auto scrollbar-hide">
                            {combinedQualities.map(h => {
                                const isAvailableInThisVideo = availableQualities.includes(h) || availableQualities.length === 0;
                                return (
                                    <button
                                        key={h}
                                        onClick={(e) => handleSelect(e, h.toString())}
                                        className={`flex items-center w-full justify-between px-3 py-2.5 text-xs font-medium hover:bg-white/10 transition text-left ${preferredQuality === h.toString() ? 'text-white font-bold' : isAvailableInThisVideo ? 'text-white/80' : 'text-white/40'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {h}p
                                            {!isAvailableInThisVideo && <span className="text-[8px] bg-white/10 px-1 py-0.5 rounded text-white/50">Unsupported on this reel</span>}
                                        </div>
                                        {preferredQuality === h.toString() && <HiCheck className="text-white" />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VideoQualitySelector;
