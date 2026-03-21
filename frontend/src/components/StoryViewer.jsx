import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineXMark, HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi2";
import { useAppContext } from "../context/AppContext";

/**
 * StoryViewer - Production-grade full-screen story experience.
 */
const StoryViewer = ({ isOpen, initialUserIndex = 0, users = [], onClose }) => {
  const { setIsHeaderFooterHidden } = useAppContext();
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  
  const progressInterval = useRef(null);
  const STORY_DURATION = 5000; // 5 seconds per story

  // Hide bottom nav when story viewer is open
  useEffect(() => {
    setIsHeaderFooterHidden(isOpen);
    return () => setIsHeaderFooterHidden(false);
  }, [isOpen]);

  // Sync initial user index and state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentUserIndex(initialUserIndex);
      setCurrentStoryIndex(0);
      setProgress(0);
      setImgLoading(true);
    }
  }, [isOpen, initialUserIndex]);

  const activeUser = users[currentUserIndex];
  const activeStory = activeUser?.stories[currentStoryIndex];

  // Handle automatic progression
  useEffect(() => {
    if (!isOpen || isPaused) {
      if (progressInterval.current) clearInterval(progressInterval.current);
      return;
    }

    const startTime = Date.now() - (progress / 100) * STORY_DURATION;

    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / STORY_DURATION) * 100;

      if (newProgress >= 100) {
        handleNext();
      } else {
        setProgress(newProgress);
      }
    }, 16); // ~60fps

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isOpen, isPaused, currentUserIndex, currentStoryIndex]);

  // Navigation Logic
  const handleNext = () => {
    setImgLoading(true);
    if (currentStoryIndex < activeUser.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentUserIndex < users.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    setImgLoading(true);
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      const prevUser = users[currentUserIndex - 1];
      setCurrentStoryIndex(prevUser.stories.length - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  if (!isOpen || !activeUser) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overscroll-none touch-none select-none">
      
      {/* User Carousel (Horizontal Swipe Area) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeUser.id}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.x < -100) handleNext();
            else if (info.offset.x > 100) handlePrev();
          }}
          className="relative w-full h-full max-w-[450px] bg-zinc-900 md:rounded-xl overflow-hidden shadow-2xl"
        >
          {/* Background Story Content */}
          <div className="absolute inset-0 bg-[#050505] flex items-center justify-center">
            {imgLoading && (
              <div className="z-20 flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-[9px] text-white/40 uppercase tracking-widest font-black">Buffering</span>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStory.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                <img 
                  src={activeStory.url} 
                  alt="Story" 
                  onLoad={() => setImgLoading(false)}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Top Interface: Progress Bars & Profile */}
          <div className="absolute top-0 left-0 right-0 p-3 z-30 pt-safe">
            {/* Progress Bars */}
            <div className="flex gap-1 mb-3">
              {activeUser.stories.map((s, i) => (
                <div key={s.id} className="h-[2px] flex-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-100 ease-linear"
                    style={{ 
                      width: i < currentStoryIndex ? "100%" : i === currentStoryIndex ? `${progress}%` : "0%" 
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Profile Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 overflow-hidden bg-zinc-800">
                  <img src={activeUser.image} alt={activeUser.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-white tracking-wide">{activeUser.name}</span>
                  <span className="text-[9px] text-white/60">{activeStory.time} ago</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-full bg-black/20 backdrop-blur-md text-white/80 hover:bg-black/40 transition-colors"
              >
                <HiOutlineXMark className="text-xl" />
              </button>
            </div>
          </div>

          {/* Interaction Regions (Tap Navigation) */}
          <div className="absolute inset-x-0 top-20 bottom-20 z-20 flex">
            <div 
              className="w-1/3 h-full cursor-pointer" 
              onClick={handlePrev}
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            />
            <div 
              className="w-2/3 h-full cursor-pointer" 
              onClick={handleNext}
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            />
          </div>

          {/* Bottom Interface: Actions */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between z-30">
            <div className="flex-1 flex gap-2">
              <input 
                type="text" 
                placeholder="Send message..." 
                className="flex-1 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 text-[10px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default StoryViewer;
