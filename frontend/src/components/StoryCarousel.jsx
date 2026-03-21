import React from "react";
import { motion } from "framer-motion";
import { HiOutlineSparkles, HiOutlinePlus } from "react-icons/hi2";

const StoryCarousel = ({ stories = [] }) => {
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

  return (
    <div className="w-full py-1.5">
      {/* Horizontal Scroll Area */}
      <div className="flex overflow-x-auto gap-3.5 px-4 no-scrollbar scroll-smooth">
        {displayStories.map((story, idx) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.03 }}
            className="flex-shrink-0 flex flex-col items-center gap-1 group cursor-pointer"
          >
            {/* Circle Wrapper */}
            <div className={`relative p-[1.5px] rounded-full transition-transform duration-300 group-hover:scale-105 group-active:scale-95 ${
              story.active 
                ? "bg-gradient-to-tr from-white/80 via-indigo-400 to-zinc-500" 
                : "bg-white/5"
            }`}>
              {/* Inner Space */}
              <div className="bg-[#050509] light:bg-white p-[1.5px] rounded-full">
                {/* Avatar */}
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center relative">
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
                  {/* Subtle Glow */}
                  {story.active && (
                    <div className="absolute inset-0 bg-indigo-500/5 mix-blend-overlay group-hover:opacity-0 transition-opacity" />
                  )}
                </div>
              </div>
              
              {/* Add Button for User Story */}
              {story.isUser && (
                 <div className="absolute bottom-0 right-0 w-4 h-4 bg-white text-[#050509] rounded-full border border-[#050509] flex items-center justify-center">
                    <HiOutlinePlus className="text-[10px]" />
                 </div>
              )}
            </div>

            {/* Name Label */}
            <span className={`text-[8px] font-bold tracking-tight text-center truncate w-14 transition-colors ${
              story.active ? "text-white/90" : "text-zinc-500 group-hover:text-zinc-300"
            }`}>
              {story.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StoryCarousel;
