import React, { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HiOutlineSparkles, HiOutlinePlus } from "react-icons/hi2";
import { ENRICHED_STORY_DATA } from "../utils/storiesData";

// Optimized Individual Story Item to prevent unnecessary re-renders
const StoryItem = memo(({ story, idx, isLoading, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.03 }}
      onClick={() => onClick(story, idx)}
      className="flex-shrink-0 flex flex-col items-center gap-1 group cursor-pointer border-none bg-transparent"
    >
      {/* Circle Wrapper - Static Parent */}
      <div className="relative w-[52px] h-[52px] md:w-[60px] md:h-[60px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
        
        {/* Spinning Gradient Ring (Regular or Loading) */}
        {(story.active || isLoading) && (
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              isLoading ? "animate-[spin_0.8s_linear_infinite]" : "animate-[spin_8s_linear_infinite]"
            }`}
            style={{ willChange: "transform" }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="url(#story-gradient)"
                strokeWidth="3"
                strokeDasharray={isLoading ? "8 6" : "1000"}
                className="transition-all duration-300"
                style={{ strokeLinecap: "round" }}
              />
            </svg>
          </div>
        )}

        {/* Static Background Ring for Inactive Stories */}
        {!story.active && !isLoading && (
          <div className="absolute inset-0 p-[1.5px] rounded-full bg-white/5" />
        )}

        {/* Inner Space - Static Avatar Container */}
        <div className="relative z-10 bg-[#050509] light:bg-white p-[1.5px] rounded-full w-[48px] h-[48px] md:w-[56px] md:h-[56px] flex items-center justify-center shadow-sm">
          {/* Avatar */}
          <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center relative">
            {story.isUser ? (
              <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/50">
                <HiOutlinePlus className="text-sm" />
              </div>
            ) : (
              <img 
                src={story.image} 
                alt={story.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 grayscale-[40%] group-hover:grayscale-0 brightness-90 group-hover:brightness-100" 
                loading="lazy"
              />
            )}
            {/* Subtle Glow Overlay */}
            {story.active && (
              <div className="absolute inset-0 bg-indigo-500/5 mix-blend-overlay group-hover:opacity-0 transition-opacity" />
            )}
          </div>
        </div>
        
        {/* Add Button for User Story */}
        {story.isUser && (
           <div className="absolute bottom-0.5 right-0.5 z-20 w-4 h-4 bg-white text-[#050509] rounded-full border border-[#050509] flex items-center justify-center shadow-lg">
              <HiOutlinePlus className="text-[10px]" />
           </div>
        )}
      </div>

      {/* Name Label */}
      <span className={`relative z-10 text-[8px] font-bold tracking-tight text-center truncate w-14 transition-colors ${
        (story.active || isLoading) ? "text-white/90" : "text-zinc-500 group-hover:text-zinc-300"
      }`}>
        {story.name}
      </span>
    </motion.div>
  );
});

const StoryCarousel = memo(({ stories = [] }) => {
  const [loadingStoryId, setLoadingStoryId] = useState(null);
  const navigate = useNavigate();

  const displayStories = stories.length > 0 ? stories : ENRICHED_STORY_DATA;

  const handleStoryClick = (story, idx) => {
    if (loadingStoryId) return;
    setLoadingStoryId(story.id);
    
    // Simulate opening story/loading
    setTimeout(() => {
      setLoadingStoryId(null);
      // NAVIGATE TO THE STORY PAGE WITH ID
      navigate(`/stories/${story.id}`);
    }, 1200);
  };

  return (
    <div className="w-full py-1.5 overflow-hidden">
      {/* Performance optimized SVG definition */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="story-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#71717a" />
          </linearGradient>
        </defs>
      </svg>

      {/* Horizontal Scroll Area */}
      <div className="flex overflow-x-auto gap-3.5 px-4 no-scrollbar scroll-smooth">
        {displayStories.map((story, idx) => (
          <StoryItem 
            key={story.id} 
            story={story} 
            idx={idx} 
            isLoading={loadingStoryId === story.id}
            onClick={handleStoryClick}
          />
        ))}
      </div>
    </div>
  );
});

export default StoryCarousel;
