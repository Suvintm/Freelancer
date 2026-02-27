/**
 * Advertisements.jsx - Production-Grade Admin Advertisement Management
 * Features: Multi-step form wizard, global toggle, analytics, gallery upload
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus, FaEdit, FaTrash, FaImage, FaVideo, FaEye,
  FaMousePointer, FaToggleOn, FaToggleOff, FaExternalLinkAlt,
  FaTimes, FaCloudUploadAlt, FaCheck, FaInstagram, FaGlobe,
  FaFacebook, FaYoutube, FaLink, FaSync, FaChevronLeft,
  FaChevronRight, FaAd, FaBullhorn, FaUser, FaBuilding,
} from "react-icons/fa";
import { HiSparkles, HiOutlineSparkles, HiCheckCircle, HiXCircle, HiClock } from "react-icons/hi2";
import { useAdmin } from "../context/AdminContext";
import { toast } from "react-toastify";

const DISPLAY_LOCATIONS = [
  { value: "home_banner", label: "Home Banner (Level 0)", icon: "🏠" },
  { value: "reels_feed", label: "Reels Feed (Between Reels)", icon: "🎬" },
  { value: "explore_page", label: "Explore Page", icon: "🔍" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-gray-500" },
  { value: "medium", label: "Medium", color: "bg-blue-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "urgent", label: "Urgent", color: "bg-red-500" },
];

const STEPS = [
  { id: 1, title: "Advertiser", icon: FaUser },
  { id: 2, title: "Content", icon: FaBullhorn },
  { id: 3, title: "Media", icon: FaImage },
  { id: 4, title: "Links", icon: FaLink },
  { id: 5, title: "Display", icon: FaEye },
];

const INITIAL_FORM = {
  advertiserName: "", advertiserEmail: "", advertiserPhone: "", companyName: "",
  title: "", tagline: "", description: "", longDescription: "",
  mediaType: "image", mediaUrl: "", thumbnailUrl: "", galleryImages: [],
  websiteUrl: "", instagramUrl: "", facebookUrl: "", youtubeUrl: "", otherUrl: "",
  ctaText: "Learn More",
  isActive: false,
  isDefault: false,
  displayLocations: ["home_banner"],
  badge: "SPONSOR",
  startDate: "", endDate: "",
  priority: "medium",
  adminNotes: "",
  approvalStatus: "pending",
};

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
        fixed = fixed.replace(/_([a-z0-9\-_]+\.(webp|jpg|jpeg|png|mp4|mov|m4v|json))/gi, "/$1");
        
        // Flatten double slashes
        fixed = fixed.replace(/([^:])\/\/+/g, "$1/");
    }

    // 4. Restore Extension Dots
    fixed = fixed.replace(/_jpg([/_?#]|$)/gi, ".jpg$1")
                 .replace(/_jpeg([/_?#]|$)/gi, ".jpeg$1")
                 .replace(/_png([/_?#]|$)/gi, ".png$1")
                 .replace(/_mp4([/_?#]|$)/gi, ".mp4$1")
                 .replace(/_webp([/_?#]|$)/gi, ".webp$1")
                 .replace(/_json([/_?#]|$)/gi, ".json$1");

    return fixed;
};

const Advertisements = () => {
  const { adminAxios } = useAdmin();
  const [ads, setAds] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showSuvixAds, setShowSuvixAds] = useState(true);
  const [togglingGlobal, setTogglingGlobal] = useState(false);

  const fetchAds = async () => {
    try {
      const res = await adminAxios.get("/ads/admin/all");
      setAds(res.data.ads || []);
    } catch (err) {
      toast.error("Failed to fetch advertisements");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await adminAxios.get("/ads/admin/analytics");
      setAnalytics(res.data.analytics);
    } catch {}
  };

  const fetchSettings = async () => {
    try {
      const res = await adminAxios.get("/ads/admin/settings");
      setShowSuvixAds(res.data.settings?.showSuvixAds ?? true);
    } catch {}
  };

  useEffect(() => {
    fetchAds();
    fetchAnalytics();
    fetchSettings();
  }, []);

  const handleGlobalToggle = async () => {
    setTogglingGlobal(true);
    try {
      const res = await adminAxios.post("/ads/admin/toggle-suvix-ads", {
        showSuvixAds: !showSuvixAds,
      });
      setShowSuvixAds(res.data.showSuvixAds);
      toast.success(res.data.message);
    } catch {
      toast.error("Failed to update setting");
    } finally {
      setTogglingGlobal(false);
    }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 200 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Max: ${isVideo ? "200MB" : "10MB"}`);
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("media", file);
    try {
      const res = await adminAxios.post("/ads/admin/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        const cleanedMediaUrl = repairUrl(res.data.mediaUrl);
        console.log(`[UPLOAD] Server returned: ${res.data.mediaUrl}`);
        if (cleanedMediaUrl !== res.data.mediaUrl) {
          console.log(`[UPLOAD] Auto-repaired locally: ${cleanedMediaUrl}`);
        }
        setFormData((p) => ({
          ...p,
          mediaType: res.data.mediaType,
          mediaUrl: cleanedMediaUrl,
          thumbnailUrl: repairUrl(res.data.thumbnailUrl || ""),
        }));
        toast.success("Media uploaded!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const remaining = 5 - formData.galleryImages.length;
    if (files.length > remaining) {
      toast.error(`You can upload ${remaining} more image(s). Max 5 total.`);
      return;
    }
    setUploadingGallery(true);
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    try {
      const res = await adminAxios.post("/ads/admin/upload-gallery", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
        const cleanedUrls = res.data.galleryImages.map(url => repairUrl(url));
        console.log(`[GALLERY] Server returned:`, res.data.galleryImages);
        setFormData((p) => ({
          ...p,
          galleryImages: [...p.galleryImages, ...cleanedUrls],
        }));
        toast.success(`${res.data.galleryImages.length} image(s) uploaded!`);
      } catch (err) {
      toast.error(err.response?.data?.message || "Gallery upload failed");
      } finally {
      setUploadingGallery(false);
      }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.mediaUrl || !formData.advertiserName) {
      toast.error("Advertiser name, title, and media are required");
      return;
    }
    try {
      if (editingAd) {
        await adminAxios.put(`/ads/${editingAd._id}`, formData);
        toast.success("Advertisement updated!");
      } else {
        await adminAxios.post("/ads", formData);
        toast.success("Advertisement created!");
      }
      setShowModal(false);
      resetForm();
      fetchAds();
      fetchAnalytics();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save ad");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this advertisement? This cannot be undone.")) return;
    try {
      await adminAxios.delete(`/ads/${id}`);
      toast.success("Advertisement deleted!");
      fetchAds();
      fetchAnalytics();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleApprovalToggle = async (ad) => {
    const newStatus = ad.approvalStatus === "approved" ? "pending" : "approved";
    const newActive = newStatus === "approved";
    try {
      await adminAxios.put(`/ads/${ad._id}`, {
        approvalStatus: newStatus,
        isActive: newActive,
      });
      toast.success(`Ad ${newStatus === "approved" ? "approved & activated" : "set to pending"}`);
      fetchAds();
    } catch {
      toast.error("Failed to update");
    }
  };

  const openEdit = (ad) => {
    setEditingAd(ad);
    setFormData({
      advertiserName: ad.advertiserName || "",
      advertiserEmail: ad.advertiserEmail || "",
      advertiserPhone: ad.advertiserPhone || "",
      companyName: ad.companyName || "",
      title: ad.title || "",
      tagline: ad.tagline || "",
      description: ad.description || "",
      longDescription: ad.longDescription || "",
      mediaType: ad.mediaType || "image",
      mediaUrl: ad.mediaUrl || "",
      thumbnailUrl: ad.thumbnailUrl || "",
      galleryImages: ad.galleryImages || [],
      websiteUrl: ad.websiteUrl || "",
      instagramUrl: ad.instagramUrl || "",
      facebookUrl: ad.facebookUrl || "",
      youtubeUrl: ad.youtubeUrl || "",
      otherUrl: ad.otherUrl || "",
      ctaText: ad.ctaText || "Learn More",
      isActive: ad.isActive,
      isDefault: ad.isDefault || false,
      displayLocations: ad.displayLocations || ["home_banner"],
      badge: ad.badge || "SPONSOR",
      startDate: ad.startDate ? ad.startDate.slice(0, 16) : "",
      endDate: ad.endDate ? ad.endDate.slice(0, 16) : "",
      priority: ad.priority || "medium",
      adminNotes: ad.adminNotes || "",
      approvalStatus: ad.approvalStatus || "pending",
    });
    setCurrentStep(1);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setEditingAd(null);
    setCurrentStep(1);
  };

  const filteredAds = ads.filter((ad) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return ad.isActive && ad.approvalStatus === "approved";
    if (filterStatus === "pending") return ad.approvalStatus === "pending";
    if (filterStatus === "inactive") return !ad.isActive;
    if (filterStatus === "defaults") return ad.isDefault;
    return true;
  });

  const getStatusBadge = (ad) => {
    if (ad.approvalStatus === "approved" && ad.isActive)
      return <span className="px-2 py-1 text-[10px] font-bold bg-green-500/20 text-green-400 rounded-full flex items-center gap-1"><HiCheckCircle /> LIVE</span>;
    if (ad.approvalStatus === "rejected")
      return <span className="px-2 py-1 text-[10px] font-bold bg-red-500/20 text-red-400 rounded-full flex items-center gap-1"><HiXCircle /> REJECTED</span>;
    if (ad.approvalStatus === "pending")
      return <span className="px-2 py-1 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-full flex items-center gap-1"><HiClock /> PENDING</span>;
    return <span className="px-2 py-1 text-[10px] font-bold bg-gray-500/20 text-gray-400 rounded-full">INACTIVE</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaAd className="text-blue-500" />
            Advertisement Manager
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage commercial ads — home banner, reels feed, explore page
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchAds(); fetchAnalytics(); fetchSettings(); }}
            className="p-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-all"
          >
            <FaSync className="text-gray-500" />
          </button>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
          >
            <FaPlus /> New Ad
          </button>
        </div>
      </div>

      {/* Global Toggle */}
      <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HiSparkles className="text-amber-500" />
              Suvix Internal Ads (Level 0)
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              When OFF, the home banner will show only Editor and Service levels. All external ads remain visible.
            </p>
          </div>
          <button
            onClick={handleGlobalToggle}
            disabled={togglingGlobal}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white transition-all ${
              showSuvixAds ? "bg-green-600 hover:bg-green-700" : "bg-gray-500 hover:bg-gray-600"
            }`}
          >
            {togglingGlobal ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : showSuvixAds ? (
              <><FaToggleOn size={18} /> ON</>
            ) : (
              <><FaToggleOff size={18} /> OFF</>
            )}
          </button>
        </div>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Ads", value: analytics.totalAds, color: "text-gray-900 dark:text-white" },
            { label: "Live Ads", value: analytics.activeAds, color: "text-green-500" },
            { label: "Pending Review", value: analytics.pendingAds, color: "text-amber-500" },
            { label: "Total Views", value: analytics.totalViews, color: "text-blue-500" },
            { label: "Overall CTR", value: analytics.avgCTR, color: "text-purple-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4">
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "active", "pending", "inactive", "defaults"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl font-medium capitalize transition-all text-sm ${
              filterStatus === status
                ? status === "defaults" ? "bg-amber-500 text-white" : "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            }`}
          >
            {status === "all" ? `All (${ads.length})` : status === "defaults" ? `⭐ Defaults` : status}
          </button>
        ))}
      </div>

      {/* Ads List */}
      {filteredAds.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700">
          <FaAd className="text-5xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Advertisements</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first commercial advertisement</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
          >
            Create Ad
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAds.map((ad) => (
            <motion.div
              key={ad._id}
              layout
              className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4 flex items-center gap-4 hover:border-blue-500/50 transition-all"
            >
              {/* Thumbnail */}
              <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-700 flex-shrink-0 relative">
                {ad.mediaType === "video" ? (
                  <>
                    <img src={repairUrl(ad.thumbnailUrl || ad.mediaUrl)} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <FaVideo className="text-white" />
                    </div>
                  </>
                ) : (
                  <img src={repairUrl(ad.mediaUrl)} alt="" className="w-full h-full object-cover" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{ad.title}</h3>
                  {getStatusBadge(ad)}
                  {ad.isDefault && (
                    <span className="px-2 py-1 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-full">
                      DEFAULT
                    </span>
                  )}
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${PRIORITY_OPTIONS.find(p => p.value === ad.priority)?.color || "bg-gray-500"}`}>
                    {ad.priority?.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {ad.companyName || ad.advertiserName} • {ad.displayLocations?.join(", ")}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><FaEye /> {ad.views}</span>
                  <span className="flex items-center gap-1"><FaMousePointer /> {ad.clicks}</span>
                  {ad.websiteUrl && <span className="text-blue-500 flex items-center gap-1"><FaGlobe /> Website</span>}
                  {ad.instagramUrl && <span className="text-pink-500 flex items-center gap-1"><FaInstagram /> Instagram</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleApprovalToggle(ad)}
                  className={`p-2 rounded-lg transition-all text-sm font-bold ${
                    ad.approvalStatus === "approved"
                      ? "text-green-500 hover:bg-green-500/10"
                      : "text-amber-500 hover:bg-amber-500/10"
                  }`}
                  title={ad.approvalStatus === "approved" ? "Revoke approval" : "Approve ad"}
                >
                  {ad.approvalStatus === "approved" ? <HiCheckCircle size={18} /> : <HiClock size={18} />}
                </button>
                <button
                  onClick={() => openEdit(ad)}
                  className="p-2 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-all"
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(ad._id)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-all"
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ===== CREATE/EDIT MODAL ===== */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingAd ? "Edit Advertisement" : "Create Advertisement"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1]?.title}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500">
                  <FaTimes />
                </button>
              </div>

              {/* Step Progress */}
              <div className="flex items-center gap-0 px-5 pt-4">
                {STEPS.map((step, idx) => (
                  <div key={step.id} className="flex items-center flex-1">
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
                        currentStep === step.id
                          ? "bg-blue-600 text-white ring-4 ring-blue-500/30"
                          : currentStep > step.id
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 dark:bg-zinc-700 text-gray-500"
                      }`}
                    >
                      {currentStep > step.id ? <FaCheck className="text-[10px]" /> : step.id}
                    </button>
                    {idx < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 ${currentStep > step.id ? "bg-green-500" : "bg-gray-200 dark:bg-zinc-700"}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <div className="p-5 space-y-4">
                <AnimatePresence mode="wait">
                  {/* Step 1: Advertiser Info */}
                  {currentStep === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><FaUser className="text-blue-500" /> Advertiser Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Advertiser Name *</label>
                          <input type="text" value={formData.advertiserName} onChange={e => setFormData(p => ({...p, advertiserName: e.target.value}))} placeholder="e.g. John Smith" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                          <input type="text" value={formData.companyName} onChange={e => setFormData(p => ({...p, companyName: e.target.value}))} placeholder="e.g. Nike India" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                          <input type="email" value={formData.advertiserEmail} onChange={e => setFormData(p => ({...p, advertiserEmail: e.target.value}))} placeholder="contact@company.com" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                          <input type="text" value={formData.advertiserPhone} onChange={e => setFormData(p => ({...p, advertiserPhone: e.target.value}))} placeholder="+91 98765 43210" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Notes (Internal)</label>
                        <textarea value={formData.adminNotes} onChange={e => setFormData(p => ({...p, adminNotes: e.target.value}))} rows={2} placeholder="Internal notes about this ad campaign..." className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 outline-none resize-none" />
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Ad Content */}
                  {currentStep === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><FaBullhorn className="text-blue-500" /> Ad Content</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ad Title *</label>
                        <input type="text" value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} placeholder="e.g. Summer Sale — 50% Off" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tagline (short hook)</label>
                        <input type="text" value={formData.tagline} onChange={e => setFormData(p => ({...p, tagline: e.target.value}))} placeholder="e.g. High-end cinematic editing for your brand." className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Short Description (shown in banner)</label>
                        <textarea value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} rows={2} placeholder="Brief description..." className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 outline-none resize-none" maxLength={300} />
                        <p className="text-xs text-gray-400 text-right mt-1">{formData.description.length}/300</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Description (shown on Ad Details page)</label>
                        <textarea value={formData.longDescription} onChange={e => setFormData(p => ({...p, longDescription: e.target.value}))} rows={5} placeholder="Full rich content for the advertisement details page..." className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 outline-none resize-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CTA Button Text</label>
                          <input type="text" value={formData.ctaText} onChange={e => setFormData(p => ({...p, ctaText: e.target.value}))} placeholder="Learn More" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Badge Text</label>
                          <input type="text" value={formData.badge} onChange={e => setFormData(p => ({...p, badge: e.target.value}))} placeholder="SPONSOR" className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 outline-none" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Media */}
                  {currentStep === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><FaImage className="text-blue-500" /> Media Upload</h3>

                      {/* Primary Media */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Media (Image or Video) *</label>
                        {formData.mediaUrl ? (
                          <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800">
                            {formData.mediaType === "video" ? (
                              <video src={repairUrl(formData.mediaUrl)} className="w-full h-48 object-cover" controls />
                            ) : (
                              <img src={repairUrl(formData.mediaUrl)} alt="Preview" className="w-full h-48 object-cover" />
                            )}
                            <button
                              type="button"
                              onClick={() => setFormData(p => ({...p, mediaUrl: "", thumbnailUrl: ""}))}
                              className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-xl cursor-pointer hover:border-blue-500 transition-all">
                            {uploading ? (
                              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <FaCloudUploadAlt className="text-4xl text-gray-400 mb-2" />
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Click to upload image or video</p>
                                <p className="text-xs text-gray-400 mt-1">Max: 10MB image, 200MB video</p>
                              </>
                            )}
                            <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" disabled={uploading} />
                          </label>
                        )}
                      </div>

                      {/* Gallery Images */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Gallery Images ({formData.galleryImages.length}/5) — shown on Ad Details page
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {formData.galleryImages.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                              <img src={repairUrl(url)} alt="" className="w-full h-full object-cover" />
                              <button
                                onClick={() => setFormData(p => ({...p, galleryImages: p.galleryImages.filter((_, i) => i !== idx)}))}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                              >
                                <FaTimes className="text-white" />
                              </button>
                            </div>
                          ))}
                          {formData.galleryImages.length < 5 && (
                            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-600 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all">
                              {uploadingGallery ? (
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FaPlus className="text-gray-400" />
                              )}
                              <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" disabled={uploadingGallery} />
                            </label>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Links */}
                  {currentStep === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><FaLink className="text-blue-500" /> Links & Social</h3>
                      {[
                        { key: "websiteUrl", label: "Website URL", icon: FaGlobe, placeholder: "https://", color: "text-blue-500" },
                        { key: "instagramUrl", label: "Instagram URL", icon: FaInstagram, placeholder: "https://instagram.com/...", color: "text-pink-500" },
                        { key: "facebookUrl", label: "Facebook URL", icon: FaFacebook, placeholder: "https://facebook.com/...", color: "text-blue-600" },
                        { key: "youtubeUrl", label: "YouTube URL", icon: FaYoutube, placeholder: "https://youtube.com/...", color: "text-red-500" },
                        { key: "otherUrl", label: "Other URL", icon: FaExternalLinkAlt, placeholder: "https://...", color: "text-gray-500" },
                      ].map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                            <field.icon className={field.color} /> {field.label}
                          </label>
                          <input
                            type="url"
                            value={formData[field.key]}
                            onChange={(e) => setFormData(p => ({...p, [field.key]: e.target.value}))}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 outline-none"
                          />
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* Step 5: Display Settings */}
                  {currentStep === 5 && (
                    <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <h3 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><FaEye className="text-blue-500" /> Display Settings</h3>

                      {/* Display Locations */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Locations (where to show this ad)</label>
                        <div className="grid grid-cols-1 gap-2">
                          {DISPLAY_LOCATIONS.map((loc) => (
                            <label key={loc.value} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${formData.displayLocations.includes(loc.value) ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10" : "border-gray-200 dark:border-zinc-700"}`}>
                              <input
                                type="checkbox"
                                checked={formData.displayLocations.includes(loc.value)}
                                onChange={(e) => setFormData(p => ({
                                  ...p,
                                  displayLocations: e.target.checked
                                    ? [...p.displayLocations, loc.value]
                                    : p.displayLocations.filter(l => l !== loc.value)
                                }))}
                                className="accent-blue-600"
                              />
                              <span className="text-xl">{loc.icon}</span>
                              <span className="font-medium text-gray-900 dark:text-white text-sm">{loc.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Priority & Approval */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                          <select value={formData.priority} onChange={e => setFormData(p => ({...p, priority: e.target.value}))} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 outline-none">
                            {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Approval Status</label>
                          <select value={formData.approvalStatus} onChange={e => setFormData(p => ({...p, approvalStatus: e.target.value, isActive: e.target.value === "approved"}))} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 outline-none">
                            <option value="pending">Pending</option>
                            <option value="approved">Approved (Goes Live)</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>

                      {/* Scheduling */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                          <input type="datetime-local" value={formData.startDate} onChange={e => setFormData(p => ({...p, startDate: e.target.value}))} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                          <input type="datetime-local" value={formData.endDate} onChange={e => setFormData(p => ({...p, endDate: e.target.value}))} className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 outline-none" />
                        </div>
                      </div>

                      {/* Default Banner Toggle */}
                      <div className={`rounded-2xl border-2 p-4 flex items-start gap-4 cursor-pointer transition-all ${formData.isDefault ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10' : 'border-gray-200 dark:border-zinc-700'}`}
                        onClick={() => setFormData(p => ({...p, isDefault: !p.isDefault}))}
                      >
                        <div className={`mt-0.5 w-10 h-6 rounded-full flex items-center transition-all ${formData.isDefault ? 'bg-amber-400 justify-end' : 'bg-gray-300 dark:bg-zinc-600 justify-start'} px-0.5`}>
                          <div className="w-5 h-5 bg-white rounded-full shadow" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">Default Banner</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            When enabled, this banner will be shown automatically as a fallback whenever there are no live commercial ads active for its location.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Modal Footer Navigation */}
              <div className="flex items-center justify-between p-5 border-t border-gray-200 dark:border-zinc-800 sticky bottom-0 bg-white dark:bg-zinc-900">
                <button
                  onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 transition-all"
                >
                  <FaChevronLeft /> Previous
                </button>
                <div className="flex items-center gap-2">
                  {currentStep < STEPS.length ? (
                    <button
                      onClick={() => setCurrentStep(s => Math.min(STEPS.length, s + 1))}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
                    >
                      Next <FaChevronRight />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all"
                    >
                      <FaCheck /> {editingAd ? "Save Changes" : "Create Advertisement"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Advertisements;
