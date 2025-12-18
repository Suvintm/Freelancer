/**
 * PromoBanner.jsx - Premium Promotional Carousel
 * Features:
 * - Image/Video support with auto-advance
 * - Swipe navigation (left/right)
 * - Videos play from start, muted, wait to finish before advancing
 * - Text overlay with gradient
 * - CTA button with link redirect
 * - Analytics tracking (views/clicks)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaExternalLinkAlt, FaPlay, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";

const AUTO_ADVANCE_DELAY = 5000; // 5 seconds for images

const PromoBanner = () => {
  const { backendURL } = useAppContext();
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const videoRef = useRef(null);
  const autoAdvanceTimer = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Fetch banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/banners`);
        setBanners(res.data.banners || []);
      } catch (err) {
        console.error("Failed to fetch banners:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, [backendURL]);

  // Track view when banner changes
  useEffect(() => {
    if (banners.length > 0 && banners[currentIndex]) {
      const bannerId = banners[currentIndex]._id;
      axios.post(`${backendURL}/api/banners/${bannerId}/view`).catch(() => {});
    }
  }, [currentIndex, banners, backendURL]);

  // Auto-advance logic
  const startAutoAdvance = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    
    const currentBanner = banners[currentIndex];
    if (!currentBanner || currentBanner.mediaType === "video") {
      // Don't auto-advance for videos - wait for onEnded
      return;
    }

    autoAdvanceTimer.current = setTimeout(() => {
      goToNext();
    }, AUTO_ADVANCE_DELAY);
  }, [currentIndex, banners]);

  useEffect(() => {
    if (!isHovered && banners.length > 1) {
      startAutoAdvance();
    }
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, [currentIndex, isHovered, banners.length, startAutoAdvance]);

  // Handle video events
  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
    goToNext();
  };

  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
  };

  // Navigation functions
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToIndex = (index) => {
    setCurrentIndex(index);
  };

  // Touch/swipe handling
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        goToNext(); // Swipe left → next
      } else {
        goToPrev(); // Swipe right → prev
      }
    }
  };

  // Reset video when changing slides
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  // Handle banner click
  const handleBannerClick = (banner) => {
    if (banner.link) {
      // Track click
      axios.post(`${backendURL}/api/banners/${banner._id}/click`).catch(() => {});
      
      // Open link
      window.open(banner.link, banner.linkTarget || "_blank");
    }
  };

  // Toggle mute
  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  if (loading) {
    return (
      <div className="relative w-full h-[350px] md:h-[450px] rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="relative w-full h-[350px] md:h-[450px] rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <FaPlay className="text-4xl text-emerald-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Promotions</h3>
          <p className="text-gray-400 text-sm">Check back later for exciting offers!</p>
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <div
      className="relative w-full h-[350px] md:h-[450px] rounded-2xl overflow-hidden group cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => handleBannerClick(currentBanner)}
    >
      {/* Background Media */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {currentBanner.mediaType === "video" ? (
            <video
              ref={videoRef}
              src={currentBanner.mediaUrl}
              poster={currentBanner.thumbnailUrl}
              autoPlay
              muted={isMuted}
              playsInline
              onEnded={handleVideoEnded}
              onPlay={handleVideoPlay}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={currentBanner.mediaUrl}
              alt={currentBanner.title}
              className="w-full h-full object-cover"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-lg"
        >
          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
            {currentBanner.title}
          </h2>

          {/* Description */}
          {currentBanner.description && (
            <p className="text-sm md:text-base text-gray-200 mb-4 line-clamp-2 drop-shadow">
              {currentBanner.description}
            </p>
          )}

          {/* CTA Button */}
          {currentBanner.link && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleBannerClick(currentBanner);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/30"
            >
              {currentBanner.linkText || "Learn More"}
              <FaExternalLinkAlt className="text-xs" />
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
          >
            <FaChevronLeft />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
          >
            <FaChevronRight />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToIndex(index);
              }}
              className={`transition-all ${
                index === currentIndex
                  ? "w-6 h-2 bg-emerald-500 rounded-full"
                  : "w-2 h-2 bg-white/50 hover:bg-white/80 rounded-full"
              }`}
            />
          ))}
        </div>
      )}

      {/* Video Controls */}
      {currentBanner.mediaType === "video" && (
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
        >
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
      )}

      {/* Video Playing Indicator */}
      {currentBanner.mediaType === "video" && isVideoPlaying && (
        <div className="absolute top-4 left-4 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1.5">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}
    </div>
  );
};

export default PromoBanner;
