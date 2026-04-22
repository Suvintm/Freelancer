import React, { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineXMark, HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { useAppContext } from "../context/AppContext";

/**
 * ProgressSegment - Isolated component for a single story progress bar.
 * Uses hardware-accelerated transitions to avoid main-thread re-renders.
 */
const ProgressSegment = memo(({ index, activeIndex, isPaused, duration, onComplete }) => {
  const isActive = index === activeIndex;
  const isFinished = index < activeIndex;

  return (
    <div className="h-[2px] flex-1 bg-white/20 rounded-full overflow-hidden relative">
      <motion.div
        initial={{ width: "0%" }}
        animate={{ 
          width: isFinished ? "100%" : isActive ? "100%" : "0%",
        }}
        transition={{ 
          duration: isActive && !isPaused ? duration / 1000 : 0, 
          ease: "linear" 
        }}
        onAnimationComplete={() => {
          if (isActive && !isPaused) onComplete();
        }}
        className="h-full bg-white will-change-[width]"
      />
    </div>
  );
});

/**
 * StoryViewer - Ultra-smooth production-grade story experience.
 * Optimized to remove 60fps Re-renders and use GPU-acceleration.
 */
const StoryViewer = ({ isOpen, initialUserIndex = 0, users = [], onClose }) => {
  const { setIsHeaderFooterHidden } = useAppContext();
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  
  const STORY_DURATION = 5000;

  const activeUser = users[currentUserIndex];
  const activeStory = activeUser?.stories[currentStoryIndex];
  const activeComments = activeStory?.comments || [];

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
      setImgLoading(true);
      setShowComments(false);
      setIsPaused(false);
    }
  }, [isOpen, initialUserIndex]);

  // Navigation Logic
  const handleNext = () => {
    if (showComments) return;
    setImgLoading(true);
    if (currentStoryIndex < activeUser.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentUserIndex < users.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (showComments) return;
    setImgLoading(true);
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      const prevUser = users[currentUserIndex - 1];
      setCurrentStoryIndex(prevUser.stories.length - 1);
    }
  };

  if (!isOpen || !activeUser) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overscroll-none touch-none select-none overflow-hidden">
      
      {/* User Animation Container (Instant Cross-Fade/Slide) */}
      <AnimatePresence initial={false}>
        <motion.div
          key={activeUser.id}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 250 }}
          drag={showComments ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.x < -100) handleNext();
            else if (info.offset.x > 100) handlePrev();
          }}
          className="relative w-full h-full max-w-[450px] bg-zinc-950 md:rounded-xl overflow-hidden shadow-2xl will-change-transform"
        >
          {/* Hardware-Accelerated Story Content */}
          <div className="absolute inset-0 bg-[#020205] flex items-center justify-center pointer-events-none">
            {imgLoading && (
              <div className="z-20 flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            )}
            <AnimatePresence initial={false}>
              <motion.div
                key={activeStory.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full h-full will-change-opacity"
              >
                <img 
                  src={activeStory.url} 
                  alt="" 
                  onLoad={() => setImgLoading(false)}
                  className={`w-full h-full object-cover transition-all duration-500 ${imgLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'} ${showComments ? 'brightness-[0.3] blur-md' : 'brightness-95'}`}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Top Interface: Hardware-Accelerated Progress Bars & Profile */}
          <div className="absolute top-0 left-0 right-0 p-4 z-40 pt-safe bg-gradient-to-b from-black/80 to-transparent">
            {/* Optimized Progress Bars */}
            <div className="flex gap-1.5 mb-4 px-1">
              {activeUser.stories.map((s, i) => (
                <ProgressSegment 
                  key={s.id} 
                  index={i} 
                  activeIndex={currentStoryIndex}
                  isPaused={isPaused || showComments || imgLoading}
                  duration={STORY_DURATION}
                  onComplete={handleNext}
                />
              ))}
            </div>

            {/* Profile Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-white/20 overflow-hidden bg-zinc-800 shadow-2xl transition-transform active:scale-95">
                  <img src={activeUser.image} alt={activeUser.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-black text-white tracking-wide mix-blend-difference">{activeUser.name}</span>
                  <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">{activeStory.time} ago</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl bg-black/40 backdrop-blur-xl text-white border border-white/10 active:scale-90 transition-all font-black"
              >
                <HiOutlineXMark className="text-2xl" />
              </button>
            </div>
          </div>

          {/* Optimized Interaction Regions */}
          {!showComments && (
            <div className="absolute inset-x-0 top-32 bottom-32 z-30 flex">
              <button 
                className="w-1/3 h-full cursor-pointer focus:outline-none" 
                onClick={handlePrev}
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
              />
              <button 
                className="w-2/3 h-full cursor-pointer focus:outline-none" 
                onClick={handleNext}
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
              />
            </div>
          )}

          {/* Bottom Interface: High-Performance Drawer Trigger */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pb-safe bg-gradient-to-t from-black/90 to-transparent flex items-center gap-3 z-40">
            <button 
              onClick={() => setShowComments(true)}
              className="flex-1 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full py-4 px-6 text-left active:scale-[0.98] transition-all group"
            >
              <span className="text-xs font-black text-white/50 group-hover:text-white transition-colors">Add comment...</span>
            </button>
          </div>

          {/* Comments Drawer (Hardware Optimized) */}
          <AnimatePresence>
            {showComments && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowComments(false)}
                  className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm"
                />
                
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 220 }}
                  className="absolute bottom-0 inset-x-0 z-[60] h-[65%] md:h-[55%] bg-[#050508] border-t border-white/10 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col will-change-transform"
                >
                  <div className="w-full flex justify-center py-4">
                    <div className="w-12 h-1.5 bg-white/10 rounded-full" />
                  </div>

                  <div className="px-8 pb-4 border-b border-white/5 flex justify-between items-center">
                    <h4 className="text-[12px] font-black text-white uppercase tracking-[0.2em] opacity-80">Comments</h4>
                    <span className="text-[10px] text-zinc-500 font-black">{activeComments.length} RESPONSES</span>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar scrolling-touch">
                    {activeComments.length > 0 ? (
                      activeComments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 items-start">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/5 bg-zinc-900 flex-shrink-0">
                            <img src={comment.userAvatar} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="flex flex-col gap-2 flex-1">
                            <div className="bg-zinc-900/80 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 shadow-lg">
                              <span className="block text-[10px] font-black text-indigo-400 mb-1 uppercase tracking-wider">{comment.userName}</span>
                              <p className="text-[12px] text-zinc-100 font-medium leading-relaxed">{comment.text}</p>
                            </div>
                            <span className="text-[9px] text-white/30 font-black pl-1 uppercase tracking-widest">{comment.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-48 flex flex-col items-center justify-center text-center opacity-40">
                        <HiOutlineChatBubbleLeftRight className="text-4xl mb-4 text-white" />
                        <p className="text-[11px] font-black text-white uppercase tracking-widest">No noise yet</p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 pb-safe bg-zinc-900/80 backdrop-blur-3xl border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Say something cool..." 
                        className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium"
                      />
                      <button className="bg-white text-black h-[52px] px-8 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all active:scale-95">
                        SEND
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default StoryViewer;
