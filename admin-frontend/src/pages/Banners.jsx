/**
 * Banners.jsx - Enhanced Admin Banner Management Page
 * Features: Badge, Priority, Gradients, Text Position, Loop Video, Real-time updates
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaImage,
  FaVideo,
  FaEye,
  FaMousePointer,
  FaToggleOn,
  FaToggleOff,
  FaGripVertical,
  FaExternalLinkAlt,
  FaTimes,
  FaCloudUploadAlt,
  FaCopy,
  FaFire,
  FaStar,
  FaBolt,
  FaClock,
  FaGem,
  FaSearch,
  FaFilter,
  FaSync,
} from "react-icons/fa";
import { HiOutlineSparkles, HiSparkles } from "react-icons/hi2";
import { useAdmin } from "../context/AdminContext";
import { toast } from "react-toastify";

// Badge options
const BADGE_OPTIONS = [
  { value: "none", label: "No Badge", icon: null },
  { value: "new", label: "NEW", icon: HiSparkles, color: "text-emerald-500" },
  { value: "hot", label: "HOT", icon: FaFire, color: "text-orange-500" },
  { value: "sale", label: "SALE", icon: FaBolt, color: "text-pink-500" },
  { value: "limited", label: "LIMITED", icon: FaClock, color: "text-purple-500" },
  { value: "featured", label: "FEATURED", icon: FaGem, color: "text-amber-500" },
  { value: "popular", label: "POPULAR", icon: FaStar, color: "text-yellow-500" },
  { value: "trending", label: "TRENDING", icon: FaArrowUp, color: "text-blue-500" },
  { value: "exclusive", label: "EXCLUSIVE", icon: FaLock, color: "text-red-500" },
  { value: "limited-time", label: "LIMITED TIME", icon: FaClock, color: "text-purple-500" },
  { value: "limited-time", label: "LIMITED TIME", icon: FaClock, color: "text-purple-500" },
  { value: "advertisment", label: "ADVERTISEMENTS", icon:FaAd, color: "text-blue-500" },
];

// Priority options
const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-gray-500" },
  { value: "medium", label: "Medium", color: "bg-blue-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "urgent", label: "Urgent", color: "bg-red-500" },
];

// Text position options
const TEXT_POSITION_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

// Gradient presets
const GRADIENT_PRESETS = [
  { from: "#6366f1", to: "#8b5cf6", name: "Indigo Purple" },
  { from: "#10b981", to: "#06b6d4", name: "Emerald Cyan" },
  { from: "#f59e0b", to: "#f97316", name: "Amber Orange" },
  { from: "#ec4899", to: "#8b5cf6", name: "Pink Purple" },
  { from: "#3b82f6", to: "#1d4ed8", name: "Blue Dark" },
  { from: "#ef4444", to: "#dc2626", name: "Red" },
];

// Animation types
const ANIMATION_OPTIONS = [
  { value: "fade", label: "Fade" },
  { value: "slide", label: "Slide" },
  { value: "zoom", label: "Zoom" },
  { value: "flip", label: "Flip" },
];

// Button styles
const BUTTON_STYLE_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" },
  { value: "gradient", label: "Gradient" },
  { value: "glass", label: "Glass" },
];

// Title sizes
const TITLE_SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "xlarge", label: "Extra Large" },
];

// Advanced: Font Family
const FONT_FAMILY_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "inter", label: "Inter" },
  { value: "poppins", label: "Poppins" },
  { value: "roboto", label: "Roboto" },
  { value: "montserrat", label: "Montserrat" },
  { value: "playfair", label: "Playfair Display" },
];

// Advanced: Text Shadow
const TEXT_SHADOW_OPTIONS = [
  { value: "none", label: "None" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "strong", label: "Strong" },
];

// Advanced: Border Radius
const BORDER_RADIUS_OPTIONS = [
  { value: "none", label: "None" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "full", label: "Full" },
];

// Advanced: Overlay Type
const OVERLAY_TYPE_OPTIONS = [
  { value: "gradient", label: "Gradient" },
  { value: "solid", label: "Solid Color" },
  { value: "none", label: "None" },
];

// Advanced: CTA Size
const CTA_SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

// Advanced: Content Animation
const CONTENT_ANIMATION_OPTIONS = [
  { value: "fade", label: "Fade In" },
  { value: "slide-up", label: "Slide Up" },
  { value: "slide-left", label: "Slide Left" },
  { value: "zoom", label: "Zoom In" },
  { value: "none", label: "None" },
];

// Advanced: Content Padding
const CONTENT_PADDING_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

// Advanced: Content Width
const CONTENT_WIDTH_OPTIONS = [
  { value: "narrow", label: "Narrow" },
  { value: "medium", label: "Medium" },
  { value: "wide", label: "Wide" },
  { value: "full", label: "Full Width" },
];

const Banners = () => {
  const { adminAxios } = useAdmin();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Enhanced form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mediaType: "image",
    mediaUrl: "",
    thumbnailUrl: "",
    link: "",
    linkText: "Learn More",
    linkTarget: "_blank",
    isActive: true,
    startDate: "",
    endDate: "",
    badge: "none",
    priority: "medium",
    gradientFrom: "#6366f1",
    gradientTo: "#8b5cf6",
    textPosition: "left",
    loopVideo: true,
    animationType: "fade",
    overlayOpacity: 60,
    buttonStyle: "solid",
    titleSize: "large",
    autoAdvanceDelay: 6000,
    showArrows: true,
    showDots: true,
    showProgressBar: true,
    // Advanced Typography
    textColor: "#ffffff",
    fontFamily: "default",
    textShadow: "medium",
    // Advanced Visual Effects
    borderRadius: "large",
    bgBlur: 0,
    overlayType: "gradient",
    overlayColor: "#000000",
    // CTA Button Advanced
    ctaColor: "#ffffff",
    ctaTextColor: "#000000",
    ctaSize: "medium",
    ctaRounded: "medium",
    // Badge & Animation
    showBadgeAnimation: true,
    contentAnimation: "slide-up",
    // Layout
    contentPadding: "medium",
    contentWidth: "medium",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch banners
  const fetchBanners = async () => {
    try {
      const res = await adminAxios.get("/banners/admin");
      setBanners(res.data.banners || []);
    } catch (err) {
      toast.error("Failed to fetch banners");
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const res = await adminAxios.get("/banners/analytics");
      setAnalytics(res.data.analytics);
    } catch (err) {
      console.error("Failed to fetch analytics");
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchAnalytics();
  }, []);

  // Filtered banners
  const filteredBanners = banners.filter((banner) => {
    const matchesSearch = banner.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && banner.isActive) ||
      (filterStatus === "inactive" && !banner.isActive);
    return matchesSearch && matchesFilter;
  });

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error(`File too large. Max: ${isVideo ? "100MB" : "10MB"}`);
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("media", file);

    try {
      const res = await adminAxios.post("/banners/upload", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setFormData((prev) => ({
          ...prev,
          mediaType: res.data.mediaType,
          mediaUrl: res.data.mediaUrl,
          thumbnailUrl: res.data.thumbnailUrl || "",
        }));
        toast.success("Media uploaded!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.mediaUrl) {
      toast.error("Title and media are required");
      return;
    }

    try {
      if (editingBanner) {
        await adminAxios.put(`/banners/${editingBanner._id}`, formData);
        toast.success("Banner updated!");
      } else {
        await adminAxios.post("/banners", formData);
        toast.success("Banner created!");
      }

      setShowModal(false);
      resetForm();
      fetchBanners();
      fetchAnalytics();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save banner");
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm("Delete this banner?")) return;

    try {
      await adminAxios.delete(`/banners/${id}`);
      toast.success("Banner deleted!");
      fetchBanners();
      fetchAnalytics();
    } catch (err) {
      toast.error("Failed to delete banner");
    }
  };

  // Toggle active
  const toggleActive = async (banner) => {
    try {
      await adminAxios.put(`/banners/${banner._id}`, { isActive: !banner.isActive });
      fetchBanners();
      toast.success(`Banner ${!banner.isActive ? "activated" : "deactivated"}`);
    } catch (err) {
      toast.error("Failed to update banner");
    }
  };

  // Duplicate banner
  const duplicateBanner = async (banner) => {
    try {
      const newBanner = {
        ...banner,
        title: `${banner.title} (Copy)`,
        views: 0,
        clicks: 0,
      };
      delete newBanner._id;
      delete newBanner.createdAt;
      delete newBanner.updatedAt;

      await adminAxios.post("/banners", newBanner);
      toast.success("Banner duplicated!");
      fetchBanners();
    } catch (err) {
      toast.error("Failed to duplicate banner");
    }
  };

  // Handle reorder
  const handleReorder = async (newOrder) => {
    setBanners(newOrder);
    try {
      await adminAxios.put("/banners/reorder", { orderedIds: newOrder.map((b) => b._id) });
    } catch (err) {
      toast.error("Failed to reorder");
      fetchBanners();
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      mediaType: "image",
      mediaUrl: "",
      thumbnailUrl: "",
      link: "",
      linkText: "Learn More",
      linkTarget: "_blank",
      isActive: true,
      startDate: "",
      endDate: "",
      badge: "none",
      priority: "medium",
      gradientFrom: "#6366f1",
      gradientTo: "#8b5cf6",
      textPosition: "left",
      loopVideo: true,
      animationType: "fade",
      overlayOpacity: 60,
      buttonStyle: "solid",
      titleSize: "large",
      autoAdvanceDelay: 6000,
      showArrows: true,
      showDots: true,
      showProgressBar: true,
      // Advanced Typography
      textColor: "#ffffff",
      fontFamily: "default",
      textShadow: "medium",
      // Advanced Visual Effects
      borderRadius: "large",
      bgBlur: 0,
      overlayType: "gradient",
      overlayColor: "#000000",
      // CTA Button Advanced
      ctaColor: "#ffffff",
      ctaTextColor: "#000000",
      ctaSize: "medium",
      ctaRounded: "medium",
      // Badge & Animation
      showBadgeAnimation: true,
      contentAnimation: "slide-up",
      // Layout
      contentPadding: "medium",
      contentWidth: "medium",
    });
    setEditingBanner(null);
    setShowAdvanced(false);
  };

  // Helper to format date for datetime-local input
  const formatDateTimeLocal = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${mins}`;
  };

  // Open edit modal
  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || "",
      mediaType: banner.mediaType,
      mediaUrl: banner.mediaUrl,
      thumbnailUrl: banner.thumbnailUrl || "",
      link: banner.link || "",
      linkText: banner.linkText || "Learn More",
      linkTarget: banner.linkTarget || "_blank",
      isActive: banner.isActive,
      startDate: formatDateTimeLocal(banner.startDate),
      endDate: formatDateTimeLocal(banner.endDate),
      badge: banner.badge || "none",
      priority: banner.priority || "medium",
      gradientFrom: banner.gradientFrom || "#6366f1",
      gradientTo: banner.gradientTo || "#8b5cf6",
      textPosition: banner.textPosition || "left",
      loopVideo: banner.loopVideo !== false,
      animationType: banner.animationType || "fade",
      overlayOpacity: banner.overlayOpacity ?? 60,
      buttonStyle: banner.buttonStyle || "solid",
      titleSize: banner.titleSize || "large",
      autoAdvanceDelay: banner.autoAdvanceDelay || 6000,
      showArrows: banner.showArrows !== false,
      showDots: banner.showDots !== false,
      showProgressBar: banner.showProgressBar !== false,
      // Advanced Typography
      textColor: banner.textColor || "#ffffff",
      fontFamily: banner.fontFamily || "default",
      textShadow: banner.textShadow || "medium",
      // Advanced Visual Effects
      borderRadius: banner.borderRadius || "large",
      bgBlur: banner.bgBlur || 0,
      overlayType: banner.overlayType || "gradient",
      overlayColor: banner.overlayColor || "#000000",
      // CTA Button Advanced
      ctaColor: banner.ctaColor || "#ffffff",
      ctaTextColor: banner.ctaTextColor || "#000000",
      ctaSize: banner.ctaSize || "medium",
      ctaRounded: banner.ctaRounded || "medium",
      // Badge & Animation
      showBadgeAnimation: banner.showBadgeAnimation !== false,
      contentAnimation: banner.contentAnimation || "slide-up",
      // Layout
      contentPadding: banner.contentPadding || "medium",
      contentWidth: banner.contentWidth || "medium",
    });
    setShowModal(true);
    setShowAdvanced(false);
  };

  // Get badge icon
  const getBadgeIcon = (badge) => {
    const option = BADGE_OPTIONS.find((o) => o.value === badge);
    return option?.icon;
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HiOutlineSparkles className="text-purple-500" />
            Promotional Banners
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage homepage carousel banners with real-time updates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchBanners(); fetchAnalytics(); }}
            className="p-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-all"
            title="Refresh"
          >
            <FaSync className="text-gray-500" />
          </button>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all"
          >
            <FaPlus /> Add Banner
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Banners</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalBanners}</p>
          </div>
          <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Active</p>
            <p className="text-2xl font-bold text-green-500">{analytics.activeBanners}</p>
          </div>
          <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
              <FaEye className="text-xs" /> Total Views
            </p>
            <p className="text-2xl font-bold text-blue-500">{analytics.totalViews}</p>
          </div>
          <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
              <FaMousePointer className="text-xs" /> CTR
            </p>
            <p className="text-2xl font-bold text-purple-500">{analytics.avgCTR}</p>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search banners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500/30 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "inactive"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all capitalize ${
                filterStatus === status
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Banner List */}
      {filteredBanners.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700">
          <FaImage className="text-5xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {banners.length === 0 ? "No Banners Yet" : "No Matching Banners"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {banners.length === 0 ? "Create your first promotional banner" : "Try adjusting your search or filters"}
          </p>
          {banners.length === 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium"
            >
              Add Banner
            </button>
          )}
        </div>
      ) : (
        <Reorder.Group values={filteredBanners} onReorder={handleReorder} className="space-y-3">
          {filteredBanners.map((banner) => {
            const BadgeIcon = getBadgeIcon(banner.badge);
            return (
              <Reorder.Item key={banner._id} value={banner}>
                <motion.div
                  layout
                  className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4 flex items-center gap-4 hover:border-purple-500/50 transition-all cursor-grab active:cursor-grabbing"
                >
                  {/* Drag Handle */}
                  <div className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-grab">
                    <FaGripVertical />
                  </div>

                  {/* Preview */}
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-700 flex-shrink-0 relative">
                    {banner.mediaType === "video" ? (
                      <>
                        <img src={banner.thumbnailUrl || banner.mediaUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <FaVideo className="text-white" />
                        </div>
                      </>
                    ) : (
                      <img src={banner.mediaUrl} alt="" className="w-full h-full object-cover" />
                    )}
                    {/* Gradient preview */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ background: `linear-gradient(to right, ${banner.gradientFrom || "#6366f1"}, ${banner.gradientTo || "#8b5cf6"})` }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{banner.title}</h3>
                      {BadgeIcon && banner.badge !== "none" && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${BADGE_OPTIONS.find((o) => o.value === banner.badge)?.color} bg-current/10`}>
                          {banner.badge.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {banner.description || "No description"}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><FaEye /> {banner.views}</span>
                      <span className="flex items-center gap-1"><FaMousePointer /> {banner.clicks}</span>
                      {banner.link && (
                        <span className="flex items-center gap-1 text-blue-500">
                          <FaExternalLinkAlt /> Link
                        </span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${PRIORITY_OPTIONS.find((o) => o.value === banner.priority)?.color || "bg-gray-500"} text-white`}>
                        {banner.priority?.toUpperCase() || "MEDIUM"}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    banner.isActive
                      ? "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400"
                      : "bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400"
                  }`}>
                    {banner.isActive ? "Active" : "Inactive"}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(banner)}
                      className={`p-2 rounded-lg transition-all ${
                        banner.isActive ? "text-green-500 hover:bg-green-500/10" : "text-gray-400 hover:bg-gray-500/10"
                      }`}
                      title={banner.isActive ? "Deactivate" : "Activate"}
                    >
                      {banner.isActive ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
                    </button>
                    <button
                      onClick={() => duplicateBanner(banner)}
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-500/10 transition-all"
                      title="Duplicate"
                    >
                      <FaCopy />
                    </button>
                    <button
                      onClick={() => openEditModal(banner)}
                      className="p-2 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-all"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(banner._id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-all"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </motion.div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingBanner ? "Edit Banner" : "Create Banner"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-all text-gray-500"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-5">
                {/* Media Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Media (Image or Video) *
                  </label>
                  {formData.mediaUrl ? (
                    <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800">
                      {formData.mediaType === "video" ? (
                        <video src={formData.mediaUrl} className="w-full h-48 object-cover" controls />
                      ) : (
                        <img src={formData.mediaUrl} alt="Preview" className="w-full h-48 object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, mediaUrl: "", thumbnailUrl: "" }))}
                        className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-xl cursor-pointer hover:border-purple-500 transition-all">
                      {uploading ? (
                        <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <FaCloudUploadAlt className="text-4xl text-gray-400 mb-2" />
                          <p className="text-gray-500 dark:text-gray-400">Click to upload image or video</p>
                          <p className="text-xs text-gray-400">Max: 10MB image, 100MB video</p>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>

                {/* Title & Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                      placeholder="50% Off Premium Plans"
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 text-gray-900 dark:text-white"
                      maxLength={100}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Badge</label>
                    <select
                      value={formData.badge}
                      onChange={(e) => setFormData((p) => ({ ...p, badge: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/30 text-gray-900 dark:text-white"
                    >
                      {BADGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Limited time offer for new users..."
                    className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/30 resize-none text-gray-900 dark:text-white"
                    rows={2}
                    maxLength={300}
                  />
                </div>

                {/* Priority & Text Position */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData((p) => ({ ...p, priority: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/30 text-gray-900 dark:text-white"
                    >
                      {PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text Position</label>
                    <select
                      value={formData.textPosition}
                      onChange={(e) => setFormData((p) => ({ ...p, textPosition: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/30 text-gray-900 dark:text-white"
                    >
                      {TEXT_POSITION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-7">
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, loopVideo: !p.loopVideo }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        formData.loopVideo ? "bg-purple-500" : "bg-gray-300 dark:bg-zinc-700"
                      }`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.loopVideo ? "translate-x-6" : ""}`} />
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Loop Video</span>
                  </div>
                </div>

                {/* Gradient Colors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gradient Overlay</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {GRADIENT_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, gradientFrom: preset.from, gradientTo: preset.to }))}
                        className={`w-12 h-8 rounded-lg border-2 transition-all ${
                          formData.gradientFrom === preset.from && formData.gradientTo === preset.to
                            ? "border-white ring-2 ring-purple-500"
                            : "border-transparent"
                        }`}
                        style={{ background: `linear-gradient(to right, ${preset.from}, ${preset.to})` }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.gradientFrom}
                        onChange={(e) => setFormData((p) => ({ ...p, gradientFrom: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                      />
                      <span className="text-xs text-gray-500">From</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.gradientTo}
                        onChange={(e) => setFormData((p) => ({ ...p, gradientTo: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0"
                      />
                      <span className="text-xs text-gray-500">To</span>
                    </div>
                    <div
                      className="flex-1 h-10 rounded-lg"
                      style={{ background: `linear-gradient(to right, ${formData.gradientFrom}, ${formData.gradientTo})` }}
                    />
                  </div>
                </div>

                {/* Link */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Link URL</label>
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData((p) => ({ ...p, link: e.target.value }))}
                      placeholder="https://example.com/promo"
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/30 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Button Text</label>
                    <input
                      type="text"
                      value={formData.linkText}
                      onChange={(e) => setFormData((p) => ({ ...p, linkText: e.target.value }))}
                      placeholder="Learn More"
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/30 text-gray-900 dark:text-white"
                      maxLength={30}
                    />
                  </div>
                </div>

                {/* Schedule with Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/30 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/30 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Leave empty for no expiry</p>
                  </div>
                </div>

                {/* Display Duration - Prominent control */}
                <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      ⏱️ Display Duration
                    </label>
                    <span className="text-lg font-bold text-purple-500">
                      {(formData.autoAdvanceDelay / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="15000"
                    step="500"
                    value={formData.autoAdvanceDelay}
                    onChange={(e) => setFormData((p) => ({ ...p, autoAdvanceDelay: parseInt(e.target.value) }))}
                    className="w-full accent-purple-500 h-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1s (fast)</span>
                    <span>How long this banner shows before next</span>
                    <span>15s (slow)</span>
                  </div>
                </div>

                {/* Advanced Options Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-zinc-800 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all"
                >
                  <span>⚙️ Advanced Options</span>
                  <span className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}>▼</span>
                </button>

                {/* Advanced Options Content */}
                {showAdvanced && (
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700">
                    {/* Animation & Title */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Animation Type
                        </label>
                        <select
                          value={formData.animationType}
                          onChange={(e) => setFormData((p) => ({ ...p, animationType: e.target.value }))}
                          className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500/30 text-gray-900 dark:text-white"
                        >
                          {ANIMATION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Title Size
                        </label>
                        <select
                          value={formData.titleSize}
                          onChange={(e) => setFormData((p) => ({ ...p, titleSize: e.target.value }))}
                          className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500/30 text-gray-900 dark:text-white"
                        >
                          {TITLE_SIZE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Button Style & Overlay */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Button Style
                        </label>
                        <select
                          value={formData.buttonStyle}
                          onChange={(e) => setFormData((p) => ({ ...p, buttonStyle: e.target.value }))}
                          className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500/30 text-gray-900 dark:text-white"
                        >
                          {BUTTON_STYLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Overlay Opacity: {formData.overlayOpacity}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={formData.overlayOpacity}
                          onChange={(e) => setFormData((p) => ({ ...p, overlayOpacity: parseInt(e.target.value) }))}
                          className="w-full accent-purple-500"
                        />
                      </div>
                    </div>

                    {/* Auto Advance Delay */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Auto Advance Delay: {formData.autoAdvanceDelay / 1000}s
                      </label>
                      <input
                        type="range"
                        min="2000"
                        max="15000"
                        step="500"
                        value={formData.autoAdvanceDelay}
                        onChange={(e) => setFormData((p) => ({ ...p, autoAdvanceDelay: parseInt(e.target.value) }))}
                        className="w-full accent-purple-500"
                      />
                    </div>

                    {/* Display Toggles */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, showArrows: !p.showArrows }))}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            formData.showArrows ? "bg-purple-500" : "bg-gray-300 dark:bg-zinc-600"
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.showArrows ? "translate-x-5" : ""}`} />
                        </button>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Arrows</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, showDots: !p.showDots }))}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            formData.showDots ? "bg-purple-500" : "bg-gray-300 dark:bg-zinc-600"
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.showDots ? "translate-x-5" : ""}`} />
                        </button>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Dots</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, showProgressBar: !p.showProgressBar }))}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            formData.showProgressBar ? "bg-purple-500" : "bg-gray-300 dark:bg-zinc-600"
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.showProgressBar ? "translate-x-5" : ""}`} />
                        </button>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Progress</span>
                      </div>
                    </div>

                    {/* Section: Typography */}
                    <div className="pt-3 border-t border-gray-200 dark:border-zinc-700">
                      <h4 className="text-sm font-semibold text-purple-500 mb-3">📝 Typography</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Font Family</label>
                          <select
                            value={formData.fontFamily}
                            onChange={(e) => setFormData((p) => ({ ...p, fontFamily: e.target.value }))}
                            className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                          >
                            {FONT_FAMILY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Text Shadow</label>
                          <select
                            value={formData.textShadow}
                            onChange={(e) => setFormData((p) => ({ ...p, textShadow: e.target.value }))}
                            className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                          >
                            {TEXT_SHADOW_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Text Color</label>
                          <input
                            type="color"
                            value={formData.textColor}
                            onChange={(e) => setFormData((p) => ({ ...p, textColor: e.target.value }))}
                            className="w-full h-9 rounded-lg cursor-pointer border-0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section: Visual Effects */}
                    <div className="pt-3 border-t border-gray-200 dark:border-zinc-700">
                      <h4 className="text-sm font-semibold text-purple-500 mb-3">✨ Visual Effects</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Border Radius</label>
                          <select
                            value={formData.borderRadius}
                            onChange={(e) => setFormData((p) => ({ ...p, borderRadius: e.target.value }))}
                            className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                          >
                            {BORDER_RADIUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Background Blur: {formData.bgBlur}px</label>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            value={formData.bgBlur}
                            onChange={(e) => setFormData((p) => ({ ...p, bgBlur: parseInt(e.target.value) }))}
                            className="w-full accent-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Overlay Type</label>
                          <select
                            value={formData.overlayType}
                            onChange={(e) => setFormData((p) => ({ ...p, overlayType: e.target.value }))}
                            className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                          >
                            {OVERLAY_TYPE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Overlay Color</label>
                          <input
                            type="color"
                            value={formData.overlayColor}
                            onChange={(e) => setFormData((p) => ({ ...p, overlayColor: e.target.value }))}
                            className="w-full h-9 rounded-lg cursor-pointer border-0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section: CTA Button */}
                    <div className="pt-3 border-t border-gray-200 dark:border-zinc-700">
                      <h4 className="text-sm font-semibold text-purple-500 mb-3">🔘 CTA Button</h4>
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Button Color</label>
                          <input
                            type="color"
                            value={formData.ctaColor}
                            onChange={(e) => setFormData((p) => ({ ...p, ctaColor: e.target.value }))}
                            className="w-full h-9 rounded-lg cursor-pointer border-0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Text Color</label>
                          <input
                            type="color"
                            value={formData.ctaTextColor}
                            onChange={(e) => setFormData((p) => ({ ...p, ctaTextColor: e.target.value }))}
                            className="w-full h-9 rounded-lg cursor-pointer border-0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Size</label>
                          <select
                            value={formData.ctaSize}
                            onChange={(e) => setFormData((p) => ({ ...p, ctaSize: e.target.value }))}
                            className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                          >
                            {CTA_SIZE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Rounded</label>
                          <select
                            value={formData.ctaRounded}
                            onChange={(e) => setFormData((p) => ({ ...p, ctaRounded: e.target.value }))}
                            className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                          >
                            {BORDER_RADIUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section: Layout & Animation */}
                    <div className="pt-3 border-t border-gray-200 dark:border-zinc-700">
                      <h4 className="text-sm font-semibold text-purple-500 mb-3">📐 Layout & Animation</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Content Animation</label>
                          <select
                            value={formData.contentAnimation}
                            onChange={(e) => setFormData((p) => ({ ...p, contentAnimation: e.target.value }))}
                            className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                          >
                            {CONTENT_ANIMATION_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Content Padding</label>
                          <select
                            value={formData.contentPadding}
                            onChange={(e) => setFormData((p) => ({ ...p, contentPadding: e.target.value }))}
                            className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                          >
                            {CONTENT_PADDING_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Content Width</label>
                          <select
                            value={formData.contentWidth}
                            onChange={(e) => setFormData((p) => ({ ...p, contentWidth: e.target.value }))}
                            className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                          >
                            {CONTENT_WIDTH_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, showBadgeAnimation: !p.showBadgeAnimation }))}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            formData.showBadgeAnimation ? "bg-purple-500" : "bg-gray-300 dark:bg-zinc-600"
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.showBadgeAnimation ? "translate-x-5" : ""}`} />
                        </button>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Animate Badge</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, isActive: !p.isActive }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      formData.isActive ? "bg-green-500" : "bg-gray-300 dark:bg-zinc-700"
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.isActive ? "translate-x-6" : ""}`} />
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Banner is {formData.isActive ? "active" : "inactive"}
                  </span>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl font-medium transition-all text-gray-700 dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all"
                  >
                    {editingBanner ? "Update Banner" : "Create Banner"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Banners;
