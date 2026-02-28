import React from "react";
import { motion } from "framer-motion";
import { HiOutlineArrowPath } from "react-icons/hi2";
import useRefreshManager from "../hooks/useRefreshManager";
import { useHomeStore } from "../store/homeStore";

const RefreshButton = ({ className = "" }) => {
    const { triggerRefresh } = useRefreshManager();
    const isRefreshing = useHomeStore((s) => s.isRefreshing);

    return (
        <motion.button
            onClick={() => triggerRefresh(true)}
            disabled={isRefreshing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative p-2.5 rounded-xl  hover:bg-white/10  border border-white/10 backdrop-blur-md transition-all group ${className}`}
            title="Refresh Dashboard"
        >
            <motion.div 
                animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }} 
                transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0.5 }}
                className="flex items-center justify-center"
            >
                <HiOutlineArrowPath className={`text-lg transition-colors ${isRefreshing ? "text-emerald-500" : "text-gray-400 light:text-slate-600 group-hover:text-white light:group-hover:text-slate-900"}`} />
            </motion.div>
            
            {/* Subtle pulsate effect when refreshing */}
            {isRefreshing && (
                <motion.div
                    layoutId="refresh-pulse"
                    className="absolute inset-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                />
            )}
        </motion.button>
    );
};

export default RefreshButton;
