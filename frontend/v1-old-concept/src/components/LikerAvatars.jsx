import React from "react";
import { FaHeart } from "react-icons/fa";
import { motion } from "framer-motion";
import { repairUrl } from "../utils/urlHelper";

/**
 * LikerAvatars - Displays overlapping avatars of latest likers
 * and summary text (e.g., "User and X others")
 */
const LikerAvatars = ({ latestLikers = [], likesCount = 0 }) => {
    if (!latestLikers || latestLikers.length === 0) return null;

    // The backend provides up to 3 latest likers.
    // We want to show them in overlapping order.
    // The latest one is usually at the end of the array if we use slice(likes, -3)
    // but the aggregation might have returned them in any order.
    // Let's assume the array is sorted by latest first for display purposes.
    
    const displayLikers = [...latestLikers].reverse(); // Most recent first for the name
    const mainLiker = displayLikers[0];
    const othersCount = likesCount - 1;

    return (
        <div className="flex items-center gap-3 mb-2 animate-fade-in">
            {/* Overlapping Avatars Container */}
            <div className="flex -space-x-3 items-center">
                {latestLikers.map((liker, index) => (
                    <motion.div 
                        key={liker._id} 
                        className="relative z-[10] group"
                        style={{ zIndex: 10 - index }}
                        initial={{ opacity: 0, x: -10, scale: 0.5 }}
                        animate={{ 
                            opacity: 1, 
                            x: 0, 
                            scale: 1,
                            y: [0, -4, 0] // Floating effect
                        }}
                        transition={{
                            // Entry animation
                            opacity: { duration: 0.4 },
                            x: { duration: 0.4 },
                            scale: { duration: 0.4, type: "spring", damping: 12 },
                            // Floating animation loop
                            y: {
                                duration: 2 + index * 0.5, // Different speeds for each
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: index * 0.2 // Staggered start
                            }
                        }}
                    >
                        <div className="w-8 h-8 rounded-full border-2 border-black overflow-hidden bg-gray-800 shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                            {liker.profilePicture ? (
                                <img 
                                    src={repairUrl(liker.profilePicture)} 
                                    alt={liker.name} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-bold">
                                    {liker.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        {/* Heart Badge on each avatar */}
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                            className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black flex items-center justify-center shadow-lg"
                        >
                            <FaHeart className="text-white text-[6px]" />
                        </motion.div>
                    </motion.div>
                ))}
            </div>

            {/* Text Summary */}
            <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col"
            >
                <p className="text-white text-[12px] font-semibold text-shadow drop-shadow-md">
                    <span className="hover:underline cursor-pointer decoration-red-500 underline-offset-2">{mainLiker?.name}</span>
                    {othersCount > 0 && (
                        <>
                            <span className="font-normal text-white/90"> and </span>
                            <span className="hover:underline cursor-pointer decoration-red-500 underline-offset-2">{othersCount} {othersCount === 1 ? 'other' : 'others'}</span>
                        </>
                    )}
                </p>
            </motion.div>
        </div>
    );
};

export default LikerAvatars;
