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

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // File preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewType, setPreviewType] = useState("");

  // Upload file preview modal (for viewing selected files before upload)
  const [showUploadPreviewModal, setShowUploadPreviewModal] = useState(false);
  const [uploadPreviewFile, setUploadPreviewFile] = useState(null);
  const [uploadPreviewType, setUploadPreviewType] = useState("");

  const fetchPortfolios = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get(`${backendURL}/api/portfolio`, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      setPortfolios(Array.isArray(data) ? data : data.portfolios || []);
    } catch (err) {
      console.error("Error fetching portfolios:", err);
      setPortfolios([]);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, [user]);

  // Handle multiple original files
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

  // Open upload preview modal
  const openUploadPreview = (url, type, e) => {
    e?.stopPropagation?.();
    setUploadPreviewFile(url);
    setUploadPreviewType(type);
    setShowUploadPreviewModal(true);
  };

  const handleAddPortfolio = async (e) => {
    e.preventDefault();

    // Validation
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

    originalFiles.forEach((file) => {
      formData.append("originalClip", file);
    });

    formData.append("editedClip", editedFile);

    try {
      setLoading(true);
      const { data } = await axios.post(`${backendURL}/api/portfolio`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user?.token}`,
        },
        withCredentials: true,
      });
      setPortfolios([data.portfolio, ...portfolios]);
      toast.success("Portfolio uploaded successfully!");
      closeModal();
    } catch (err) {
      console.error("Error uploading portfolio:", err);
      const errorMsg = err.response?.data?.message || "Failed to upload portfolio";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeletePortfolio = async () => {
    if (!deleteId) return;

    try {
      await axios.delete(`${backendURL}/api/portfolio/${deleteId}`, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      setPortfolios(portfolios.filter((p) => p._id !== deleteId));
      setShowDeleteModal(false);
      setDeleteId(null);
      toast.success("Portfolio deleted successfully");
    } catch (err) {
      console.error("Error deleting portfolio:", err);
      toast.error("Failed to delete portfolio");
    }
  };

  const isVideo = (url) =>
    url?.endsWith(".mp4") || url?.endsWith(".mov") || url?.endsWith(".webm");

  const openPreview = (fileUrl, type) => {
    setPreviewFile(fileUrl);
    setPreviewType(type);
    setShowPreviewModal(true);
  };

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

  const getAllOriginalClips = (portfolio) => {
    const clips = [];
    if (portfolio.originalClips && portfolio.originalClips.length > 0) {
      clips.push(...portfolio.originalClips);
    } else if (portfolio.originalClip) {
      clips.push(portfolio.originalClip);
    }
    return clips;
  };

  // Video Player Component
  const VideoPlayer = ({ src, className }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);

    const togglePlay = (e) => {
      e.stopPropagation();
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    };

    return (
      <div className="relative group">
        <video
          ref={videoRef}
          src={src}
          className={className}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
        />
        <motion.div
          className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity ${isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
            }`}
          onClick={togglePlay}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
          >
            {isPlaying ? (
              <FaPause className="text-gray-700 text-lg" />
            ) : (
              <FaPlay className="text-gray-700 text-lg ml-1" />
            )}
          </motion.button>
        </motion.div>
      </div>
    );
  };

  // Carousel Component
  const OriginalClipsCarousel = ({ clips, onPreview }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (clips.length === 0) return null;

    const nextSlide = (e) => {
      e.stopPropagation();
      setCurrentIndex((prev) => (prev + 1) % clips.length);
    };

    const prevSlide = (e) => {
      e.stopPropagation();
      setCurrentIndex((prev) => (prev - 1 + clips.length) % clips.length);
    };

    return (
      <div className="relative">
        <div className="aspect-video bg-gray-200 overflow-hidden">
          {isVideo(clips[currentIndex]) ? (
            <VideoPlayer
              src={clips[currentIndex]}
              className="w-full h-full object-cover cursor-pointer"
            />
          ) : (
            <img
              src={clips[currentIndex]}
              alt="Original"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => onPreview(clips[currentIndex], "image")}
            />
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onPreview(clips[currentIndex], isVideo(clips[currentIndex]) ? "video" : "image");
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center text-white transition-colors"
        >
          <FaExpand className="text-sm" />
        </motion.button>

        {clips.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
            >
              <FaChevronLeft className="text-sm" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
            >
              <FaChevronRight className="text-sm" />
            </button>
          </>
        )}

        <span className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
          <FaFilm className="text-xs" /> Before{" "}
          {clips.length > 1 && `(${currentIndex + 1}/${clips.length})`}
        </span>
      </div>
    );
  };

  return (
    <div>
      {/* Add Button */}
      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowForm(true)}
        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
      >
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <FaPlus className="text-sm" />
        </div>
        Add New Portfolio
      </motion.button>

      {/* Add Portfolio Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-3xl w-full max-w-2xl relative shadow-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white z-10">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModal}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <FaTimes className="text-lg" />
                </motion.button>
                <h2 className="text-2xl font-bold">Add New Portfolio</h2>
                <p className="text-white/80 text-sm mt-1">
                  Showcase your editing skills with before & after
                </p>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                <form className="space-y-6" onSubmit={handleAddPortfolio}>
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Project Title <span className="text-red-500">*</span>
                      <span className="text-gray-400 font-normal ml-2">(min 3 characters)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Wedding Highlight Reel"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                      <span className="text-gray-400 font-normal ml-2">
                        ({description.length}/500, min 10 characters)
                      </span>
                    </label>
                    <textarea
                      placeholder="Describe your editing work, techniques used, and the transformation..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Original Clips */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                        <FaFilm className="text-white text-sm" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Original Clips/Images</h4>
                        <p className="text-xs text-gray-500">
                          Raw footage before editing (Max 5 files)
                        </p>
                      </div>
                    </div>

                    {originalPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {originalPreviews.map((preview, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden group cursor-pointer"
                            onClick={(e) => openUploadPreview(preview.url, preview.type, e)}
                          >
                            {preview.type === "video" ? (
                              <video src={preview.url} className="w-full h-full object-cover" />
                            ) : (
                              <img
                                src={preview.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                            {/* View Button */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <FaEye className="text-white text-xl" />
                            </div>
                            {/* Remove Button */}
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeOriginalFile(index);
                              }}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white z-10"
                            >
                              <FaTimes className="text-xs" />
                            </motion.button>
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                              {preview.type === "video" ? (
                                <FaFilm className="inline" />
                              ) : (
                                <FaImage className="inline" />
                              )}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {originalPreviews.length < 5 && (
                      <label className="block border-2 border-dashed border-orange-300 bg-orange-50/50 hover:bg-orange-50 rounded-2xl p-6 text-center cursor-pointer transition-all">
                        <input
                          type="file"
                          accept="video/*,image/*"
                          multiple
                          onChange={handleOriginalFileChange}
                          className="hidden"
                        />
                        <FaCloudUploadAlt className="text-4xl text-orange-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-600">
                          {originalPreviews.length === 0
                            ? "Click to upload original clips/images"
                            : `Add more files (${5 - originalPreviews.length} remaining)`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          MP4, MOV, WEBM, JPG, PNG (Max 100MB each)
                        </p>
                      </label>
                    )}
                  </div>

                  {/* Edited Clip */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                        <FaImage className="text-white text-sm" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Edited Clip/Image</h4>
                        <p className="text-xs text-gray-500">Final result after your editing</p>
                      </div>
                    </div>

                    {!editedPreview ? (
                      <label className="block border-2 border-dashed border-green-300 bg-green-50/50 hover:bg-green-50 rounded-2xl p-6 text-center cursor-pointer transition-all">
                        <input
                          type="file"
                          accept="video/*,image/*"
                          onChange={handleEditedFileChange}
                          className="hidden"
                        />
                        <FaCloudUploadAlt className="text-4xl text-green-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-600">
                          Click to upload final result
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          MP4, MOV, WEBM, JPG, PNG (Max 100MB)
                        </p>
                      </label>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
                        onClick={(e) =>
                          openUploadPreview(
                            editedPreview,
                            editedFile?.type?.startsWith("video") ? "video" : "image",
                            e
                          )
                        }
                      >
                        <div className="relative h-40 bg-gray-900">
                          {editedFile?.type?.startsWith("video") ? (
                            <video src={editedPreview} className="w-full h-full object-cover" />
                          ) : (
                            <img
                              src={editedPreview}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                          {/* View Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <FaEye className="text-white text-2xl" />
                          </div>
                          {/* Remove Button */}
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              clearEditedFile();
                            }}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white z-10"
                          >
                            <FaTimes className="text-sm" />
                          </motion.button>
                          {/* Type Badge */}
                          <div className="absolute bottom-2 left-2 px-3 py-1 bg-green-500 rounded-full text-xs font-medium text-white flex items-center gap-1">
                            {editedFile?.type?.startsWith("video") ? <FaFilm /> : <FaImage />}
                            {editedFile?.type?.startsWith("video") ? "Video" : "Image"}
                          </div>
                        </div>
                        <div className="p-3 bg-white border-t">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {editedFile?.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(editedFile?.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <FaCheck className="text-green-600 text-xs" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={
                      loading ||
                      !title ||
                      title.length < 3 ||
                      !description ||
                      description.length < 10 ||
                      originalFiles.length === 0 ||
                      !editedFile
                    }
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all ${loading ||
                        !title ||
                        title.length < 3 ||
                        !description ||
                        description.length < 10 ||
                        originalFiles.length === 0 ||
                        !editedFile
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl"
                      }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading {originalFiles.length + 1} files...
                      </>
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

      {/* Upload Preview Modal (for viewing selected files) */}
      <AnimatePresence>
        {showUploadPreviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex justify-center items-center z-[60] p-4"
            onClick={() => setShowUploadPreviewModal(false)}
          >
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowUploadPreviewModal(false)}
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            >
              <FaTimes className="text-xl" />
            </motion.button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {uploadPreviewType === "video" ? (
                <video
                  src={uploadPreviewFile}
                  controls
                  autoPlay
                  className="w-full max-h-[80vh] object-contain rounded-2xl"
                />
              ) : (
                <img
                  src={uploadPreviewFile}
                  alt="Preview"
                  className="w-full max-h-[80vh] object-contain rounded-2xl"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portfolio Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {Array.isArray(portfolios) &&
            portfolios.map((p, index) => {
              const originalClips = getAllOriginalClips(p);

              return (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-gray-100"
                >
                  <div className="p-5 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800 truncate">{p.title}</h3>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{p.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100">
                    <OriginalClipsCarousel clips={originalClips} onPreview={openPreview} />

                    <div className="relative group">
                      <div className="aspect-video bg-gray-200 overflow-hidden">
                        {isVideo(p.editedClip) ? (
                          <VideoPlayer
                            src={p.editedClip}
                            className="w-full h-full object-cover cursor-pointer"
                          />
                        ) : (
                          <img
                            src={p.editedClip}
                            alt="Edited"
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => openPreview(p.editedClip, "image")}
                          />
                        )}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          openPreview(p.editedClip, isVideo(p.editedClip) ? "video" : "image")
                        }
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FaExpand className="text-sm" />
                      </motion.button>
                      <span className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                        <FaImage className="text-xs" /> After
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex justify-between items-center bg-gray-50">
                    <span className="text-xs text-gray-400">
                      {new Date(p.uploadedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => confirmDelete(p._id)}
                      className="w-9 h-9 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-500 hover:text-red-600 transition-colors"
                    >
                      <FaTrash className="text-sm" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {portfolios.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaImage className="text-gray-400 text-3xl" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No portfolio items yet</h3>
          <p className="text-gray-500 mb-6">
            Start showcasing your work by adding your first portfolio
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="text-green-600 font-medium hover:underline"
          >
            Add Your First Portfolio →
          </button>
        </motion.div>
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationTriangle className="text-red-500 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Portfolio?</h3>
              <p className="text-gray-500 mb-6">
                This action cannot be undone. Your portfolio item will be permanently removed.
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeletePortfolio}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex justify-center items-center z-50 p-4"
            onClick={() => setShowPreviewModal(false)}
          >
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            >
              <FaTimes className="text-xl" />
            </motion.button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {previewType === "video" ? (
                <video
                  src={previewFile}
                  controls
                  autoPlay
                  className="w-full max-h-[85vh] object-contain rounded-2xl"
                />
              ) : (
                <img
                  src={previewFile}
                  alt="Preview"
                  className="w-full max-h-[85vh] object-contain rounded-2xl"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PortfolioSection;
