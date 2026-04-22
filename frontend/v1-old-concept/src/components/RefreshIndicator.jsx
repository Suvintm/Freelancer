import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { useHomeStore } from "../store/homeStore";

/**
 * RefreshIndicator — Instagram-style circular loading indicator.
 * @param {number} pullDistance - Current gesture distance.
 */
const RefreshIndicator = ({ pullDistance = 0 }) => {
    const isRefreshing = useHomeStore((s) => s.isRefreshing);
    const showCooldownNotice = useHomeStore((s) => s.showCooldownNotice);
    
    // Config
    const THRESHOLD = 120;
    const progress = Math.min(pullDistance / THRESHOLD, 1);
    
    // Positioning
    // When refreshing or showing notice, it stays at 20px. 
    const isActive = isRefreshing || showCooldownNotice;
    const y = isActive ? 20 : (pullDistance > 10 ? 15 + (pullDistance * 0.1) : -40);

    return (
        <AnimatePresence>
            {(isActive || pullDistance > 10) && (
                <motion.div
                    initial={{ y: -50, opacity: 0, x: "-50%" }}
                    animate={{ y, opacity: 1, x: "-50%" }}
                    exit={{ y: -50, opacity: 0, x: "-50%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed top-12 left-1/2 z-[100] pointer-events-none"
                >
                    <div className={`backdrop-blur-xl border shadow-lg rounded-full px-4 py-2 flex items-center gap-2 transition-colors duration-300 ${
                        showCooldownNotice 
                        ? "bg-amber-500/90 border-amber-400 text-white" 
                        : "bg-white/95 light:bg-white border-zinc-200 text-zinc-900"
                    }`}>
                        {/* Status Icon */}
                        <div className="relative w-6 h-6 flex items-center justify-center">
                            {showCooldownNotice ? (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    <HiOutlineExclamationCircle className="text-xl" />
                                </motion.div>
                            ) : (
                                <svg className="w-full h-full -rotate-90">
                                    {/* Background Circle */}
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        className="text-zinc-100 dark:text-zinc-800"
                                    />
                                    {/* Progress/Spinner Circle */}
                                    <motion.circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        className="text-zinc-900"
                                        initial={{ pathLength: 0 }}
                                        animate={isRefreshing ? { 
                                            pathLength: 0.3,
                                            rotate: 360 
                                        } : { 
                                            pathLength: progress 
                                        }}
                                        transition={isRefreshing ? {
                                            rotate: { repeat: Infinity, duration: 0.8, ease: "linear" },
                                            pathLength: { duration: 0.2 }
                                        } : { type: "tween" }}
                                    />
                                </svg>
                            )}
                        </div>

                        {/* Text Label */}
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                            {showCooldownNotice 
                                ? "Wait a moment..." 
                                : (isRefreshing ? "Updating Feed" : "Pull to Refresh")}
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RefreshIndicator;
