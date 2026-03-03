import React from "react";
import { motion } from "framer-motion";

/**
 * MusicVisualizer - A sleek, animated waveform that reacts to playback.
 * Used in Reels to indicate active audio/music.
 */
const MusicVisualizer = ({ isPlaying = true }) => {
    // Array of indices for the bars
    const bars = Array.from({ length: 15 });

    return (
        <div className="flex items-center gap-[2px] h-4 px-1 overflow-hidden">
            {bars.map((_, i) => (
                <motion.div
                    key={i}
                    className="w-[2px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                    animate={
                        isPlaying
                            ? {
                                  height: [
                                      "30%",
                                      "80%",
                                      "40%",
                                      "95%",
                                      "30%",
                                  ],
                              }
                            : { height: "20%" }
                    }
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.04, // Creates the left-to-right wave effect
                    }}
                />
            ))}
            
            <span className="text-[8px] font-bold text-white uppercase tracking-[0.2em] ml-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] drop-shadow-md">
                Original Audio
            </span>
        </div>
    );
};

export default MusicVisualizer;
