import React from "react";
import { motion } from "framer-motion";
import { HiOutlineSparkles, HiOutlinePlus } from "react-icons/hi2";

const StoryCarousel = ({ stories = [] }) => {
  const [loadingStoryId, setLoadingStoryId] = React.useState(null);

  // Mock stories if none provided
  const defaultStories = [
    { id: 'me', name: "My Story", image: null, isUser: true },
    { id: 1, name: "Alex Rivera", image: "https://i.pravatar.cc/150?u=1", active: true },
    { id: 2, name: "Sarah Chen", image: "https://i.pravatar.cc/150?u=2", active: true },
    { id: 3, name: "Marc J.", image: "https://i.pravatar.cc/150?u=3", active: true },
    { id: 4, name: "Elena S.", image: "https://i.pravatar.cc/150?u=4", active: true },
    { id: 5, name: "VFX Master", image: "https://i.pravatar.cc/150?u=5", active: false },
    { id: 6, name: "Neo", image: "https://i.pravatar.cc/150?u=6", active: false },
    { id: 7, name: "Mika", image: "https://i.pravatar.cc/150?u=7", active: false },
  ];

  const displayStories = stories.length > 0 ? stories : defaultStories;

  const handleStoryClick = (id) => {
    if (loadingStoryId) return;
    setLoadingStoryId(id);
    // Simulate opening story/loading
    setTimeout(() => {
      setLoadingStoryId(null);
      // Here you would normally navigate or open a modal
    }, 1200);
  };

  return (
    <div className="w-full py-1.5 overflow-hidden">
      {/* Defined Gradient for SVG */}
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
        {displayStories.map((story, idx) => {
          const isLoading = loadingStoryId === story.id;
          
          return (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => handleStoryClick(story.id)}
              className="flex-shrink-0 flex flex-col items-center gap-1 group cursor-pointer"
            >
              {/* Circle Wrapper - Static Parent */}
              <div className="relative w-[52px] h-[52px] md:w-[60px] md:h-[60px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                
                {/* Spinning Gradient Ring (Regular or Loading) */}
                {(story.active || isLoading) && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ 
                      duration: isLoading ? 0.8 : 8, 
                      repeat: Infinity, 
                      ease: "linear" 
                    }}
                    className="absolute inset-0"
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
                        style={{
                          strokeLinecap: "round"
                        }}
                      />
                    </svg>
                  </motion.div>
                )}

                {/* Static Background Ring for Inactive Stories */}
                {!story.active && !isLoading && (
                  <div className="absolute inset-0 p-[1.5px] rounded-full bg-white/5" />
                )}

                {/* Inner Space - Static Avatar Container */}
                <div className="relative z-10 bg-[#050509] light:bg-white p-[1.5px] rounded-full w-[48px] h-[48px] md:w-[56px] md:h-[56px] flex items-center justify-center">
                  {/* Avatar */}
                  <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center relative">
                    {story.isUser ? (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/50">
                        <HiOutlinePlus className="text-lg" />
                      </div>
                    ) : (
                      <img 
                        src={story.image} 
                        alt={story.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 grayscale-[40%] group-hover:grayscale-0 brightness-90 group-hover:brightness-100" 
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
        })}
      </div>
    </div>
  );
};

export default StoryCarousel;
