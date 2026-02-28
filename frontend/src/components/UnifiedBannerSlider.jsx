import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    HiChevronLeft, 
    HiChevronRight, 
    HiSparkles,
    HiOutlineBriefcase,
    HiOutlineUserGroup,
    HiBolt,
    HiOutlineVideoCamera,
    HiArrowRight,
    HiSpeakerWave,
    HiSpeakerXMark,
    HiOutlineSparkles
} from "react-icons/hi2";
import { FaPlay, FaAd, FaInstagram, FaGlobe, FaChevronRight, FaPause, FaVolumeMute, FaVolumeUp, FaChevronLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import axios from "axios";

// ✅ Repair mangled URLs from backend sanitization (dots -> underscores & slashes -> underscores)
const repairUrl = (url) => {
    if (!url || typeof url !== "string") return url;
    if (!url.includes("cloudinary") && !url.includes("res_") && !url.includes("_com")) return url;
  
    let fixed = url;
    
    // 1. Restore Protocol
    fixed = fixed.replace(/^(https?):?\/*_+/gi, "$1://");
    
    // 2. Restore Domain Dots
    fixed = fixed.replace(/_+res_+cloudinary_+com/g, "res.cloudinary.com")
                 .replace(/res_cloudinary_com/g, "res.cloudinary.com")
                 .replace(/cloudinary_com/g, "cloudinary.com");

    // 3. Fix the "Slash Mangler" in path
    if (fixed.includes("res.cloudinary.com")) {
        // Restore domain slash
        fixed = fixed.replace(/res\.cloudinary\.com_+/g, "res.cloudinary.com/");
        
        // Fix common keywords
        fixed = fixed.replace(/image_upload_+/g, "image/upload/")
                     .replace(/video_upload_+/g, "video/upload/")
                     .replace(/raw_upload_+/g, "raw/upload/");

        // Fix version slash (matches /v123_ or _v123_ or v123_)
        fixed = fixed.replace(/([\/_]?v\d+)_+/g, "$1/"); 
        
        // Fix cloud name slash (e.g. /cloudname_image/)
        fixed = fixed.replace(/(res\.cloudinary\.com\/[^\/_]+)_+(image|video|raw|authenticated)_*/g, "$1/$2/");
        
        // Fix folder slashes
        fixed = fixed.replace(/advertisements_images_+/g, "advertisements/images/")
                     .replace(/advertisements_videos_+/g, "advertisements/videos/")
                     .replace(/advertisements_gallery_+/g, "advertisements/gallery/");
        
        // Catch-all keywords
        fixed = fixed.replace(/_+(upload|image|video|v\d+)_+/g, "/$1/");

        // Restore slashes before the final filename
        fixed = fixed.replace(/_([a-z0-9]+\.(webp|jpg|jpeg|png|mp4|mov|m4v|json))/gi, "/$1");
        
        // Flatten double slashes
        fixed = fixed.replace(/([^:])\/\/+/g, "$1/");
    }

    // 4. Restore Extension Dots
    fixed = fixed.replace(/_jpg([/_?#]|$)/gi, ".jpg$1")
                 .replace(/_jpeg([/_?#]|$)/gi, ".jpeg$1")
                 .replace(/_png([/_?#]|$)/gi, ".png$1")
                 .replace(/_mp4([/_?#]|$)/gi, ".mp4$1")
                 .replace(/_webp([/_?#]|$)/gi, ".webp$1");

    if (url !== fixed) {
        console.log(`[URL REPAIR] Fixed: ${url} -> ${fixed}`);
    }

    return fixed;
};

const UnifiedBannerSlider = () => {
    const { backendURL } = useAppContext();
    const navigate = useNavigate();
    const [verticalIndex, setVerticalIndex] = useState(0);
    const [horizontalIndices, setHorizontalIndices] = useState([0, 0, 0]);
    const [dbAds, setDbAds] = useState([]);
    const [showAdsLevel, setShowAdsLevel] = useState(true);
    const [loading, setLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [mediaLoaded, setMediaLoaded] = useState(false);

    // Fetch active ads for Level 0 from DB + global toggle
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const [adsRes, settingsRes] = await Promise.all([
          axios.get(`${backendURL}/api/ads?location=home_banner`),
          axios.get(`${backendURL}/api/ads/settings`),
        ]);
        setDbAds(adsRes.data.ads || []);
        setShowAdsLevel(settingsRes.data.showSuvixAds !== false);
      } catch (err) {
        console.error("Failed to fetch ads", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, [backendURL]);

    // Build Level 0 from DB ads (only if enabled and ads exist)
  const adsLevel = showAdsLevel && dbAds.length > 0 ? {
    id: "advertisements",
    label: "Ads",
    color: "text-amber-400",
    icon: FaAd,
    items: dbAds.map(ad => ({
      _id: ad._id,
      title: ad.title,
      description: ad.description || ad.tagline || "",
      mediaUrl: ad.mediaUrl,
      mediaType: ad.mediaType,
      link: ad.websiteUrl || `/ad-details/${ad._id}`,
      linkText: ad.ctaText || "Learn More",
      badge: ad.badge || "SPONSOR",
      gradientFrom: "#f59e0b",
      isExternal: !!ad.websiteUrl,
    }))
  } : null;

    // Level Definitions — Level 0 (Ads) only appears when enabled & DB ads exist
  const baseLevels = [
        {
            id: "promotions",
            label: "Ads",
            color: "text-amber-400",
            icon: FaAd,
            items: [
                {
                    _id: "ad-001",
                    title: "Suvix Pro Editing",
                    description: "High-end cinematic editing for your brand. Get started in minutes.",
                    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                    mediaType: "video",
                    link: "https://suvix.in",
                    linkText: "Explore More",
                    badge: "featured",
                    gradientFrom: "#f59e0b"
                },
                {
                    _id: "ad-002",
                    title: "Premium Sound Packs",
                    description: "Unlock 500+ exclusive SFX and cinematic music tracks.",
                    mediaUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop",
                    mediaType: "image",
                    link: "https://suvix.in/store",
                    linkText: "Browse Store",
                    badge: "new",
                    gradientFrom: "#3b82f6"
                },
                {
                    _id: "ad-003",
                    title: "AI Color Grading",
                    description: "Professional color grading powered by advanced Suvix AI.",
                    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                    mediaType: "video",
                    link: "https://instagram.com/suvix_creative",
                    linkText: "See Results",
                    badge: "limited",
                    gradientFrom: "#10b981"
                }
            ]
        },
        {
            id: "editors",
            label: "Editors",
            color: "text-violet-400",
            icon: HiOutlineUserGroup,
            items: [
                {
                    id: "explore-editors-1",
                    title: "World-Class Talent",
                    description: "Collaborate with over 1,200+ specialized video editors globally.",
                    mediaUrl: "/hero_banner_1_1766946342128.png",
                    mediaType: "image",
                    link: "/explore-editors",
                    linkText: "Find Editor",
                    badge: "exclusive",
                    gradientFrom: "#8b5cf6",
                    gradientTo: "#6366f1"
                },
                {
                    id: "explore-editors-2",
                    title: "Verified Portfolio",
                    description: "Every editor is manually verified for quality and reliability.",
                    mediaUrl: "/hero_banner_1_1766946342128.png",
                    mediaType: "image",
                    link: "/explore-editors",
                    linkText: "Explore Now",
                    badge: "featured"
                }
            ]
        },
        {
            id: "gigs",
            label: "Services",
            color: "text-emerald-400",
            icon: HiOutlineBriefcase,
            items: [
                {
                    id: "browse-gigs-1",
                    title: "Professional Gigs",
                    description: "Starting at just ₹499. High speed delivery guaranteed.",
                    mediaUrl: "/gig_banner_1_1766948855701.png",
                    mediaType: "image",
                    link: "/explore-editors?tab=gigs",
                    linkText: "Book Now",
                    badge: "hot",
                    gradientFrom: "#10b981",
                    gradientTo: "#059669"
                }
            ]
        }
    ];

  const levels = [
    ...(adsLevel ? [adsLevel] : []),
    ...baseLevels,
  ];

  // If Ads level is hidden and we're on index 0 in a non-ads state, adjust
  useEffect(() => {
    if (!adsLevel && verticalIndex === 0 && levels.length > 0) {
      setVerticalIndex(0);
    }
  }, [adsLevel]);

    // Reset media-loaded when slide changes
    useEffect(() => { setMediaLoaded(false); }, [verticalIndex, horizontalIndices]);

    const currentLevel = levels[verticalIndex];
    const horizontalIndex = horizontalIndices[verticalIndex];
    const currentItem = currentLevel.items[horizontalIndex];

    const handleVerticalChange = (index) => {
        setVerticalIndex(index);
    };

    const handleHorizontalChange = (direction) => {
        const newIndices = [...horizontalIndices];
        const levelItems = currentLevel.items;
        if (direction === "next") {
            newIndices[verticalIndex] = (newIndices[verticalIndex] + 1) % levelItems.length;
        } else {
            newIndices[verticalIndex] = (newIndices[verticalIndex] - 1 + levelItems.length) % levelItems.length;
        }
        setHorizontalIndices(newIndices);
    };

    // Auto-advance Level 0 Ads (Cyclic)
    useEffect(() => {
        if (verticalIndex !== 0 || isHovered || currentLevel.items.length <= 1) return;
        
        // Timer for images (4s)
        if (currentItem.mediaType === "image") {
            const timeout = setTimeout(() => handleHorizontalChange("next"), 4000);
            return () => clearTimeout(timeout);
        }
    }, [verticalIndex, isHovered, currentLevel.items.length, horizontalIndex]);

    const handleVideoTimeUpdate = (e) => {
        if (verticalIndex === 0 && !isHovered && e.target.currentTime >= 4) {
            handleHorizontalChange("next");
        }
    };

    if (loading) {
        return (
            <div className="relative h-60 md:h-80 w-full rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5">
                {/* Shimmer base */}
                <div className="absolute inset-0 bg-zinc-900 animate-pulse" />
                {/* Moving shimmer wave */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
                    style={{ animation: 'shimmer 1.8s infinite', backgroundSize: '200% 100%' }}
                />
                {/* Skeleton content placeholders */}
                <div className="absolute inset-0 flex items-end p-6 md:p-8 pb-10 md:pb-12">
                    <div className="space-y-3 w-full max-w-xs">
                        <div className="h-3 w-16 bg-white/10 rounded-full animate-pulse" />
                        <div className="h-6 w-48 bg-white/10 rounded-lg animate-pulse" />
                        <div className="h-4 w-64 bg-white/8 rounded-lg animate-pulse" />
                        <div className="h-8 w-28 bg-white/10 rounded-full animate-pulse mt-2" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            className={`relative h-60 md:h-80 w-full rounded-[2rem] md:rounded-[2.5rem] overflow-hidden group shadow-2xl border border-white/5 bg-[#0d0d12] ${verticalIndex === 0 ? "cursor-pointer" : "cursor-default"}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {
        if (currentItem.link) {
          if (currentItem.link.startsWith('http')) {
            window.open(currentItem.link, '_blank');
          } else {
            navigate(currentItem.link);
          }
        }
      }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${verticalIndex}-${horizontalIndex}`}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 100, damping: 20 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, info) => {
                        if (info.offset.x > 100) handleHorizontalChange("prev");
                        else if (info.offset.x < -100) handleHorizontalChange("next");
                    }}
                    className="absolute inset-0"
                >
                    {/* Media layer */}
                    <div className="absolute inset-0">
                        {/* Skeleton shown until media loads */}
                        {!mediaLoaded && (
                            <div className="absolute inset-0 bg-zinc-900 animate-pulse z-10" />
                        )}
                        {currentItem.mediaType === "video" ? (
                            <video 
                                key={repairUrl(currentItem.mediaUrl)}
                                src={repairUrl(currentItem.mediaUrl)}
                                autoPlay
                                loop
                                muted={isMuted}
                                playsInline
                                onTimeUpdate={handleVideoTimeUpdate}
                                onLoadedData={() => setMediaLoaded(true)}
                                className={`w-full h-full object-cover transition-opacity duration-700 ${mediaLoaded ? 'opacity-100' : 'opacity-0'}`}
                            />
                        ) : (
                            <img 
                                src={repairUrl(currentItem.mediaUrl)}
                                alt=""
                                onLoad={() => setMediaLoaded(true)}
                                className={`w-full h-full object-cover transition-opacity duration-700 ${mediaLoaded ? 'opacity-100' : 'opacity-0'}`}
                            />
                        )}
                        {/* Simplified Gradient: Only Bottom to Top */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>

                    {/* Content Layer */}
                    <div className="relative h-full flex items-end p-6 md:p-8 pb-10 md:pb-12 text-left">
                        <div className="max-w-md space-y-2">
                            {/* Badges */}
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-[8px] font-bold text-white border border-white/10 flex items-center gap-1.5 uppercase tracking-widest`}>
                                    {verticalIndex === 0 && <HiOutlineVideoCamera className="text-amber-400 text-[10px]" />}
                                    {verticalIndex === 1 && <HiSparkles className="text-violet-400 text-[10px]" />}
                                    {verticalIndex === 2 && <HiBolt className="text-emerald-400 text-[10px]" />}
                                    {currentItem.badge?.toUpperCase() || currentLevel.label.toUpperCase()}
                                </span>
                                {verticalIndex === 0 && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/80 text-[7px] font-black text-white uppercase tracking-tighter">
                                        SPONSOR
                                    </span>
                                )}
                            </div>

                            {/* Title & Description */}
                            <div className="space-y-1">
                                <h2 className="text-lg md:text-2xl font-black text-white tracking-tight leading-tight">
                                    {currentItem.title}
                                </h2>
                                <p className="text-zinc-400 text-[9px] md:text-xs font-medium line-clamp-2 md:line-clamp-none leading-relaxed max-w-[85%] md:max-w-full">
                                    {currentItem.description}
                                </p>
                            </div>

                            {/* Call to Action Group */}
                            <div className="flex items-center gap-2 pt-2">
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        currentItem.link.startsWith('http') ? window.open(currentItem.link, '_blank') : navigate(currentItem.link);
                                    }}
                                    className="px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg text-[10px] font-bold transition-all shadow-xl flex items-center gap-1.5 group/btn"
                                >
                                    {currentItem.linkText}
                                    {currentItem.link.includes('instagram') ? <FaInstagram className="text-[10px]" /> : currentItem.link.startsWith('http') ? <FaGlobe className="text-[10px]" /> : <FaChevronRight className="text-[8px] group-hover/btn:translate-x-1 transition-transform" />}
                                </button>

                                {verticalIndex === 0 && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); navigate(`/ad-details/${currentItem._id || currentItem.id}`); }}
                                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-bold transition-all backdrop-blur-md border border-white/10 flex items-center gap-1.5"
                                    >
                                        View Details
                                        <HiArrowRight className="text-xs" />
                                    </button>
                                )}
                                
                                {verticalIndex === 0 && currentItem.mediaType === "video" && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all backdrop-blur-md border border-white/10"
                                    >
                                        {isMuted ? <HiSpeakerXMark className="w-3.5 h-3.5" /> : <HiSpeakerWave className="w-3.5 h-3.5" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* VERTICAL LEVEL SWITCHER (Floating Center Right) */}
            <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 md:gap-2.5 py-3 px-1 md:px-1.5 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 z-30 shadow-2xl transition-all group-hover:bg-black/60">
                {levels.map((level, idx) => (
                    <button
                        key={level.id}
                        onClick={(e) => { e.stopPropagation(); handleVerticalChange(idx); }}
                        className={`relative w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center transition-all ${
                            verticalIndex === idx ? "bg-white text-black scale-105 shadow-lg" : "text-zinc-500 hover:text-white"
                        }`}
                        title={level.label}
                    >
                        <level.icon className="text-[10px] md:text-[11px]" />
                        {verticalIndex === idx && (
                            <motion.div 
                                layoutId="vertical-glow"
                                className="absolute -inset-1 rounded-full bg-white/10 blur-md -z-10"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* HORIZONTAL CONTROLS (Bottom Right) */}
            {currentLevel.items.length > 1 && (
                <div className="absolute bottom-4 right-8 md:right-10 flex items-center gap-3 z-30">
                    <div className="flex gap-1">
                        {currentLevel.items.map((_, idx) => (
                            <button 
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newIndices = [...horizontalIndices];
                                    newIndices[verticalIndex] = idx;
                                    setHorizontalIndices(newIndices);
                                }}
                                className={`h-1 rounded-full transition-all duration-300 ${
                                    idx === horizontalIndex ? "w-6 bg-white" : "w-1 bg-white/30 hover:bg-white/50"
                                }`}
                            />
                        ))}
                    </div>
                    {/* Auto-advance Progress Bar (Level 0 only) */}
                    {verticalIndex === 0 && !isHovered && (
                        <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
                            <motion.div 
                                key={horizontalIndex}
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 4, ease: "linear" }}
                                className="h-full bg-white/60"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* LEVEL INDICATOR HINT (Bottom Left) */}
            <div className="absolute top-6 right-10 z-30 flex items-center gap-2 opacity-60">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={verticalIndex}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-2"
                    >
                        <span className={`w-1 h-1 rounded-full bg-white/60`} />
                        <span className="text-[8px] font-black text-white/60 uppercase tracking-[0.2em]">
                            LVL_0{verticalIndex + 1}
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default UnifiedBannerSlider;
