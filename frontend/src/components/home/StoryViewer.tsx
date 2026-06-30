import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { Story } from '../../data/storyData';

interface StoryViewerProps {
  stories: Story[];
  activeStoryId: string;
  onClose: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  activeStoryId,
  onClose,
}) => {
  const navigate = useNavigate();
  
  // Find initial user index
  const initialUserIndex = stories.findIndex((s) => s._id === activeStoryId);
  const [currentUserIndex, setCurrentUserIndex] = useState(
    initialUserIndex !== -1 ? initialUserIndex : 0
  );
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default muted for safety & autoplay
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const activeUser = stories[currentUserIndex];
  const activeSlide = activeUser?.slides[currentSlideIndex];
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const pointerDownTimeRef = useRef<number>(0);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync URL with active user index
  useEffect(() => {
    if (activeUser && activeUser._id !== activeStoryId) {
      navigate(`/stories/${activeUser._id}`, { replace: true });
    }
  }, [currentUserIndex, activeUser, activeStoryId, navigate]);

  // Navigate between users
  const handleNextUser = () => {
    if (currentUserIndex < stories.length - 1) {
      setCurrentUserIndex((prev) => prev + 1);
      setCurrentSlideIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevUser = () => {
    if (currentUserIndex > 0) {
      setCurrentUserIndex((prev) => prev - 1);
      setCurrentSlideIndex(0);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  // Navigate between slides
  const handleNextSlide = () => {
    if (currentSlideIndex < activeUser.slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      handleNextUser();
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
      setProgress(0);
    } else {
      handlePrevUser();
    }
  };

  // Reset states on slide or user change
  useEffect(() => {
    setProgress(0);
    setIsVideoLoading(activeSlide?.type === 'video');
  }, [currentUserIndex, currentSlideIndex, activeSlide]);

  // Image progress timer
  useEffect(() => {
    if (!activeSlide || activeSlide.type !== 'image' || isPaused) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    const duration = activeSlide.durationMs || 5000;
    const intervalTime = 50; // Update every 50ms
    const step = (intervalTime / duration) * 100;

    progressIntervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current!);
          progressIntervalRef.current = null;
          handleNextSlide();
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [activeSlide, isPaused, currentUserIndex, currentSlideIndex]);

  // Video progress and play state sync
  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeSlide?.type !== 'video') return;

    if (isPaused) {
      video.pause();
    } else {
      video.play().catch((err) => {
        console.warn('Autoplay blocked or playback interrupted:', err);
      });
    }
  }, [isPaused, activeSlide, currentUserIndex, currentSlideIndex]);

  // Handle Video Time Updates
  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration) {
      const pct = (video.currentTime / video.duration) * 100;
      setProgress(pct);
    }
  };

  // Keyboard navigation controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNextUser();
      } else if (e.key === 'ArrowLeft') {
        handlePrevUser();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUserIndex]);

  // Pointer press actions (tap vs hold)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownTimeRef.current = Date.now();
    holdTimeoutRef.current = setTimeout(() => {
      setIsPaused(true);
    }, 200); // Hold triggers after 200ms
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    const pressDuration = Date.now() - pointerDownTimeRef.current;
    if (pressDuration < 200) {
      // Tap detected -> check left/right side tap
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;

      if (x < width * 0.3) {
        handlePrevSlide();
      } else {
        handleNextSlide();
      }
    }

    setIsPaused(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md select-none touch-none">
      
      {/* Back to Home click backdrop (Desktop only) */}
      <div className="absolute inset-0 hidden lg:block cursor-pointer" onClick={onClose} />

      {/* Desktop Chevron Left (User skip) */}
      {currentUserIndex > 0 && (
        <button
          onClick={handlePrevUser}
          className="absolute left-8 hidden lg:flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all border border-white/15 active:scale-95 z-55"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Desktop Chevron Right (User skip) */}
      {currentUserIndex < stories.length - 1 && (
        <button
          onClick={handleNextUser}
          className="absolute right-8 hidden lg:flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all border border-white/15 active:scale-95 z-55"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Main Story Container */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={(e, info) => {
          const swipeThreshold = 60;
          if (info.offset.x < -swipeThreshold) {
            handleNextUser(); // Swipe left -> Next user
          } else if (info.offset.x > swipeThreshold) {
            handlePrevUser(); // Swipe right -> Previous user
          }
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative w-full h-full lg:h-[90vh] lg:max-h-[820px] lg:max-w-[460px] lg:aspect-[9/16] lg:rounded-2xl lg:border lg:border-white/10 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col justify-between"
      >
        {/* Progress Bar Segment Indicator */}
        <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 px-3 pt-3">
          {activeUser.slides.map((slide, idx) => {
            let fillWidth = '0%';
            if (idx < currentSlideIndex) fillWidth = '100%';
            else if (idx === currentSlideIndex) fillWidth = `${progress}%`;

            return (
              <div
                key={slide.id}
                className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white rounded-full transition-all duration-75 ease-linear"
                  style={{ width: fillWidth }}
                />
              </div>
            );
          })}
        </div>

        {/* Story Header (Avatar, name, date, options) */}
        <div className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 pt-6 pb-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-200 ${isPaused ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex items-center gap-2">
            <img
              src={activeUser.avatar}
              alt={activeUser.username}
              className="w-8 h-8 rounded-full border border-white/20 object-cover"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-white text-xs font-semibold drop-shadow-md">
                {activeUser.username}
              </span>
              {activeUser.verifiedColor && (
                <span
                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-inner"
                  style={{ backgroundColor: activeUser.verifiedColor }}
                >
                  ✓
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Toggle (Only for video slide) */}
            {activeSlide?.type === 'video' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted((m) => !m);
                }}
                className="text-white hover:text-zinc-200 cursor-pointer drop-shadow-md p-1 active:scale-95"
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-white hover:text-zinc-200 cursor-pointer drop-shadow-md p-1 active:scale-95"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Media Content Display */}
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="flex-1 w-full h-full flex items-center justify-center relative bg-black cursor-pointer"
        >
          {activeSlide?.type === 'image' ? (
            <img
              src={activeSlide.url}
              alt={activeSlide.caption || 'Story content'}
              className="w-full h-full object-contain select-none pointer-events-none"
            />
          ) : activeSlide?.type === 'video' ? (
            <div className="w-full h-full relative bg-black">
              <video
                ref={videoRef}
                src={activeSlide.url}
                className="w-full h-full object-contain bg-black select-none"
                playsInline
                autoPlay
                muted={isMuted}
                onTimeUpdate={handleVideoTimeUpdate}
                onCanPlay={() => setIsVideoLoading(false)}
                onPlaying={() => setIsVideoLoading(false)}
                onWaiting={() => setIsVideoLoading(true)}
                onEnded={handleNextSlide}
              />
            </div>
          ) : null}

          {/* Video Loading Spinner Overlay */}
          {isVideoLoading && (
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin opacity-80" />
            </div>
          )}

          {/* Pause State Visual Overlay (Subtle) */}
          {isPaused && (
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none" />
          )}
        </div>

        {/* Story Footer Caption Overlay */}
        {activeSlide?.caption && (
          <div className={`absolute bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-10 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-200 ${isPaused ? 'opacity-0' : 'opacity-100'}`}>
            <p className="text-white text-xs md:text-sm text-center font-medium leading-relaxed drop-shadow-md select-text">
              {activeSlide.caption}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
