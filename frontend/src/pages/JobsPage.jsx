/**
 * JobsPage - Browse all job listings
 * Professional Zepto-style design with live banner images
 * Hero Carousel, Stats, Browse by Specialty with images
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineBriefcase,
  HiOutlineMapPin,
  HiChevronRight,
  HiArrowLeft,
  HiUsers,
  HiDocumentText,
  HiStar,
  HiCheckBadge,
  HiMagnifyingGlass,
  HiFire,
  HiSparkles,
  HiBolt,
  HiCurrencyRupee,
} from "react-icons/hi2";
import { FaMapMarkerAlt, FaClock, FaRupeeSign, FaPlay, FaCamera, FaFilm, FaPalette, FaVideo, FaMusic, FaArrowRight } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";

// Categories for pills
const CATEGORY_PILLS = [
  { value: "all", label: "All", icon: "✨" },
  { value: "Wedding", label: "Wedding", icon: "💒" },
  { value: "Reels", label: "Reels", icon: "▶️" },
  { value: "YouTube", label: "YouTube", icon: "📺" },
  { value: "Corporate", label: "Corporate", icon: "🏢" },
  { value: "Music Video", label: "Music", icon: "🎵" },
];

// Hero slides with real images
const HERO_SLIDES = [
  {
    badge: "🔥 HOT OPPORTUNITIES",
    title: "Find Your Dream Project",
    subtitle: "Connect with 100+ clients actively hiring video editors",
    image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80",
  },
  {
    badge: "💰 HIGH PAYING",
    title: "Premium Projects Await",
    subtitle: "Earn ₹50K+ on wedding and corporate video projects",
    image: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&q=80",
  },
  {
    badge: "🚀 REMOTE WORK",
    title: "Work From Anywhere",
    subtitle: "70% of jobs are fully remote - edit from your comfort zone",
    image: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&q=80",
  },
  {
    badge: "⭐ TOP RATED",
    title: "Join Elite Editors",
    subtitle: "Be part of a community with 4.8★ average client rating",
    image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&q=80",
  },
  {
    badge: "🎬 CREATIVE FREEDOM",
    title: "Express Your Vision",
    subtitle: "Work on exciting projects from weddings to commercials",
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80",
  },
];

// Browse by Specialty cards with images
const SPECIALTY_CARDS = [
  { 
    id: "youtube", 
    label: "YouTube", 
    icon: FaPlay, 
    color: "from-red-500 to-red-600",
    image: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&q=80",
    jobs: "120+"
  },
  { 
    id: "wedding", 
    label: "Wedding", 
    icon: FaCamera, 
    color: "from-pink-500 to-rose-500",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80",
    jobs: "85+"
  },
  { 
    id: "reels", 
    label: "Reels", 
    icon: FaFilm, 
    color: "from-purple-500 to-violet-500",
    image: "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=400&q=80",
    jobs: "200+"
  },
  { 
    id: "color", 
    label: "Color Grading", 
    icon: FaPalette, 
    color: "from-amber-500 to-orange-500",
    image: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=400&q=80",
    jobs: "45+"
  },
  { 
    id: "music", 
    label: "Music Video", 
    icon: FaMusic, 
    color: "from-cyan-500 to-blue-500",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80",
    jobs: "60+"
  },
  { 
    id: "corporate", 
    label: "Corporate", 
    icon: FaVideo, 
    color: "from-emerald-500 to-green-500",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80",
    jobs: "90+"
  },
];

// Featured Companies
const FEATURED_COMPANIES = [
  { name: "YouTube", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1024px-YouTube_full-color_icon_%282017%29.svg.png" },
  { name: "Netflix", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/1920px-Netflix_2015_logo.svg.png" },
  { name: "Adobe", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Adobe_Corporate_Logo.svg/1024px-Adobe_Corporate_Logo.svg.png" },
  { name: "Sony", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/1920px-Sony_logo.svg.png" },
];

const JobsPage = () => {
  const navigate = useNavigate();
  const { backendURL, user } = useAppContext();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [stats, setStats] = useState({ jobs: 0, avgBudget: 0, successRate: 98 });
  const [heroBanners, setHeroBanners] = useState(HERO_SLIDES); // Use API banners or fallback to defaults

  const isEditor = user?.role === "editor";
  const slideInterval = useRef(null);

  // Banner settings state (must be declared before useEffect that uses it)
  const [bannerSettings, setBannerSettings] = useState(null);

  // Auto-slide hero
  useEffect(() => {
    slideInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
    }, bannerSettings?.autoAdvanceDelay || 4000);
    return () => clearInterval(slideInterval.current);
  }, [heroBanners.length, bannerSettings?.autoAdvanceDelay]);

  // Fetch banners from Internal Banners API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/internal-banners/jobs`);
        if (res.data.banner && res.data.banner.slides?.length > 0) {
          // Map API slides to our format
          const apiSlides = res.data.banner.slides.map((s) => ({
            badge: s.badge || "",
            title: s.title,
            subtitle: s.subtitle || "",
            image: s.mediaUrl,
            mediaType: s.mediaType,
            link: s.link,
          }));
          setHeroBanners(apiSlides);
          setBannerSettings(res.data.banner.settings);
        }
      } catch (err) {
        console.log("Using default banners");
      }
    };
    fetchBanners();
  }, [backendURL]);

  useEffect(() => {
    fetchJobs();
  }, [selectedCategory]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);

      const res = await axios.get(`${backendURL}/api/jobs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setJobs(res.data.jobs || []);
      setStats(prev => ({ ...prev, jobs: res.data.jobs?.length || 0 }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysAgo = (date) => {
    const days = Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  const getDeadlineText = (deadline) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline) - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return "Expired";
    if (days === 0) return "Last day";
    return `${days}d left`;
  };

  // Filter jobs by search
  const filteredJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Shimmer skeleton
  const ShimmerCard = () => (
    <div className={`${isDark ? 'bg-zinc-900/60 border-white/[0.06]' : 'bg-white border-slate-200'} border rounded-2xl p-4 animate-pulse`}>
      <div className={`h-5 w-3/4 ${isDark ? 'bg-zinc-800' : 'bg-slate-200'} rounded mb-3`} />
      <div className={`h-3 w-1/2 ${isDark ? 'bg-zinc-800' : 'bg-slate-200'} rounded mb-2`} />
      <div className={`h-3 w-2/3 ${isDark ? 'bg-zinc-800' : 'bg-slate-200'} rounded`} />
    </div>
  );

  const SidebarComponent = isEditor ? Sidebar : ClientSidebar;
  const NavbarComponent = isEditor ? EditorNavbar : ClientNavbar;

  return (
    <div 
      className={`min-h-screen flex flex-col md:flex-row ${isDark ? 'bg-[#09090B] text-white' : 'bg-[#FAFAFA] text-zinc-900'}`}
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <SidebarComponent isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <NavbarComponent onMenuClick={() => setSidebarOpen(true)} />
      
      <main className="flex-1 px-4 md:px-6 py-6 pt-20 md:pt-6 md:ml-64 md:mt-20 pb-28">
        
        {/* Header with Post Job button */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500/20 to-purple-500/10 rounded-xl flex items-center justify-center">
              <HiOutlineBriefcase className="text-violet-400 text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Jobs
              </h1>
              <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                Find your next project
              </p>
            </div>
          </div>
          {user?.role === "client" && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/post-job")}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-semibold rounded-full shadow-lg shadow-violet-500/25"
            >
              <HiSparkles className="text-sm" />
              Post Job
            </motion.button>
          )}
        </div>

        {/* Hero Banner Carousel with Images */}
        <div 
          className={`relative mb-5 overflow-hidden ${
            bannerSettings?.borderRadius === "none" ? "rounded-none" :
            bannerSettings?.borderRadius === "sm" ? "rounded-sm" :
            bannerSettings?.borderRadius === "md" ? "rounded-md" :
            bannerSettings?.borderRadius === "lg" ? "rounded-lg" :
            bannerSettings?.borderRadius === "xl" ? "rounded-xl" : "rounded-2xl"
          }`}
          style={{ height: `${bannerSettings?.bannerHeight || 180}px` }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              {/* Background Media */}
              {heroBanners[currentSlide]?.mediaType === "video" ? (
                <video 
                  src={heroBanners[currentSlide]?.image} 
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                />
              ) : (
                <img 
                  src={heroBanners[currentSlide]?.image} 
                  alt={heroBanners[currentSlide]?.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              {/* Dynamic Overlay from Settings */}
              {bannerSettings?.overlayType !== "none" && (
                <div 
                  className="absolute inset-0"
                  style={{
                    background: bannerSettings?.overlayType === "gradient"
                      ? `linear-gradient(${(bannerSettings?.gradientDirection || "to-right").replace("to-", "to ")}, ${bannerSettings?.gradientFrom || '#000'}${Math.round((bannerSettings?.overlayOpacity || 70) * 2.55).toString(16).padStart(2, "0")}, ${bannerSettings?.gradientTo || '#000'}80, transparent)`
                      : `rgba(0,0,0,${(bannerSettings?.overlayOpacity || 70) / 100})`
                  }}
                />
              )}
              {!bannerSettings && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
              )}
              
              <div 
                className={`relative h-full p-5 flex flex-col justify-center ${
                  bannerSettings?.textPosition === "center" ? "items-center text-center" :
                  bannerSettings?.textPosition === "right" ? "items-end text-right" : ""
                }`}
                style={{ fontFamily: bannerSettings?.fontFamily || "'Plus Jakarta Sans', sans-serif" }}
              >
                {(bannerSettings?.showBadge !== false) && heroBanners[currentSlide]?.badge && (
                  <span 
                    className="inline-flex items-center gap-1 px-2 py-0.5 mb-2 backdrop-blur-sm rounded-full text-[9px] font-bold w-fit"
                    style={{
                      backgroundColor: (bannerSettings?.badgeBgColor || "#8b5cf6") + "cc",
                      color: bannerSettings?.badgeTextColor || "#ffffff",
                    }}
                  >
                    {heroBanners[currentSlide].badge}
                  </span>
                )}
                <h2 
                  className={`font-bold mb-1 ${
                    bannerSettings?.titleSize === "sm" ? "text-sm" :
                    bannerSettings?.titleSize === "md" ? "text-base" :
                    bannerSettings?.titleSize === "lg" ? "text-lg" :
                    bannerSettings?.titleSize === "2xl" ? "text-2xl" : "text-xl"
                  }`}
                  style={{ 
                    color: bannerSettings?.textColor || "#ffffff",
                    textShadow: bannerSettings?.textShadow !== false ? "0 2px 4px rgba(0,0,0,0.5)" : "none",
                  }}
                >
                  {heroBanners[currentSlide]?.title}
                </h2>
                <p 
                  className={`max-w-[70%] ${
                    bannerSettings?.subtitleSize === "xs" ? "text-xs" :
                    bannerSettings?.subtitleSize === "sm" ? "text-sm" :
                    bannerSettings?.subtitleSize === "md" ? "text-base" : "text-xs"
                  }`}
                  style={{ color: (bannerSettings?.textColor || "#ffffff") + "cc" }}
                >
                  {heroBanners[currentSlide]?.subtitle}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Pagination Dots */}
          {(bannerSettings?.showDots !== false) && heroBanners.length > 1 && (
            <div className="absolute bottom-3 right-4 flex gap-1.5">
              {heroBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentSlide ? "bg-white w-4" : "bg-white/40 w-1.5"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className={`grid grid-cols-4 gap-2 mb-5 p-3 rounded-xl ${isDark ? 'bg-[#0d0d12] border border-white/[0.06]' : 'bg-white border border-slate-200 shadow-sm'}`}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <HiUsers className="text-violet-400 text-sm" />
              <span className="text-sm font-bold">{stats.jobs || 50}+</span>
            </div>
            <p className={`text-[9px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Active Jobs</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <HiCurrencyRupee className="text-emerald-400 text-sm" />
              <span className="text-sm font-bold">₹15K+</span>
            </div>
            <p className={`text-[9px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Avg Budget</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <HiStar className="text-amber-400 text-sm" />
              <span className="text-sm font-bold">4.8</span>
            </div>
            <p className={`text-[9px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Rating</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <HiCheckBadge className="text-emerald-400 text-sm" />
              <span className="text-sm font-bold">{stats.successRate}%</span>
            </div>
            <p className={`text-[9px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Success</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <HiMagnifyingGlass className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search jobs, skills, companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${isDark ? 'bg-[#0d0d12] border-white/[0.06]' : 'bg-white border-slate-200'} border rounded-full pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all`}
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {CATEGORY_PILLS.map((cat) => (
            <motion.button
              key={cat.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.value
                  ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25"
                  : isDark 
                    ? "bg-[#0d0d12] border border-white/[0.06] text-zinc-400 hover:text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </motion.button>
          ))}
        </div>

        {/* Browse by Specialty - Image Cards */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HiSparkles className="text-violet-400" />
              <h3 className="text-sm font-bold">Browse by Specialty</h3>
            </div>
            <button className={`text-[10px] ${isDark ? 'text-violet-400' : 'text-violet-500'} font-medium flex items-center gap-0.5`}>
              View All <FaArrowRight className="text-[8px]" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {SPECIALTY_CARDS.slice(0, 6).map((card) => (
              <motion.button
                key={card.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(card.id === "color" ? "Color Grading" : card.label)}
                className="relative overflow-hidden rounded-xl aspect-square group"
              >
                {/* Background Image */}
                <img 
                  src={card.image} 
                  alt={card.label}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${card.color} opacity-70`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-end p-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-1">
                    <card.icon className="text-white text-sm" />
                  </div>
                  <p className="text-white text-[10px] font-bold">{card.label}</p>
                  <p className="text-white/70 text-[8px]">{card.jobs} jobs</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Trending Skills */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <HiFire className="text-orange-400" />
            <h3 className="text-sm font-bold">Trending Skills</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["After Effects", "Premiere Pro", "DaVinci Resolve", "Motion Graphics", "VFX", "Color Grading", "Sound Design"].map((skill) => (
              <span
                key={skill}
                className={`px-3 py-1.5 rounded-full text-[10px] font-medium ${
                  isDark 
                    ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-400 border border-violet-500/20' 
                    : 'bg-violet-50 text-violet-600 border border-violet-200'
                }`}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Quick Apply Banner */}
        <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <HiBolt className="text-emerald-400 text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Quick Apply</h3>
                <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Complete your profile for one-click applications</p>
              </div>
            </div>
            <HiChevronRight className={`text-lg ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-violet-400">🔥</span>
            <h3 className="text-sm font-bold">Latest Jobs</h3>
          </div>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
            {filteredJobs.length} results
          </span>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <ShimmerCard key={i} />)}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 flex items-center justify-center">
              <HiOutlineBriefcase className="text-2xl text-violet-400" />
            </div>
            <h3 className="text-sm font-bold mb-1">No jobs found</h3>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Try adjusting your filters or check back later
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  onClick={() => navigate(`/jobs/${job._id}`)}
                  className={`relative overflow-hidden ${isDark ? 'bg-[#0d0d12] border-white/[0.06]' : 'bg-white border-slate-200'} border rounded-2xl p-4 cursor-pointer hover:border-violet-500/30 transition-all group`}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-purple-500/0 group-hover:from-violet-500/5 group-hover:to-purple-500/5 transition-all duration-300" />
                  
                  <div className="relative">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate group-hover:text-violet-400 transition-colors">
                          {job.title}
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                          {job.company || job.client?.name || "Anonymous"}
                        </p>
                      </div>
                      <span className={`text-[9px] px-2 py-1 rounded-full font-medium ${
                        job.workType === "remote" 
                          ? "bg-emerald-500/20 text-emerald-400"
                          : job.workType === "onsite"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {job.workType || "Remote"}
                      </span>
                    </div>
                    
                    {/* Info Row */}
                    <div className="flex flex-wrap items-center gap-3 mb-3 text-[10px]">
                      {job.budget && (
                        <span className="flex items-center gap-1 text-violet-400 font-medium">
                          <FaRupeeSign className="text-[8px]" />
                          {job.budget.min?.toLocaleString()} - {job.budget.max?.toLocaleString()}
                        </span>
                      )}
                      {job.location?.city && (
                        <span className={`flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                          <FaMapMarkerAlt className="text-[8px]" />
                          {job.location.city}
                        </span>
                      )}
                      <span className={`flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                        <FaClock className="text-[8px]" />
                        {getDaysAgo(job.createdAt)}
                      </span>
                    </div>
                    
                    {/* Footer Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                          {job.category || "General"}
                        </span>
                        {getDeadlineText(job.deadline) && (
                          <span className="text-[9px] text-orange-400">
                            {getDeadlineText(job.deadline)}
                          </span>
                        )}
                      </div>
                      <HiChevronRight className={`text-sm ${isDark ? 'text-zinc-600' : 'text-slate-400'} group-hover:text-violet-400 transition-colors`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default JobsPage;
