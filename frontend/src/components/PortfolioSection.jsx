import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaTrash,
  FaFilm,
  FaImage,
  FaTimes,
  FaCloudUploadAlt,
  FaPlay,
  FaExpand,
  FaCheck,
  FaExclamationTriangle,
  FaPause,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaHeart,
  FaShare,
  FaVolumeUp,
  FaVolumeMute,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const PortfolioSection = () => {
  const { user, backendURL } = useAppContext();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalFiles, setOriginalFiles] = useState([]);
  const [originalPreviews, setOriginalPreviews] = useState([]);
  const [editedFile, setEditedFile] = useState(null);
  const [editedPreview, setEditedPreview] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingPortfolios, setFetchingPortfolios] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Reels Popup State
  const [showReelsPopup, setShowReelsPopup] = useState(false);
  const [reelsPortfolio, setReelsPortfolio] = useState(null);
  const [reelsIndex, setReelsIndex] = useState(0);
  const [reelsMuted, setReelsMuted] = useState(false);
  const reelsVideoRef = useRef(null);

  const [showUploadPreviewModal, setShowUploadPreviewModal] = useState(false);
  const [uploadPreviewFile, setUploadPreviewFile] = useState(null);
  const [uploadPreviewType, setUploadPreviewType] = useState("");

  const fetchPortfolios = async () => {
    if (!user) return;
    setFetchingPortfolios(true);
    try {
      const { data } = await axios.get(`${backendURL}/api/portfolio`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setPortfolios(Array.isArray(data) ? data : data.portfolios || []);
    } catch (err) {
      toast.error("Failed to load portfolios");
      setPortfolios([]);
    } finally {
      setFetchingPortfolios(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, [user]);

  const handleOriginalFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const newFiles = files.slice(0, 5 - originalFiles.length);
    const newPreviews = newFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" : "image",
    }));
    setOriginalFiles([...originalFiles, ...newFiles]);
    setOriginalPreviews([...originalPreviews, ...newPreviews]);
  };

  const removeOriginalFile = (index) => {
    const newFiles = [...originalFiles];
    const newPreviews = [...originalPreviews];
    URL.revokeObjectURL(newPreviews[index].url);
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setOriginalFiles(newFiles);
    setOriginalPreviews(newPreviews);
  };

  const handleEditedFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditedFile(file);
    setEditedPreview(URL.createObjectURL(file));
  };

  const clearEditedFile = () => {
    if (editedPreview) URL.revokeObjectURL(editedPreview);
    setEditedFile(null);
    setEditedPreview(null);
  };

  const openUploadPreview = (url, type, e) => {
    e?.stopPropagation?.();
    setUploadPreviewFile(url);
    setUploadPreviewType(type);
    setShowUploadPreviewModal(true);
  };

  const handleAddPortfolio = async (e) => {
    e.preventDefault();

    if (!title || title.length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }
    if (!description || description.length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }
    if (originalFiles.length === 0) {
      toast.error("Please add at least one original clip/image");
      return;
    }
    if (!editedFile) {
      toast.error("Please add an edited clip/image");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    originalFiles.forEach((file) => formData.append("originalClip", file));
    formData.append("editedClip", editedFile);

    try {
      setLoading(true);
      toast.info("Uploading portfolio...", { autoClose: false, toastId: "uploading" });

      const { data } = await axios.post(`${backendURL}/api/portfolio`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user?.token}`,
        },
        withCredentials: true,
      });

      toast.dismiss("uploading");
      toast.success("🎉 Portfolio uploaded successfully!");
      setPortfolios([data.portfolio, ...portfolios]);
      closeModal();
    } catch (err) {
      toast.dismiss("uploading");
      const errorMsg = err.response?.data?.message || err.message || "Failed to upload";
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id, e) => {
    e?.stopPropagation?.();
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeletePortfolio = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${backendURL}/api/portfolio/${deleteId}`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setPortfolios(portfolios.filter((p) => p._id !== deleteId));
      setShowDeleteModal(false);
      setDeleteId(null);
      toast.success("Portfolio deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const isVideo = (url) =>
    url?.endsWith(".mp4") || url?.endsWith(".mov") || url?.endsWith(".webm");

  const closeModal = () => {
    setShowForm(false);
    setTitle("");
    setDescription("");
    originalPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    setOriginalFiles([]);
    setOriginalPreviews([]);
    if (editedPreview) URL.revokeObjectURL(editedPreview);
    setEditedFile(null);
    setEditedPreview(null);
  };

  const getAllClips = (portfolio) => {
    const clips = [];
    // Add edited first
    if (portfolio.editedClip) {
      clips.push({ url: portfolio.editedClip, type: "edited" });
    }
    // Add originals
    if (portfolio.originalClips?.length > 0) {
      portfolio.originalClips.forEach((url) => clips.push({ url, type: "original" }));
    } else if (portfolio.originalClip) {
      clips.push({ url: portfolio.originalClip, type: "original" });
    }
    return clips;
  };

  // Open Reels Popup
  const openReelsPopup = (portfolio, startIndex = 0) => {
    setReelsPortfolio(portfolio);
    setReelsIndex(startIndex);
    setShowReelsPopup(true);
  };

  // 3D Icon Component
  const Icon3D = ({ icon: Icon, color, size = "text-2xl" }) => (
    <motion.div
      whileHover={{ scale: 1.2, rotateY: 15 }}
      className={`${size} ${color} drop-shadow-lg`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <Icon />
    </motion.div>
  );

  // ============ PREMIUM PORTFOLIO CARD ============
  const PremiumCard = ({ portfolio, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);
    const allClips = getAllClips(portfolio);
    const coverClip = allClips[0]?.url;
    const coverIsVideo = isVideo(coverClip);

    const handleMouseEnter = () => {
      setIsHovered(true);
      if (coverIsVideo && videoRef.current) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      if (coverIsVideo && videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
        whileHover={{ y: -12, scale: 1.03 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => openReelsPopup(portfolio)}
        className="relative rounded-3xl overflow-hidden cursor-pointer group"
        style={{
          background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)",
          boxShadow: isHovered
            ? "0 25px 50px -12px rgba(34, 197, 94, 0.4)"
            : "0 10px 40px -10px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Animated Gradient Border */}
        <motion.div
          className="absolute inset-0 rounded-3xl p-[3px] z-0"
          animate={{
            background: [
              "linear-gradient(0deg, #22c55e, #10b981, #06b6d4)",
              "linear-gradient(90deg, #10b981, #06b6d4, #8b5cf6)",
              "linear-gradient(180deg, #06b6d4, #8b5cf6, #ec4899)",
              "linear-gradient(270deg, #8b5cf6, #ec4899, #22c55e)",
              "linear-gradient(360deg, #22c55e, #10b981, #06b6d4)",
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-full h-full bg-white rounded-[22px]" />
        </motion.div>

        {/* Content Container */}
        <div className="relative z-10 p-1">
          {/* Media Container */}
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-green-100 to-emerald-50">
            {coverIsVideo ? (
              <video
                ref={videoRef}
                src={coverClip}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={coverClip}
                alt={portfolio.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Play Button (for videos) */}
            {coverIsVideo && !isPlaying && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl"
                >
                  <FaPlay className="text-white text-xl ml-1" />
                </motion.div>
              </motion.div>
            )}

            {/* Top Badges */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
              {/* Clip Count */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg"
              >
                <Icon3D icon={FaFilm} color="text-orange-500" size="text-sm" />
                <span className="text-xs font-bold text-gray-700">
                  {allClips.length} clips
                </span>
              </motion.div>

              {/* Actions */}
              <motion.button
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => confirmDelete(portfolio._id, e)}
                className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg text-red-500 hover:bg-red-50"
              >
                <FaTrash className="text-sm" />
              </motion.button>
            </div>

            {/* Bottom Info (on hover) */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
              className="absolute bottom-3 left-3 right-3"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <FaPlay className="text-white text-xs ml-0.5" />
                </motion.div>
                <span className="text-white text-sm font-medium">Click to view</span>
              </div>
            </motion.div>
          </div>

          {/* Info Section */}
          <div className="p-4 bg-white rounded-b-2xl">
            <h3 className="font-bold text-gray-800 text-lg truncate">{portfolio.title}</h3>
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{portfolio.description}</p>

            {/* Tags */}
            <div className="flex items-center gap-2 mt-3">
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium"
              >
                <Icon3D icon={FaImage} color="text-green-500" size="text-xs" />
                Edited
              </motion.span>
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium"
              >
                <Icon3D icon={FaFilm} color="text-orange-500" size="text-xs" />
                {allClips.length - 1} Original{allClips.length > 2 ? "s" : ""}
              </motion.span>
            </div>

            {/* Date */}
            <p className="text-gray-400 text-xs mt-3">
              {new Date(portfolio.uploadedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  // ============ INSTAGRAM REELS POPUP ============
  const ReelsPopup = ({ portfolio, initialIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const videoRef = useRef(null);
    const allClips = getAllClips(portfolio);
    const currentClip = allClips[currentIndex];
    const currentIsVideo = isVideo(currentClip?.url);

    useEffect(() => {
      if (currentIsVideo && videoRef.current) {
        if (isPlaying) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
      }
    }, [isPlaying, currentIndex]);

    const nextClip = () => {
      setCurrentIndex((prev) => (prev + 1) % allClips.length);
      setIsPlaying(true);
    };

    const prevClip = () => {
      setCurrentIndex((prev) => (prev - 1 + allClips.length) % allClips.length);
      setIsPlaying(true);
    };

    const togglePlay = () => setIsPlaying(!isPlaying);
    const toggleMute = () => setIsMuted(!isMuted);

    // Handle swipe
    const handleDragEnd = (e, { offset, velocity }) => {
      if (Math.abs(offset.y) > 100 || Math.abs(velocity.y) > 500) {
        if (offset.y > 0) prevClip();
        else nextClip();
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
        onClick={onClose}
      >
        {/* Close Button */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white z-10"
        >
          <FaTimes className="text-xl" />
        </motion.button>

        {/* Main Content */}
        <div
          className="relative w-full max-w-lg h-full max-h-[90vh] mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Clip Container */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="relative w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 to-black"
          >
            {currentIsVideo ? (
              <video
                ref={videoRef}
                src={currentClip?.url}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted={isMuted}
                autoPlay
                onClick={togglePlay}
              />
            ) : (
              <img
                src={currentClip?.url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}

            {/* Play/Pause Overlay */}
            {currentIsVideo && !isPlaying && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/30"
                onClick={togglePlay}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center"
                >
                  <FaPlay className="text-white text-3xl ml-1" />
                </motion.div>
              </motion.div>
            )}

            {/* Top Gradient */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />

            {/* Bottom Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />

            {/* Type Badge */}
            <motion.div
              key={currentIndex}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`absolute top-6 left-6 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg ${currentClip?.type === "original"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                  : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                }`}
            >
              {currentClip?.type === "original" ? (
                <>
                  <FaFilm /> ORIGINAL
                </>
              ) : (
                <>
                  <FaImage /> EDITED
                </>
              )}
            </motion.div>

            {/* Progress Dots */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1">
              {allClips.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1 rounded-full transition-all ${i === currentIndex ? "bg-white w-8" : "bg-white/40 w-4"
                    }`}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-32 flex flex-col gap-4">
              {/* Mute Button */}
              {currentIsVideo && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleMute}
                  className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white"
                >
                  {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </motion.button>
              )}

              {/* Like Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white"
              >
                <FaHeart />
              </motion.button>

              {/* Share Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white"
              >
                <FaShare />
              </motion.button>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-6 left-6 right-20">
              <h3 className="text-white font-bold text-xl">{portfolio.title}</h3>
              <p className="text-white/70 text-sm mt-2 line-clamp-2">
                {portfolio.description}
              </p>
              <p className="text-white/50 text-xs mt-2">
                Clip {currentIndex + 1} of {allClips.length}
              </p>
            </div>

            {/* Swipe Hint */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/50 text-xs flex flex-col items-center"
            >
              <FaChevronLeft className="rotate-90" />
              <span>Swipe for more</span>
            </motion.div>
          </motion.div>

          {/* Navigation Arrows */}
          {allClips.length > 1 && (
            <>
              <motion.button
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={prevClip}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white"
              >
                <FaChevronLeft className="text-lg" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={nextClip}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white"
              >
                <FaChevronRight className="text-lg" />
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div>
      {/* Add Button */}
      <motion.button
        whileHover={{ scale: 1.02, y: -2, boxShadow: "0 20px 40px -10px rgba(34, 197, 94, 0.4)" }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowForm(true)}
        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg"
      >
        <motion.div
          animate={{ rotate: [0, 90, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center"
        >
          <FaPlus className="text-sm" />
        </motion.div>
        Add New Portfolio
      </motion.button>

      {/* Add Portfolio Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl relative shadow-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white z-10">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  onClick={closeModal}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
                >
                  <FaTimes />
                </motion.button>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Icon3D icon={FaPlus} color="text-white" />
                  Add New Portfolio
                </h2>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                <form className="space-y-6" onSubmit={handleAddPortfolio}>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Project Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Wedding Highlight Reel"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                      <span className="text-gray-400 font-normal ml-2">({description.length}/500)</span>
                    </label>
                    <textarea
                      placeholder="Describe your editing work..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon3D icon={FaFilm} color="text-orange-500" />
                      <div>
                        <h4 className="font-semibold text-gray-800">Original Clips</h4>
                        <p className="text-xs text-gray-500">Max 5 files</p>
                      </div>
                    </div>

                    {originalPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {originalPreviews.map((preview, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden group cursor-pointer"
                            onClick={(e) => openUploadPreview(preview.url, preview.type, e)}
                          >
                            {preview.type === "video" ? (
                              <video src={preview.url} className="w-full h-full object-cover" />
                            ) : (
                              <img src={preview.url} alt="" className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <FaEye className="text-white text-xl" />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeOriginalFile(index);
                              }}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {originalPreviews.length < 5 && (
                      <label className="block border-2 border-dashed border-orange-300 bg-orange-50/50 hover:bg-orange-50 rounded-2xl p-6 text-center cursor-pointer">
                        <input type="file" accept="video/*,image/*" multiple onChange={handleOriginalFileChange} className="hidden" />
                        <FaCloudUploadAlt className="text-4xl text-orange-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload</p>
                      </label>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon3D icon={FaImage} color="text-green-500" />
                      <h4 className="font-semibold text-gray-800">Edited Clip</h4>
                    </div>

                    {!editedPreview ? (
                      <label className="block border-2 border-dashed border-green-300 bg-green-50/50 hover:bg-green-50 rounded-2xl p-6 text-center cursor-pointer">
                        <input type="file" accept="video/*,image/*" onChange={handleEditedFileChange} className="hidden" />
                        <FaCloudUploadAlt className="text-4xl text-green-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload</p>
                      </label>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
                        onClick={(e) => openUploadPreview(editedPreview, editedFile?.type?.startsWith("video") ? "video" : "image", e)}
                      >
                        <div className="relative h-40 bg-gray-100">
                          {editedFile?.type?.startsWith("video") ? (
                            <video src={editedPreview} className="w-full h-full object-cover" />
                          ) : (
                            <img src={editedPreview} alt="" className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <FaEye className="text-white text-2xl" />
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearEditedFile();
                            }}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white"
                          >
                            <FaTimes className="text-sm" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading || title.length < 3 || description.length < 10 || originalFiles.length === 0 || !editedFile}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 ${loading || title.length < 3 || description.length < 10 || originalFiles.length === 0 || !editedFile
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                      }`}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <FaCloudUploadAlt className="text-xl" />
                        Upload Portfolio
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Preview Modal */}
      <AnimatePresence>
        {showUploadPreviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex justify-center items-center z-[60] p-4"
            onClick={() => setShowUploadPreviewModal(false)}
          >
            <motion.button onClick={() => setShowUploadPreviewModal(false)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white">
              <FaTimes />
            </motion.button>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              {uploadPreviewType === "video" ? (
                <video src={uploadPreviewFile} controls autoPlay className="w-full max-h-[80vh] object-contain rounded-2xl" />
              ) : (
                <img src={uploadPreviewFile} alt="" className="w-full max-h-[80vh] object-contain rounded-2xl" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portfolio Grid */}
      <div className="mt-8">
        {fetchingPortfolios ? (
          <div className="flex justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full"
            />
          </div>
        ) : portfolios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {portfolios.map((p, i) => (
              <PremiumCard key={p._id} portfolio={p} index={i} />
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl border-2 border-dashed border-green-200">
            <Icon3D icon={FaFilm} color="text-green-500" size="text-5xl" />
            <h3 className="text-xl font-bold text-gray-700 mt-4 mb-2">No portfolios yet</h3>
            <p className="text-gray-500 mb-6">Showcase your amazing work</p>
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowForm(true)} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg">
              Add Your First Portfolio
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Reels Popup */}
      <AnimatePresence>
        {showReelsPopup && reelsPortfolio && (
          <ReelsPopup portfolio={reelsPortfolio} initialIndex={reelsIndex} onClose={() => setShowReelsPopup(false)} />
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationTriangle className="text-red-500 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Portfolio?</h3>
              <p className="text-gray-500 mb-6">This cannot be undone.</p>
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold">
                  Cancel
                </motion.button>
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleDeletePortfolio} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold">
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PortfolioSection;
