/**
 * AdminBanners.jsx - Admin Banner Management Page
 * Features:
 * - View all banners with analytics
 * - Create/Edit/Delete banners
 * - Drag to reorder
 * - Toggle active/inactive
 * - Image/Video upload
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
  FaChartLine,
} from "react-icons/fa";
import { HiOutlineSparkles } from "react-icons/hi2";
import axios from "axios";
import { toast } from "react-toastify";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminNavbar from "../../components/admin/AdminNavbar";

const ADMIN_API = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const AdminBanners = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form state
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
  });

  // Fetch banners
  const fetchBanners = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${ADMIN_API}/api/banners/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${ADMIN_API}/api/banners/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(res.data.analytics);
    } catch (err) {
      console.error("Failed to fetch analytics");
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchAnalytics();
  }, []);

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for image

    if (file.size > maxSize) {
      toast.error(`File too large. Max: ${isVideo ? "100MB" : "10MB"}`);
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("upload_preset", "suvix_uploads");
    formDataUpload.append("resource_type", isVideo ? "video" : "image");

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "ddxnegqjc";
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/${isVideo ? "video" : "image"}/upload`,
        formDataUpload
      );

      setFormData((prev) => ({
        ...prev,
        mediaType: isVideo ? "video" : "image",
        mediaUrl: res.data.secure_url,
        thumbnailUrl: isVideo ? res.data.secure_url.replace(/\.[^.]+$/, ".jpg") : "",
      }));

      toast.success("Media uploaded successfully!");
    } catch (err) {
      toast.error("Failed to upload media");
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
      const token = localStorage.getItem("adminToken");

      if (editingBanner) {
        await axios.put(`${ADMIN_API}/api/banners/${editingBanner._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Banner updated!");
      } else {
        await axios.post(`${ADMIN_API}/api/banners`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
      const token = localStorage.getItem("adminToken");
      await axios.delete(`${ADMIN_API}/api/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${ADMIN_API}/api/banners/${banner._id}`,
        { isActive: !banner.isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBanners();
      toast.success(`Banner ${!banner.isActive ? "activated" : "deactivated"}`);
    } catch (err) {
      toast.error("Failed to update banner");
    }
  };

  // Handle reorder
  const handleReorder = async (newOrder) => {
    setBanners(newOrder);

    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${ADMIN_API}/api/banners/reorder`,
        { orderedIds: newOrder.map((b) => b._id) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      toast.error("Failed to reorder");
      fetchBanners(); // Refetch on error
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
    });
    setEditingBanner(null);
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
      startDate: banner.startDate ? banner.startDate.split("T")[0] : "",
      endDate: banner.endDate ? banner.endDate.split("T")[0] : "",
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050509] text-white">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <AdminNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="md:ml-64 pt-20 flex items-center justify-center min-h-[80vh]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050509] text-white">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AdminNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="md:ml-64 pt-20 px-4 md:px-8 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HiOutlineSparkles className="text-emerald-500" />
              Promotional Banners
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Manage homepage carousel banners
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-medium transition-all"
          >
            <FaPlus /> Add Banner
          </button>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Total Banners</p>
              <p className="text-2xl font-bold text-white">{analytics.totalBanners}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm">Active</p>
              <p className="text-2xl font-bold text-emerald-400">{analytics.activeBanners}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm flex items-center gap-1">
                <FaEye className="text-xs" /> Total Views
              </p>
              <p className="text-2xl font-bold text-blue-400">{analytics.totalViews}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-gray-400 text-sm flex items-center gap-1">
                <FaMousePointer className="text-xs" /> CTR
              </p>
              <p className="text-2xl font-bold text-purple-400">{analytics.avgCTR}</p>
            </div>
          </div>
        )}

        {/* Banner List */}
        {banners.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <FaImage className="text-5xl text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Banners Yet</h3>
            <p className="text-gray-400 mb-4">Create your first promotional banner</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2 bg-emerald-600 rounded-xl font-medium"
            >
              Add Banner
            </button>
          </div>
        ) : (
          <Reorder.Group values={banners} onReorder={handleReorder} className="space-y-4">
            {banners.map((banner) => (
              <Reorder.Item key={banner._id} value={banner}>
                <motion.div
                  layout
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 hover:border-zinc-700 transition-all cursor-grab active:cursor-grabbing"
                >
                  {/* Drag Handle */}
                  <div className="text-gray-500 hover:text-white cursor-grab">
                    <FaGripVertical />
                  </div>

                  {/* Preview */}
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 relative">
                    {banner.mediaType === "video" ? (
                      <>
                        <img
                          src={banner.thumbnailUrl || banner.mediaUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <FaVideo className="text-white" />
                        </div>
                      </>
                    ) : (
                      <img
                        src={banner.mediaUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{banner.title}</h3>
                    <p className="text-sm text-gray-400 truncate">
                      {banner.description || "No description"}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FaEye /> {banner.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaMousePointer /> {banner.clicks}
                      </span>
                      {banner.link && (
                        <span className="flex items-center gap-1 text-blue-400">
                          <FaExternalLinkAlt /> Has link
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      banner.isActive
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {banner.isActive ? "Active" : "Inactive"}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(banner)}
                      className={`p-2 rounded-lg transition-all ${
                        banner.isActive
                          ? "text-emerald-400 hover:bg-emerald-500/20"
                          : "text-gray-400 hover:bg-gray-500/20"
                      }`}
                      title={banner.isActive ? "Deactivate" : "Activate"}
                    >
                      {banner.isActive ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
                    </button>
                    <button
                      onClick={() => openEditModal(banner)}
                      className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-all"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(banner._id)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-all"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                <h2 className="text-xl font-bold">
                  {editingBanner ? "Edit Banner" : "Create Banner"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-all"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-5">
                {/* Media Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Media (Image or Video) *
                  </label>
                  {formData.mediaUrl ? (
                    <div className="relative rounded-xl overflow-hidden bg-zinc-800">
                      {formData.mediaType === "video" ? (
                        <video
                          src={formData.mediaUrl}
                          className="w-full h-48 object-cover"
                          controls
                        />
                      ) : (
                        <img
                          src={formData.mediaUrl}
                          alt="Preview"
                          className="w-full h-48 object-cover"
                        />
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
                    <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-emerald-500 transition-all">
                      {uploading ? (
                        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <FaCloudUploadAlt className="text-4xl text-gray-500 mb-2" />
                          <p className="text-gray-400">Click to upload image or video</p>
                          <p className="text-xs text-gray-500">Max: 10MB image, 100MB video</p>
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

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    placeholder="50% Off Premium Plans"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    maxLength={100}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Limited time offer for new users..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                    rows={2}
                    maxLength={300}
                  />
                </div>

                {/* Link */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Link URL (optional)
                    </label>
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData((p) => ({ ...p, link: e.target.value }))}
                      placeholder="https://example.com/promo"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={formData.linkText}
                      onChange={(e) => setFormData((p) => ({ ...p, linkText: e.target.value }))}
                      placeholder="Learn More"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                      maxLength={30}
                    />
                  </div>
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Start Date (optional)
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      End Date (optional)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, isActive: !p.isActive }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      formData.isActive ? "bg-emerald-600" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        formData.isActive ? "translate-x-6" : ""
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-300">
                    Banner is {formData.isActive ? "active" : "inactive"}
                  </span>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-medium transition-all"
                  >
                    {editingBanner ? "Update Banner" : "Create Banner"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminBanners;
