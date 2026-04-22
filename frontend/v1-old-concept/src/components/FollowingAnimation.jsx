import React from "react";
import { motion } from "framer-motion";
import { HiHandThumbUp } from "react-icons/hi2";

const FollowingAnimation = ({ onComplete, variant = "global" }) => {
    const isLocal = variant === "local";

    // Decorative icons positions and variations
    const icons = [
        { id: 1, type: "plus", x: isLocal ? -40 : -80, y: isLocal ? -30 : -60, delay: 0 },
        { id: 2, type: "dash", x: isLocal ? 45 : 90, y: isLocal ? -20 : -40, delay: 0.1 },
        { id: 3, type: "plus", x: isLocal ? -30 : -60, y: isLocal ? 35 : 70, delay: 0.2 },
        { id: 4, type: "hand", x: isLocal ? 35 : 70, y: isLocal ? -40 : -80, delay: 0.05 },
        { id: 5, type: "dash", x: isLocal ? -50 : -100, y: isLocal ? 5 : 10, delay: 0.15 },
        { id: 6, type: "plus", x: isLocal ? 20 : 40, y: isLocal ? 30 : 60, delay: 0.25 },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onAnimationComplete={onComplete}
            className={`${isLocal ? "absolute inset-0 z-50 bg-black/60 backdrop-blur-[2px]" : "fixed inset-0 z-[9999]"} flex items-center justify-center pointer-events-none rounded-2xl`}
        >
            <div className="relative">
                {/* Main "Following" Pill */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 20 }}
                    animate={{ 
                        scale: [0.5, 1.1, 1],
                        opacity: 1,
                        y: 0
                    }}
                    transition={{ 
                        duration: 0.5,
                        ease: "easeOut"
                    }}
                    className={`${isLocal ? "px-4 py-1.5" : "px-8 py-3"} bg-gradient-to-r from-[#ff4d94] to-[#ff71ac] rounded-full shadow-[0_10px_30px_rgba(255,77,148,0.4)] border border-white/20`}
                >
                    <span className={`${isLocal ? "text-[10px]" : "text-lg"} text-white font-bold tracking-tight uppercase`}>
                        Following
                    </span>
                </motion.div>

                {/* Floating Decorative Icons */}
                {icons.map((icon) => (
                    <motion.div
                        key={icon.id}
                        initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                        animate={{ 
                            opacity: [0, 1, 0],
                            x: icon.x,
                            y: icon.y,
                            scale: [0, 1.2, 0.8],
                            rotate: [0, 15, -15]
                        }}
                        transition={{ 
                            duration: 1.2,
                            delay: icon.delay,
                            ease: "easeOut"
                        }}
                        className="absolute top-1/2 left-1/2 text-[#ff4d94]"
                    >
                        {icon.type === "plus" && (
                            <span className="text-2xl font-light transform rotate-45 select-none">+</span>
                        )}
                        {icon.type === "dash" && (
                            <span className="text-2xl font-light select-none">—</span>
                        )}
                        {icon.type === "hand" && (
                            <div className="text-black bg-white rounded-full p-1 shadow-md border border-black/10">
                                <HiHandThumbUp size={16} />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default FollowingAnimation;
