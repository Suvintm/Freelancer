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
                        {availableQualities.length > 0 ? (
                            availableQualities.map(h => (
                                <button
                                    key={h}
                                    onClick={(e) => handleSelect(e, h.toString())}
                                    className={`flex items-center justify-between px-3 py-2 text-xs font-semibold hover:bg-white/10 transition text-left ${preferredQuality === h.toString() ? 'text-white' : 'text-white/60'}`}
                                >
                                    {h}p
                                    {preferredQuality === h.toString() && <HiCheck className="text-white" />}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-[10px] text-white/40 italic text-center">
                                Processing...
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VideoQualitySelector;
