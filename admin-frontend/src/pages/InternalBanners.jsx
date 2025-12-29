/**
 * InternalBanners.jsx - Admin Internal Banner Management
 * Responsive design matching Banners.jsx style
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaImage,
  FaVideo,
  FaEye,
  FaEyeSlash,
  FaGripVertical,
  FaTimes,
  FaCloudUploadAlt,
  FaCog,
  FaPlay,
  FaPause,
  FaCalendar,
  FaSave,
  FaSync,
} from "react-icons/fa";
import { HiOutlineSparkles, HiPhoto } from "react-icons/hi2";
import { useAdmin } from "../context/AdminContext";
import { toast } from "react-toastify";
import axios from "axios";

// Section tabs config
const SECTIONS = [
  { id: "editors", label: "Editors", icon: "👤", color: "from-violet-500 to-purple-500" },
  { id: "gigs", label: "Gigs", icon: "💼", color: "from-emerald-500 to-teal-500" },
  { id: "jobs", label: "Jobs", icon: "🎯", color: "from-orange-500 to-amber-500" },
];

// Default settings
const DEFAULT_SETTINGS = {
  autoAdvanceDelay: 4000,
  animationType: "fade",
  showDots: true,
  showArrows: false,
  overlayType: "gradient",
  overlayOpacity: 70,
  gradientFrom: "#000000",
  gradientTo: "#000000",
  gradientDirection: "to-right",
  textColor: "#ffffff",
  fontFamily: "Plus Jakarta Sans",
  titleSize: "xl",
  subtitleSize: "xs",
  textShadow: true,
  textPosition: "left",
  showBadge: true,
  badgeBgColor: "#8b5cf6",
  badgeTextColor: "#ffffff",
  bannerHeight: 180,
  borderRadius: "2xl",
};

const InternalBanners = () => {
  const { adminAxios } = useAdmin();
  const [activeSection, setActiveSection] = useState("editors");
  const [banners, setBanners] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Preview state
  const [previewSlide, setPreviewSlide] = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const previewInterval = useRef(null);
  
  // Modal state
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  
  // Slide form
  const [slideForm, setSlideForm] = useState({
    mediaType: "image",
    mediaUrl: "",
    thumbnailUrl: "",
    badge: "",
    title: "",
    subtitle: "",
    link: "",
  });
  
  const [uploading, setUploading] = useState(false);

  // Current section data
  const currentBanner = banners[activeSection] || { slides: [], settings: DEFAULT_SETTINGS, isLive: false };
  const currentSlides = currentBanner.slides || [];
  const currentSettings = { ...DEFAULT_SETTINGS, ...currentBanner.settings };

  // Fetch all banners
  const fetchBanners = async () => {
    try {
      const res = await adminAxios.get("/internal-banners");
      setBanners(res.data.banners || {});
    } catch (err) {
      toast.error("Failed to fetch banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Auto-advance preview
  useEffect(() => {
    if (previewPlaying && currentSlides.length > 1) {
      previewInterval.current = setInterval(() => {
        setPreviewSlide((prev) => (prev + 1) % currentSlides.length);
      }, currentSettings.autoAdvanceDelay);
    }
    return () => clearInterval(previewInterval.current);
  }, [previewPlaying, currentSlides.length, currentSettings.autoAdvanceDelay, activeSection]);

  // Reset preview when section changes
  useEffect(() => {
    setPreviewSlide(0);
  }, [activeSection]);

  // Upload media to Cloudinary
  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error(`File too large. Max: ${isVideo ? "50MB" : "10MB"}`);
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "suvix_uploads");

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "ddxnegqjc";
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/${isVideo ? "video" : "image"}/upload`,
        formData
      );

      setSlideForm((prev) => ({
        ...prev,
        mediaType: isVideo ? "video" : "image",
        mediaUrl: res.data.secure_url,
        thumbnailUrl: isVideo ? res.data.secure_url.replace(/\.[^.]+$/, ".jpg") : "",
      }));

      toast.success("Media uploaded!");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Save slide
  const handleSaveSlide = async () => {
    if (!slideForm.title || !slideForm.mediaUrl) {
      toast.error("Title and media are required");
      return;
    }

    setSaving(true);
    try {
      if (editingSlide) {
        await adminAxios.put(`/internal-banners/${activeSection}/slides/${editingSlide._id}`, slideForm);
        toast.success("Slide updated!");
      } else {
        await adminAxios.post(`/internal-banners/${activeSection}/slides`, slideForm);
        toast.success("Slide added!");
      }

      setShowSlideModal(false);
      resetSlideForm();
      fetchBanners();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save slide");
    } finally {
      setSaving(false);
    }
  };

  // Delete slide
  const handleDeleteSlide = async (slideId) => {
    if (!confirm("Delete this slide?")) return;

    try {
      await adminAxios.delete(`/internal-banners/${activeSection}/slides/${slideId}`);
      toast.success("Slide deleted!");
      fetchBanners();
    } catch (err) {
      toast.error("Failed to delete slide");
    }
  };

  // Toggle live
  const handleToggleLive = async () => {
    try {
      await adminAxios.put(`/internal-banners/${activeSection}/live`, { isLive: !currentBanner.isLive });
      toast.success(currentBanner.isLive ? "Banner is now offline" : "Banner is now live!");
      fetchBanners();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Schedule
  const handleSchedule = async () => {
    if (!scheduleDate) {
      toast.error("Please select a date");
      return;
    }

    try {
      await adminAxios.put(`/internal-banners/${activeSection}/live`, { scheduledAt: scheduleDate });
      toast.success("Banner scheduled!");
      setShowScheduleModal(false);
      fetchBanners();
    } catch (err) {
      toast.error("Failed to schedule");
    }
  };

  // Update settings
  const handleUpdateSettings = async (newSettings) => {
    try {
      await adminAxios.put(`/internal-banners/${activeSection}/settings`, { settings: newSettings });
      fetchBanners();
    } catch (err) {
      console.error("Failed to update settings");
    }
  };

  // Reorder slides
  const handleReorder = async (newOrder) => {
    setBanners((prev) => ({
      ...prev,
      [activeSection]: { ...prev[activeSection], slides: newOrder },
    }));

    try {
      await adminAxios.put(`/internal-banners/${activeSection}/slides/reorder`, { orderedIds: newOrder.map((s) => s._id) });
    } catch (err) {
      toast.error("Failed to reorder");
      fetchBanners();
    }
  };

  // Reset form
  const resetSlideForm = () => {
    setSlideForm({
      mediaType: "image",
      mediaUrl: "",
      thumbnailUrl: "",
      badge: "",
      title: "",
      subtitle: "",
      link: "",
    });
    setEditingSlide(null);
  };

  // Open edit modal
  const openEditModal = (slide) => {
    setEditingSlide(slide);
    setSlideForm({
      mediaType: slide.mediaType,
      mediaUrl: slide.mediaUrl,
      thumbnailUrl: slide.thumbnailUrl || "",
      badge: slide.badge || "",
      title: slide.title,
      subtitle: slide.subtitle || "",
      link: slide.link || "",
    });
    setShowSlideModal(true);
  };

  // Add template
  const addTemplate = async (template) => {
    try {
      await adminAxios.post(`/internal-banners/${activeSection}/slides`, {
        mediaType: "image",
        mediaUrl: template.image,
        badge: template.badge,
        title: template.title,
        subtitle: template.subtitle,
      });
      toast.success("Template added!");
      fetchBanners();
    } catch (err) {
      toast.error("Failed to add template");
    }
  };

  // Get border radius class
  const getBorderRadius = (size) => {
    const map = { none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl", "2xl": "rounded-2xl" };
    return map[size] || "rounded-2xl";
  };

  // Get title size class
  const getTitleSize = (size) => {
    const map = { sm: "text-sm", md: "text-base", lg: "text-lg", xl: "text-xl", "2xl": "text-2xl" };
    return map[size] || "text-xl";
  };

  // Default templates
  const TEMPLATES = [
    { title: "Find Expert Editors", subtitle: "Connect with professionals", badge: "🔥 TRENDING", image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80" },
    { title: "Premium Gigs", subtitle: "Quality video editing services", badge: "⭐ TOP RATED", image: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&q=80" },
    { title: "Hot Opportunities", subtitle: "High paying projects", badge: "💰 HIGH PAYING", image: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&q=80" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HiPhoto className="text-purple-500" />
            Internal Banners
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage hero banners for Explore and Jobs pages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBanners}
            className="p-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-all"
            title="Refresh"
          >
            <FaSync className="text-gray-500" />
          </button>
          <button
            onClick={() => { resetSlideForm(); setShowSlideModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all"
          >
            <FaPlus /> Add Slide
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
              activeSection === section.id
                ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
            }`}
          >
            <span>{section.icon}</span>
            {section.label}
          </button>
        ))}
      </div>

      {/* Status & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            currentBanner.isLive ? "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400" : "bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400"
          }`}>
            <div className={`w-2 h-2 rounded-full ${currentBanner.isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            {currentBanner.isLive ? "Live" : "Draft"}
          </div>
          <span className="text-sm text-gray-500">{currentSlides.length} slides</span>
          {currentBanner.scheduledAt && (
            <span className="text-sm text-amber-500">📅 {new Date(currentBanner.scheduledAt).toLocaleDateString()}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleToggleLive}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
              currentBanner.isLive
                ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200"
                : "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-200"
            }`}
          >
            {currentBanner.isLive ? <><FaEyeSlash /> Offline</> : <><FaEye /> Go Live</>}
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium text-sm"
          >
            <FaCalendar /> Schedule
          </button>
          <button
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
              showSettingsPanel ? "bg-purple-600 text-white" : "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
            }`}
          >
            <FaCog /> Settings
          </button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <FaEye className="text-purple-500" /> Live Preview
          </h3>
          <button
            onClick={() => setPreviewPlaying(!previewPlaying)}
            className="p-1.5 text-gray-500 hover:text-purple-500 transition-all"
          >
            {previewPlaying ? <FaPause /> : <FaPlay />}
          </button>
        </div>
        <div
          className={`relative overflow-hidden ${getBorderRadius(currentSettings.borderRadius)} bg-gray-100 dark:bg-zinc-900`}
          style={{ height: `${Math.min(currentSettings.bannerHeight, 200)}px` }}
        >
          {currentSlides.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={previewSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                {currentSlides[previewSlide]?.mediaType === "video" ? (
                  <video src={currentSlides[previewSlide]?.mediaUrl} className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted />
                ) : (
                  <img src={currentSlides[previewSlide]?.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
                {currentSettings.overlayType !== "none" && (
                  <div className="absolute inset-0" style={{
                    background: currentSettings.overlayType === "gradient"
                      ? `linear-gradient(to right, ${currentSettings.gradientFrom}cc, ${currentSettings.gradientTo}80, transparent)`
                      : `rgba(0,0,0,${currentSettings.overlayOpacity / 100})`
                  }} />
                )}
                <div className={`relative h-full p-4 flex flex-col justify-center ${
                  currentSettings.textPosition === "center" ? "items-center text-center" : 
                  currentSettings.textPosition === "right" ? "items-end text-right" : ""
                }`}>
                  {currentSettings.showBadge && currentSlides[previewSlide]?.badge && (
                    <span className="inline-flex items-center px-2 py-0.5 mb-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: currentSettings.badgeBgColor + "cc", color: currentSettings.badgeTextColor }}>
                      {currentSlides[previewSlide].badge}
                    </span>
                  )}
                  <h2 className={`font-bold ${getTitleSize(currentSettings.titleSize)}`} style={{ color: currentSettings.textColor }}>
                    {currentSlides[previewSlide]?.title}
                  </h2>
                  <p className="text-xs max-w-[70%]" style={{ color: currentSettings.textColor + "cc" }}>
                    {currentSlides[previewSlide]?.subtitle}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <FaImage className="text-3xl mb-2" />
              <p className="text-sm">No slides yet</p>
            </div>
          )}
          {currentSettings.showDots && currentSlides.length > 1 && (
            <div className="absolute bottom-2 right-3 flex gap-1">
              {currentSlides.map((_, idx) => (
                <button key={idx} onClick={() => setPreviewSlide(idx)} className={`h-1 rounded-full transition-all ${idx === previewSlide ? "bg-white w-3" : "bg-white/40 w-1"}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettingsPanel && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-4 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FaCog className="text-purple-500" /> Styling Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Auto-advance */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Speed: {currentSettings.autoAdvanceDelay}ms</label>
                  <input type="range" min="2000" max="10000" step="500" value={currentSettings.autoAdvanceDelay} onChange={(e) => handleUpdateSettings({ autoAdvanceDelay: parseInt(e.target.value) })} className="w-full accent-purple-500" />
                </div>
                {/* Overlay Opacity */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Overlay: {currentSettings.overlayOpacity}%</label>
                  <input type="range" min="0" max="100" value={currentSettings.overlayOpacity} onChange={(e) => handleUpdateSettings({ overlayOpacity: parseInt(e.target.value) })} className="w-full accent-purple-500" />
                </div>
                {/* Height */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Height: {currentSettings.bannerHeight}px</label>
                  <input type="range" min="120" max="400" step="10" value={currentSettings.bannerHeight} onChange={(e) => handleUpdateSettings({ bannerHeight: parseInt(e.target.value) })} className="w-full accent-purple-500" />
                </div>
                {/* Text Position */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Text Position</label>
                  <select value={currentSettings.textPosition} onChange={(e) => handleUpdateSettings({ textPosition: e.target.value })} className="w-full bg-gray-100 dark:bg-zinc-700 border-0 rounded-lg px-3 py-2 text-sm">
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                {/* Gradient From */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Gradient Start</label>
                  <input type="color" value={currentSettings.gradientFrom} onChange={(e) => handleUpdateSettings({ gradientFrom: e.target.value })} className="w-full h-9 rounded-lg cursor-pointer" />
                </div>
                {/* Gradient To */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Gradient End</label>
                  <input type="color" value={currentSettings.gradientTo} onChange={(e) => handleUpdateSettings({ gradientTo: e.target.value })} className="w-full h-9 rounded-lg cursor-pointer" />
                </div>
                {/* Badge BG */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Badge Color</label>
                  <input type="color" value={currentSettings.badgeBgColor} onChange={(e) => handleUpdateSettings({ badgeBgColor: e.target.value })} className="w-full h-9 rounded-lg cursor-pointer" />
                </div>
                {/* Show Dots */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={currentSettings.showDots} onChange={(e) => handleUpdateSettings({ showDots: e.target.checked })} className="accent-purple-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Dots</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={currentSettings.showBadge} onChange={(e) => handleUpdateSettings({ showBadge: e.target.checked })} className="accent-purple-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Badge</span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slides List */}
      <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FaImage className="text-purple-500" /> Slides ({currentSlides.length})
          </h3>
        </div>
        {currentSlides.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FaImage className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No Slides Yet</h3>
            <p className="text-gray-500 text-sm mb-4">Add your first banner slide or use a template</p>
            <button onClick={() => setShowSlideModal(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm">
              Add Slide
            </button>
          </div>
        ) : (
          <Reorder.Group values={currentSlides} onReorder={handleReorder} className="p-2 space-y-2">
            {currentSlides.map((slide) => (
              <Reorder.Item key={slide._id} value={slide}>
                <motion.div layout className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-700/50 rounded-lg cursor-grab active:cursor-grabbing">
                  <FaGripVertical className="text-gray-400 flex-shrink-0" />
                  <div className="w-16 h-10 sm:w-20 sm:h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-zinc-600 flex-shrink-0 relative">
                    {slide.mediaType === "video" ? (
                      <>
                        <img src={slide.thumbnailUrl || slide.mediaUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30"><FaVideo className="text-white text-xs" /></div>
                      </>
                    ) : (
                      <img src={slide.mediaUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{slide.title}</h4>
                    <p className="text-xs text-gray-500 truncate">{slide.subtitle || slide.badge || "No subtitle"}</p>
                  </div>
                  <div className={`hidden sm:block px-2 py-0.5 rounded text-[10px] font-medium ${slide.isActive !== false ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                    {slide.isActive !== false ? "Active" : "Off"}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditModal(slide)} className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded transition-all"><FaEdit /></button>
                    <button onClick={() => handleDeleteSlide(slide._id)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded transition-all"><FaTrash /></button>
                  </div>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      {/* Quick Templates */}
      <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
          <HiOutlineSparkles className="text-amber-500" /> Quick Templates
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TEMPLATES.map((template, idx) => (
            <motion.div
              key={idx}
              className="relative overflow-hidden rounded-xl cursor-pointer group"
              whileHover={{ scale: 1.02 }}
              onClick={() => addTemplate(template)}
            >
              <img src={template.image} alt="" className="w-full h-20 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <span className="text-[8px] px-1.5 py-0.5 bg-purple-500/80 rounded text-white font-bold">{template.badge}</span>
                <h4 className="text-xs font-semibold text-white truncate mt-1">{template.title}</h4>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-purple-500/30 transition-all">
                <FaPlus className="text-white text-xl" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Slide Modal */}
      <AnimatePresence>
        {showSlideModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSlideModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingSlide ? "Edit Slide" : "Add Slide"}</h2>
                <button onClick={() => setShowSlideModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"><FaTimes className="text-gray-500" /></button>
              </div>
              <div className="p-4 space-y-4">
                {/* Media Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Media *</label>
                  {slideForm.mediaUrl ? (
                    <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800">
                      {slideForm.mediaType === "video" ? (
                        <video src={slideForm.mediaUrl} className="w-full h-36 object-cover" controls />
                      ) : (
                        <img src={slideForm.mediaUrl} alt="Preview" className="w-full h-36 object-cover" />
                      )}
                      <button type="button" onClick={() => setSlideForm((p) => ({ ...p, mediaUrl: "", thumbnailUrl: "" }))} className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white"><FaTimes /></button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-xl cursor-pointer hover:border-purple-500 transition-all">
                      {uploading ? (
                        <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <FaCloudUploadAlt className="text-3xl text-gray-400 mb-2" />
                          <p className="text-gray-500 text-sm">Click to upload</p>
                        </>
                      )}
                      <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} disabled={uploading} />
                    </label>
                  )}
                </div>
                {/* Badge */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Badge</label>
                  <input type="text" value={slideForm.badge} onChange={(e) => setSlideForm((p) => ({ ...p, badge: e.target.value }))} placeholder="🔥 HOT" className="w-full bg-gray-100 dark:bg-zinc-800 border-0 rounded-lg px-3 py-2.5 text-sm" />
                </div>
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input type="text" value={slideForm.title} onChange={(e) => setSlideForm((p) => ({ ...p, title: e.target.value }))} placeholder="Banner Title" className="w-full bg-gray-100 dark:bg-zinc-800 border-0 rounded-lg px-3 py-2.5 text-sm" required />
                </div>
                {/* Subtitle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subtitle</label>
                  <input type="text" value={slideForm.subtitle} onChange={(e) => setSlideForm((p) => ({ ...p, subtitle: e.target.value }))} placeholder="Short description" className="w-full bg-gray-100 dark:bg-zinc-800 border-0 rounded-lg px-3 py-2.5 text-sm" />
                </div>
                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowSlideModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm">Cancel</button>
                  <button onClick={handleSaveSlide} disabled={saving} className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2">
                    {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaSave />}
                    {editingSlide ? "Update" : "Add"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowScheduleModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Schedule Banner</h2>
              <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full bg-gray-100 dark:bg-zinc-800 border-0 rounded-lg px-3 py-2.5 text-sm mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setShowScheduleModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 rounded-xl font-medium text-sm">Cancel</button>
                <button onClick={handleSchedule} className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-sm">Schedule</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InternalBanners;
