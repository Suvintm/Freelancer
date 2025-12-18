/**
 * PromoBanner.jsx - Premium Promotional Carousel
 * Features:
 * - Real-time WebSocket updates
 * - Image/Video with looping video support
 * - Swipe/Touch navigation
 * - Professional design with badges, gradients, animations
 * - Progress bar for auto-advance
 * - Analytics tracking
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChevronLeft,
  FaChevronRight,
  FaExternalLinkAlt,
  FaPlay,
  FaVolumeUp,
  FaVolumeMute,
  FaFire,
  FaStar,
  FaBolt,
  FaClock,
  FaGem,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import axios from "axios";
import { useAppContext } from "../context/AppContext";

const AUTO_ADVANCE_DELAY = 1500; // 1.5 seconds for images

// Badge configurations with icons
const BADGE_CONFIG = {
  new: { label: "NEW", icon: HiSparkles, bgClass: "bg-gradient-to-r from-emerald-500 to-teal-500" },
  hot: { label: "HOT", icon: FaFire, bgClass: "bg-gradient-to-r from-orange-500 to-red-500" },
  sale: { label: "SALE", icon: FaBolt, bgClass: "bg-gradient-to-r from-pink-500 to-rose-500" },
  limited: { label: "LIMITED", icon: FaClock, bgClass: "bg-gradient-to-r from-purple-500 to-indigo-500" },
  featured: { label: "FEATURED", icon: FaGem, bgClass: "bg-gradient-to-r from-amber-500 to-yellow-500" },
};

const PromoBanner = () => {
  const { backendURL, socket } = useAppContext();
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef(null);
  const autoAdvanceTimer = useRef(null);
  const progressInterval = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Fetch banners from API
  const fetchBanners = useCallback(async () => {
    try {
      const res = await axios.get(`${backendURL}/api/banners`);
      setBanners(res.data.banners || []);
    } catch (err) {
      console.error("Failed to fetch banners:", err);
    } finally {
      setLoading(false);
    }
  }, [backendURL]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Real-time WebSocket listener for banner updates
  useEffect(() => {
    if (socket) {
      const handleBannerRefresh = () => {
        console.log("Banner refresh event received");
        fetchBanners();
      };
      socket.on("banner:refresh", handleBannerRefresh);
      return () => socket.off("banner:refresh", handleBannerRefresh);
    }
  }, [socket, fetchBanners]);

  // Track view when banner changes
  useEffect(() => {
    if (banners.length > 0 && banners[currentIndex]) {
      const bannerId = banners[currentIndex]._id;
      axios.post(`${backendURL}/api/banners/${bannerId}/view`).catch(() => {});
    }
  }, [currentIndex, banners, backendURL]);

  // Navigation functions
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setProgress(0);
  }, [banners.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setProgress(0);
  }, [banners.length]);

  const goToIndex = (index) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  // Auto-advance logic with progress bar (only for images)
  useEffect(() => {
    if (banners.length <= 1 || isHovered) {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      return;
    }

    const currentBanner = banners[currentIndex];
    
    // For videos, don't auto-advance - wait for video to end
    if (currentBanner?.mediaType === "video") {
      setProgress(0);
      if (progressInterval.current) clearInterval(progressInterval.current);
      return;
    }

    // Use per-banner display duration, fallback to default
    const displayDuration = currentBanner?.autoAdvanceDelay || AUTO_ADVANCE_DELAY;
    
    // Progress bar animation
    const progressStep = 100 / (displayDuration / 50);
    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + progressStep;
      });
    }, 50);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, [currentIndex, isHovered, banners, goToNext]);

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
        goToNext();
      } else {
        goToPrev();
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
      axios.post(`${backendURL}/api/banners/${banner._id}/click`).catch(() => {});
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

  // Render badge
  const renderBadge = (badge) => {
    if (!badge || badge === "none") return null;
    const config = BADGE_CONFIG[badge];
    if (!config) return null;
    const Icon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`absolute top-4 left-4 ${config.bgClass} px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white text-xs font-bold shadow-lg z-20`}
      >
        <Icon className="text-sm" />
        {config.label}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="relative w-full h-[350px] md:h-[450px] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
            />
          </div>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="relative w-full h-[350px] md:h-[450px] rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-800">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FaPlay className="text-5xl text-emerald-500 mb-4" />
          </motion.div>
          <h3 className="text-xl font-bold text-white mb-2">No Promotions</h3>
          <p className="text-gray-400 text-sm">Check back later for exciting offers!</p>
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];
  const gradientFrom = currentBanner.gradientFrom || "#6366f1";
  const gradientTo = currentBanner.gradientTo || "#8b5cf6";

  return (
    <div
      className="relative w-full h-[350px] md:h-[450px] rounded-2xl overflow-hidden group cursor-pointer select-none shadow-2xl"
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
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {currentBanner.mediaType === "video" ? (
            <video
              ref={videoRef}
              src={currentBanner.mediaUrl}
              poster={currentBanner.thumbnailUrl}
              autoPlay
              loop={false}
              muted={isMuted}
              playsInline
              onEnded={goToNext}
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

      {/* Dynamic Gradient Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to top, ${gradientFrom}ee, ${gradientTo}66 50%, transparent 80%)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Badge */}
      {renderBadge(currentBanner.badge)}

      {/* Content Overlay */}
      <div className={`absolute inset-0 flex flex-col justify-end p-6 md:p-8 ${
        currentBanner.textPosition === "center" ? "items-center text-center" :
        currentBanner.textPosition === "right" ? "items-end text-right" : "items-start text-left"
      }`}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-lg"
        >
          {/* Title with animated underline */}
          <div className="relative inline-block mb-2">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow-lg">
              {currentBanner.title}
            </h2>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="absolute -bottom-1 left-0 h-1 w-full rounded-full"
              style={{ background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` }}
            />
          </div>

          {/* Description */}
          {currentBanner.description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm md:text-base text-gray-100 mb-5 line-clamp-2 drop-shadow"
            >
              {currentBanner.description}
            </motion.p>
          )}

          {/* CTA Button with shine effect */}
          {currentBanner.link && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleBannerClick(currentBanner);
              }}
              className="relative inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-bold rounded-xl transition-all shadow-xl overflow-hidden group/btn"
            >
              {/* Shine effect */}
              <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <span className="relative">{currentBanner.linkText || "Learn More"}</span>
              <FaExternalLinkAlt className="text-xs relative" />
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Progress Bar (for images only) */}
      {banners.length > 1 && currentBanner.mediaType !== "video" && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <motion.div
            className="h-full rounded-r-full"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
            }}
          />
        </div>
      )}

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isHovered ? 1 : 0, x: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all"
          >
            <FaChevronLeft />
          </motion.button>
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, x: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all"
          >
            <FaChevronRight />
          </motion.button>
        </>
      )}

      {/* Dot Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToIndex(index);
              }}
              className={`transition-all rounded-full ${
                index === currentIndex
                  ? "w-8 h-2.5 bg-white shadow-lg"
                  : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}

      {/* Video Controls */}
      {currentBanner.mediaType === "video" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          onClick={toggleMute}
          className="absolute top-4 right-4 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm border border-white/20 transition-all z-20"
        >
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </motion.button>
      )}

      {/* Video Indicator */}
      {currentBanner.mediaType === "video" && (
        <div className="absolute top-4 right-16 px-3 py-1.5 bg-red-500/90 text-white text-xs font-bold rounded-full flex items-center gap-1.5 z-20">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          VIDEO
        </div>
      )}
    </div>
  );
};

export default PromoBanner;
