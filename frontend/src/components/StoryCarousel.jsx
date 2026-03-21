import React, { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineSparkles, HiOutlinePlus } from "react-icons/hi2";
import StoryViewer from "./StoryViewer";

// Enhanced Mock Data for Production-level Story Experience
const ENRICHED_STORY_DATA = [
  { 
    id: 'me', 
    name: "My Story", 
    image: "https://i.pravatar.cc/150?u=me", 
    isUser: true,
    stories: [{ id: 's0', url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800", time: "Just now" }]
  },
  { 
    id: 1, 
    name: "Alex Rivera", 
    image: "https://i.pravatar.cc/150?u=1", 
    active: true,
    stories: [
      { 
        id: 's1', 
        url: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800", 
        time: "2h",
        comments: [
          { id: 'c1', userName: "DesignBot", userAvatar: "https://i.pravatar.cc/150?u=11", text: "That lighting is insane! 🔥", time: "1h" },
          { id: 'c2', userName: "PixelPerfect", userAvatar: "https://i.pravatar.cc/150?u=12", text: "Tutorial soon?", time: "45m" }
        ]
      },
      { 
        id: 's2', 
        url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800", 
        time: "1h",
        comments: []
      }
    ]
  },
  { 
    id: 2, 
    name: "Sarah Chen", 
    image: "https://i.pravatar.cc/150?u=2", 
    active: true,
    stories: [
      { 
        id: 's3', 
        url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800", 
        time: "5h",
        comments: [
          { id: 'c3', userName: "CodeRunner", userAvatar: "https://i.pravatar.cc/150?u=15", text: "Clean setup Sarah!", time: "2h" }
        ]
      }
    ]
  },
  { 
    id: 3, 
    name: "Marc J.", 
    image: "https://i.pravatar.cc/150?u=3", 
    active: true,
    stories: [
      { id: 's4', url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800", time: "12h" },
      { id: 's5', url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800", time: "10h" }
    ]
  },
  { 
    id: 4, 
    name: "Elena S.", 
    image: "https://i.pravatar.cc/150?u=4", 
    active: true,
    stories: [
      { id: 's6', url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800", time: "8h" }
    ]
  },
  { 
    id: 5, 
    name: "VFX Master", 
    image: "https://i.pravatar.cc/150?u=5", 
    active: false,
    stories: [{ id: 's7', url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800", time: "1d" }]
  },
];

// Optimized Individual Story Item to prevent unnecessary re-renders
const StoryItem = memo(({ story, idx, isLoading, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.03 }}
      onClick={() => onClick(story, idx)}
      className="flex-shrink-0 flex flex-col items-center gap-1 group cursor-pointer will-change-transform"
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
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeUserIndex, setActiveUserIndex] = useState(0);

  const displayStories = stories.length > 0 ? stories : ENRICHED_STORY_DATA;

  const handleStoryClick = (story, idx) => {
    if (loadingStoryId) return;
    setLoadingStoryId(story.id);
    
    // Simulate opening story/loading
    setTimeout(() => {
      setLoadingStoryId(null);
      setActiveUserIndex(idx);
      setIsViewerOpen(true);
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

      {/* Story Viewer Overlay */}
      <StoryViewer 
        isOpen={isViewerOpen}
        initialUserIndex={activeUserIndex}
        users={displayStories}
        onClose={() => setIsViewerOpen(false)}
      />
    </div>
  );
});

export default StoryCarousel;
