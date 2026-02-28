import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner } from "react-icons/fa";
import { useHomeStore } from "../store/homeStore";
import { HiArrowPath } from "react-icons/hi2";

/**
 * RefreshIndicator — Responsive loading indicator.
 * @param {number} pullDistance - Current gesture distance (optional).
 */
const RefreshIndicator = ({ pullDistance = 0 }) => {
    const isRefreshing = useHomeStore((s) => s.isRefreshing);
    
    // Calculate progress (0 to 1) 
    const progress = Math.min(pullDistance / 100, 1);
    const rotation = pullDistance * 2; // Degrees
    const y = isRefreshing ? 20 : (pullDistance > 10 ? pullDistance * 0.4 : -30);

    return (
        <AnimatePresence>
            {(isRefreshing || pullDistance > 10) && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y, opacity: progress + 0.2 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="fixed top-12 left-1/2 -translate-x-1/2 z-[50] pointer-events-none"
                >
                    <div className="bg-white light:bg-zinc-900 border border-zinc-200 light:border-zinc-800 p-2.5 rounded-full shadow-xl flex items-center justify-center">
                        <motion.div
                            animate={isRefreshing ? { rotate: 360 } : { rotate: rotation }}
                            transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { type: "tween", ease: "linear" }}
                        >
                            <HiArrowPath 
                                className={`text-indigo-500 text-lg ${isRefreshing ? 'opacity-100' : ''}`} 
                                style={{ opacity: isRefreshing ? 1 : progress }}
                            />
                        </motion.div>

                        {isRefreshing && (
                            <motion.div 
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: "auto", opacity: 1, marginLeft: 8 }}
                                className="flex items-center overflow-hidden"
                            >
                                <span className="text-[10px] font-black text-zinc-900 light:text-white uppercase tracking-widest whitespace-nowrap pr-2">
                                    Updating...
                                </span>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RefreshIndicator;
