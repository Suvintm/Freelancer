import React, { useState, useEffect } from "react";
import { FaFilm, FaImage, FaTimes } from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const PublicPortfolio = ({ userId }) => {
  const { backendURL } = useAppContext();
  const [portfolios, setPortfolios] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewType, setPreviewType] = useState("");

  // Fetch portfolios
  const fetchPortfolios = async () => {
    if (!userId) return;
    try {
      const { data } = await axios.get(
        `${backendURL}/api/portfolio/user/${userId}`
      );
      setPortfolios(data);
    } catch (err) {
      console.error("Error fetching public portfolios:", err);
      setPortfolios([]);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, [userId]);

  // Check video
  const isVideo = (url) =>
    url?.endsWith(".mp4") || url?.endsWith(".mov") || url?.endsWith(".webm");

  // Modal preview
  const openPreview = (fileUrl, type) => {
    setPreviewFile(fileUrl);
    setPreviewType(type);
    setShowPreviewModal(true);
  };

  return (
    <div className="p-6 min-h-screen bg-[#020617] text-white">
      <h2 className="text-3xl font-bold mb-6 text-white tracking-wide">
        Portfolio Showcase
      </h2>

      {portfolios.length === 0 ? (
        <p className="text-gray-400 text-center py-10">
          No portfolios available yet.
        </p>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {portfolios.map((p) => (
            <motion.div
              key={p._id}
              layout
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-[#050816] rounded-3xl border border-white/10 shadow-xl 
                         hover:shadow-[0_0_40px_rgba(20,99,255,0.3)] overflow-hidden 
                         transition-all duration-300"
            >
              {/* Title + Description */}
              <div className="p-5 border-b border-white/10">
                <h3 className="font-bold text-xl text-white truncate">
                  {p.title}
                </h3>
                <p className="text-gray-400 mt-1 text-sm line-clamp-2">
                  {p.description}
                </p>
              </div>

              {/* Clips Section */}
              <div className="flex flex-col md:flex-row gap-3 p-4">
                {/* Original */}
                {p.originalClip && (
                  <div
                    className="relative group w-full md:w-1/2 rounded-2xl overflow-hidden cursor-pointer 
                               bg-[#0B1220] border border-white/10"
                    onClick={() =>
                      openPreview(
                        p.originalClip,
                        isVideo(p.originalClip) ? "video" : "image"
                      )
                    }
                  >
                    {isVideo(p.originalClip) ? (
                      <video
                        src={p.originalClip}
                        className="w-full h-40 object-cover opacity-90 group-hover:opacity-100 transition"
                        muted
                      />
                    ) : (
                      <img
                        src={p.originalClip}
                        alt="Original"
                        className="w-full h-40 object-cover opacity-90 group-hover:opacity-100 transition"
                      />
                    )}

                    {/* Badge */}
                    <span
                      className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs 
                                 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-lg"
                    >
                      <FaFilm /> Original
                    </span>
                  </div>
                )}

                {/* Edited */}
                {p.editedClip && (
                  <div
                    className="relative group w-full md:w-1/2 rounded-2xl overflow-hidden cursor-pointer 
                               bg-[#0B1220] border border-white/10"
                    onClick={() =>
                      openPreview(
                        p.editedClip,
                        isVideo(p.editedClip) ? "video" : "image"
                      )
                    }
                  >
                    {isVideo(p.editedClip) ? (
                      <video
                        src={p.editedClip}
                        className="w-full h-40 object-cover opacity-90 group-hover:opacity-100 transition"
                        muted
                      />
                    ) : (
                      <img
                        src={p.editedClip}
                        alt="Edited"
                        className="w-full h-40 object-cover opacity-90 group-hover:opacity-100 transition"
                      />
                    )}

                    {/* Badge */}
                    <span
                      className="absolute top-3 left-3 bg-green-600/80 text-white text-xs 
                                 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-lg"
                    >
                      <FaImage /> Edited
                    </span>
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="p-4 text-xs text-gray-400 border-t border-white/10">
                Uploaded:{" "}
                {new Date(p.uploadedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ---------------- MODAL PREVIEW ---------------- */}
      <AnimatePresence>
        {showPreviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-50 p-4"
            onClick={() => setShowPreviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative w-full max-w-4xl rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(20,99,255,0.4)] border border-white/10 bg-[#050816]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                className="absolute top-5 right-5 w-10 h-10 bg-white/10 rounded-xl 
                           flex items-center justify-center text-white hover:bg-white/20 transition"
                onClick={() => setShowPreviewModal(false)}
              >
                <FaTimes className="text-lg" />
              </button>

              {/* Media */}
              <div className="p-6">
                {previewType === "video" ? (
                  <video
                    src={previewFile}
                    controls
                    autoPlay
                    className="w-full max-h-[80vh] object-contain rounded-2xl"
                  />
                ) : (
                  <img
                    src={previewFile}
                    alt="Preview"
                    className="w-full max-h-[80vh] object-contain rounded-2xl"
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicPortfolio;
