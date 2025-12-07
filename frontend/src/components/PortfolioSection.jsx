import React, { useState, useEffect } from "react";
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
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import axios from "axios";

const PortfolioSection = () => {
  const { user, backendURL } = useAppContext();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalFile, setOriginalFile] = useState(null);
  const [editedFile, setEditedFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState(null);
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

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewURL = URL.createObjectURL(file);
    if (type === "original") {
      setOriginalFile(file);
      setOriginalPreview(previewURL);
    }
    if (type === "edited") {
      setEditedFile(file);
      setEditedPreview(previewURL);
    }
  };

  const clearFile = (type) => {
    if (type === "original") {
      setOriginalFile(null);
      setOriginalPreview(null);
    }
    if (type === "edited") {
      setEditedFile(null);
      setEditedPreview(null);
    }
  };

  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    if (!title || !description || !originalFile || !editedFile) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("originalClip", originalFile);
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
      setTitle("");
      setDescription("");
      setOriginalFile(null);
      setEditedFile(null);
      setOriginalPreview(null);
      setEditedPreview(null);
      setShowForm(false);
    } catch (err) {
      console.error("Error uploading portfolio:", err);
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
    } catch (err) {
      console.error("Error deleting portfolio:", err);
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
    setOriginalFile(null);
    setEditedFile(null);
    setOriginalPreview(null);
    setEditedPreview(null);
  };

  // File Upload Card Component
  const FileUploadCard = ({ type, label, description, file, preview, onFileChange, onClear }) => {
    const isOriginal = type === "original";
    const inputId = `file-${type}`;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOriginal
                ? "bg-gradient-to-br from-orange-400 to-red-500"
                : "bg-gradient-to-br from-green-400 to-emerald-500"
              }`}
          >
            {isOriginal ? <FaFilm className="text-white text-sm" /> : <FaImage className="text-white text-sm" />}
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{label}</h4>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>

        {!preview ? (
          <label
            htmlFor={inputId}
            className={`block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all hover:border-opacity-80 ${isOriginal
                ? "border-orange-300 bg-orange-50/50 hover:bg-orange-50"
                : "border-green-300 bg-green-50/50 hover:bg-green-50"
              }`}
          >
            <input
              id={inputId}
              type="file"
              accept="video/*,image/*"
              onChange={(e) => onFileChange(e, type)}
              className="hidden"
            />
            <FaCloudUploadAlt
              className={`text-4xl mx-auto mb-2 ${isOriginal ? "text-orange-400" : "text-green-400"}`}
            />
            <p className="text-sm font-medium text-gray-600">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-400 mt-1">MP4, MOV, WEBM, JPG, PNG (Max 100MB)</p>
          </label>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl overflow-hidden shadow-lg group"
          >
            {/* Preview Content */}
            <div className="relative h-40 bg-gray-900">
              {file?.type?.startsWith("video") ? (
                <>
                  <video
                    src={preview}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                      <FaPlay className="text-gray-700 ml-1" />
                    </div>
                  </div>
                </>
              ) : (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              )}

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute top-2 right-2 flex gap-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      openPreview(preview, file?.type?.startsWith("video") ? "video" : "image")
                    }
                    className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center text-gray-700 hover:bg-white"
                  >
                    <FaExpand className="text-sm" />
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onClear(type)}
                    className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white hover:bg-red-600"
                  >
                    <FaTimes className="text-sm" />
                  </motion.button>
                </div>
              </div>

              {/* Type Badge */}
              <div
                className={`absolute bottom-2 left-2 px-3 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1 ${isOriginal ? "bg-orange-500" : "bg-green-500"
                  }`}
              >
                {file?.type?.startsWith("video") ? <FaFilm /> : <FaImage />}
                {file?.type?.startsWith("video") ? "Video" : "Image"}
              </div>
            </div>

            {/* File Info */}
            <div className="p-3 bg-white border-t">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{file?.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file?.size / (1024 * 1024)).toFixed(2)} MB
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
    );
  };

  return (
    <div>
      {/* Add Portfolio Button */}
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
                  {/* Title Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Project Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Wedding Highlight Reel"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  {/* Description Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      placeholder="Describe your editing work, techniques used, and the transformation..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                      rows={3}
                      required
                    />
                  </div>

                  {/* File Upload Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Original File */}
                    <FileUploadCard
                      type="original"
                      label="Original Clip/Image"
                      description="Before editing (raw footage)"
                      file={originalFile}
                      preview={originalPreview}
                      onFileChange={handleFileChange}
                      onClear={clearFile}
                    />

                    {/* Edited File */}
                    <FileUploadCard
                      type="edited"
                      label="Edited Clip/Image"
                      description="After editing (final result)"
                      file={editedFile}
                      preview={editedPreview}
                      onFileChange={handleFileChange}
                      onClear={clearFile}
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading || !title || !description || !originalFile || !editedFile}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all ${loading || !title || !description || !originalFile || !editedFile
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl"
                      }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
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

      {/* Portfolio Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {Array.isArray(portfolios) &&
            portfolios.map((p, index) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-gray-100"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-bold text-lg text-gray-800 truncate">{p.title}</h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{p.description}</p>
                </div>

                {/* Media Comparison */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100">
                  {/* Original */}
                  <div
                    className="relative cursor-pointer group"
                    onClick={() =>
                      openPreview(p.originalClip, isVideo(p.originalClip) ? "video" : "image")
                    }
                  >
                    <div className="aspect-video bg-gray-200 overflow-hidden">
                      {isVideo(p.originalClip) ? (
                        <video src={p.originalClip} className="w-full h-full object-cover" muted />
                      ) : (
                        <img
                          src={p.originalClip}
                          alt="Original"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <FaExpand className="text-white text-xl" />
                    </div>
                    <span className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                      <FaFilm className="text-xs" /> Before
                    </span>
                  </div>

                  {/* Edited */}
                  <div
                    className="relative cursor-pointer group"
                    onClick={() =>
                      openPreview(p.editedClip, isVideo(p.editedClip) ? "video" : "image")
                    }
                  >
                    <div className="aspect-video bg-gray-200 overflow-hidden">
                      {isVideo(p.editedClip) ? (
                        <video src={p.editedClip} className="w-full h-full object-cover" muted />
                      ) : (
                        <img
                          src={p.editedClip}
                          alt="Edited"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <FaExpand className="text-white text-xl" />
                    </div>
                    <span className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                      <FaImage className="text-xs" /> After
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
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
            ))}
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
          <p className="text-gray-500 mb-6">Start showcasing your work by adding your first portfolio</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-green-600 font-medium hover:underline"
          >
            Add Your First Portfolio →
          </button>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
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
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
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
