import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaTrash,
  FaFilm,
  FaImage,
  FaTimes,
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
  FaGlobe,
  FaComment,
  FaRegCheckCircle,
} from "react-icons/fa";
import { 
  HiOutlineSquare2Stack, 
  HiOutlineCheckCircle, 
  HiOutlinePlusCircle,
  HiOutlineEyeSlash 
} from "react-icons/hi2";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import ReelPreviewModal from "./ReelPreviewModal";

const PortfolioSection = ({ portfolios: initialPortfolios, isPublic = false, profileOwner = null }) => {
  const { user, backendURL } = useAppContext();
  const navigate = useNavigate();

  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingPortfolios, setFetchingPortfolios] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showIncompleteProfileModal, setShowIncompleteProfileModal] = useState(false);
  const [showConfirmPublishModal, setShowConfirmPublishModal] = useState(false);
  const [portfolioToPublish, setPortfolioToPublish] = useState(null);

  // Reels Popup State
  const [showReelsPopup, setShowReelsPopup] = useState(false);
  const [reelsIndex, setReelsIndex] = useState(0);
  const [reelsMuted, setReelsMuted] = useState(false);
  const reelsVideoRef = useRef(null);

  const fetchPortfolios = async () => {
    if (!user) return;
    setFetchingPortfolios(true);
    try {
      const { data } = await axios.get(`${backendURL}/api/portfolio`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      let portfoliosData = Array.isArray(data) ? data : data.portfolios || [];

      // Fetch engagement metrics for each portfolio
      const portfoliosWithMetrics = await Promise.all(portfoliosData.map(async (p) => {
        try {
          const { data: checkData } = await axios.get(
            `${backendURL}/api/reels/check/${p._id}`,
            { headers: { Authorization: `Bearer ${user?.token}` } }
          );

          if (checkData.isPublished && checkData.reelId) {
            const { data: reelData } = await axios.get(
              `${backendURL}/api/reels/${checkData.reelId}`
            );
            return {
              ...p,
              isPublished: true,
              reelId: checkData.reelId,
              likesCount: reelData.reel.likesCount || 0,
              viewsCount: reelData.reel.viewsCount || 0,
              commentsCount: reelData.reel.commentsCount || 0
            };
          }
          return { ...p, isPublished: false };
        } catch (e) {
          return p;
        }
      }));

      setPortfolios(portfoliosWithMetrics);
    } catch (err) {
      toast.error("Failed to load portfolios");
      setPortfolios([]);
    } finally {
      setFetchingPortfolios(false);
    }
  };

  useEffect(() => {
    if (isPublic) {
      if (initialPortfolios) {
        setPortfolios(initialPortfolios);
      }
      setFetchingPortfolios(false);
    } else {
      fetchPortfolios();
    }
  }, [user, isPublic, initialPortfolios]);


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

  const handlePushToReel = async (portfolioId, e) => {
    e?.stopPropagation?.();
    
    // Check if already published
    const portfolio = portfolios.find(p => p._id === portfolioId);
    if (portfolio?.isPublished) {
      toast.info("✨ Already published to Reels!");
      return;
    }

    // Restriction for Editors: Must have 100% profile completion
    if (user?.role === "editor" && !user?.profileCompleted) {
      setShowIncompleteProfileModal(true);
      return;
    }

    // Show Confirmation Modal
    setPortfolioToPublish(portfolioId);
    setShowConfirmPublishModal(true);
  };

  const handleConfirmPublish = async () => {
    if (!portfolioToPublish) return;
    const portfolioId = portfolioToPublish;
    setShowConfirmPublishModal(false);
    setPortfolioToPublish(null);
    
    try {
      const res = await axios.post(
        `${backendURL}/api/reels/publish/${portfolioId}`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      toast.success("🎉 Published to Reels!");
      
      // Update local state to show "Published" status
      setPortfolios(prev => prev.map(p => 
        p._id === portfolioId 
          ? { ...p, isPublished: true, reelId: res.data.reel?._id }
          : p
      ));
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes("already")) {
        toast.info("✨ Already published to Reels!");
        // Update local state
        setPortfolios(prev => prev.map(p => 
          p._id === portfolioId ? { ...p, isPublished: true } : p
        ));
      } else {
        toast.error(err.response?.data?.message || "Failed to publish");
      }
    }
  };

  const isVideo = (url) =>
    url?.endsWith(".mp4") || url?.endsWith(".mov") || url?.endsWith(".webm");


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
  const openReelsPopup = (index) => {
    setReelsIndex(index);
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
        onClick={() => openReelsPopup(index)}
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
              "linear-gradient(0deg, #000000ff, #ffffffff, #070808ff)",
              "linear-gradient(90deg, #002bd8ff, #ffffffff, #000000ff)",
              "linear-gradient(180deg, #000000ff, #ffffffff, #000000ff)",
              "linear-gradient(270deg, #000000ff, #000000ff, #0055ffff)",
              "linear-gradient(360deg, #001febff, #ffffffff, #000000ff)",
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-full h-full bg-white rounded-[22px]" />
        </motion.div>

        {/* Content Container */}
        <div className="relative z-10 p-1">
          {/* Media Container - 9:16 Instagram Reels style */}
          <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-black">
            {coverIsVideo ? (
              <video
                ref={videoRef}
                src={coverClip}
                className="w-full h-full object-contain"
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={coverClip}
                alt={portfolio.title}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
              />
            )}

            {/* Gradient Overlay - Always visible */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

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

            {/* Top Badges - Always visible */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
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
              {/* Actions - Only show if NOT public */}
              {!isPublic && (
                <div className="flex gap-2">
                  {/* Push to Reel Button - Shows Published state */}
                  <motion.button
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    whileHover={{ scale: 1.1, rotate: portfolio.isPublished ? 0 : 10 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handlePushToReel(portfolio._id, e)}
                    className={`w-9 h-9 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transition-all ${
                      portfolio.isPublished 
                        ? 'bg-green-500 text-white cursor-default' 
                        : 'bg-white/90 text-purple-500 hover:bg-purple-50'
                    }`}
                    title={portfolio.isPublished ? "Already on Reels" : "Add to Reel"}
                  >
                    {portfolio.isPublished ? (
                      <FaCheck className="text-sm" />
                    ) : (
                      <FaPlus className="text-sm" />
                    )}
                  </motion.button>

                  {/* Delete Button */}
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
              )}
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

              {/* Engagement Metrics (if published) */}
              {portfolio.isPublished && (
                <div className="flex items-center gap-2 ml-auto">
                  <div className="flex items-center gap-1 text-gray-500 text-xs" title="Views">
                    <FaEye /> {portfolio.viewsCount || 0}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-xs" title="Likes">
                    <FaHeart className="text-red-400" /> {portfolio.likesCount || 0}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-xs" title="Comments">
                    <FaComment className="text-blue-400" /> {portfolio.commentsCount || 0}
                  </div>
                </div>
              )}
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

  return (
    <div>
      {/* Add Button - Only show if NOT public */}
      {!isPublic && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/upload-reel")}
          className="flex items-center gap-2 px-3 py-1.5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-lg mb-4 ml-1"
        >
          <FaPlus className="text-[10px]" />
          Add Portfolio / Reel
        </motion.button>
      )}

      {/* Add Portfolio Modal */}

      {/* Instagram-Style Portfolio Grid */}
      <div className="mt-6">
        {fetchingPortfolios ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
          </div>
        ) : portfolios.length > 0 ? (
          <div className="grid grid-cols-3 gap-1">
            {portfolios.map((p, i) => {
              const coverClip = p.editedClip || p.originalClips?.[0] || p.originalClip;
              const coverIsVideo = isVideo(coverClip);
              const isReel = p.isPublished;
              
              return (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => openReelsPopup(i)}
                  className="relative aspect-[9/16] bg-zinc-900 cursor-pointer group overflow-hidden rounded-xl"
                >
                  {/* Thumbnail */}
                  {coverIsVideo ? (
                    <video
                      src={coverClip}
                      className="w-full h-full object-contain"
                      muted
                    />
                  ) : (
                    <img
                      src={coverClip}
                      alt={p.title}
                      className="w-full h-full object-contain"
                    />
                  )}
                  
                  {/* Gradient overlay for visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
                  
                  {/* Hover Overlay with stats */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    {isReel && (
                      <>
                        <div className="flex items-center gap-1 text-white text-sm font-semibold">
                           <FaHeart />
                          <span>{p.likesCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-white text-sm font-semibold">
                          <FaComment />
                          <span>{p.commentsCount || 0}</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Top-Right: Status Icon (White, Small) */}
                   {!isPublic && (
                    <button 
                      onClick={(e) => handlePushToReel(p._id, e)}
                      className="absolute top-1.5 right-1.5 z-30 flex items-center justify-center gap-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-lg rounded-full border border-white/10 hover:bg-black/70 transition-colors"
                      title={isReel ? "Published to Reels" : "Add to Reel"}
                    >
                      {isReel ? (
                        <HiOutlineCheckCircle className="text-emerald-400 text-[14px] md:text-[16px] drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                      ) : (
                        <>
                          <HiOutlinePlusCircle className="text-white/90 text-[14px] md:text-[16px]" />
                          <span className="hidden sm:inline text-white text-[8px] md:text-[9px] font-black uppercase tracking-wider">Reel</span>
                        </>
                      )}
                    </button>
                  )}
                  
                   {/* Top-Left: Double Layer Icon (Original + Edited) */}
                  {(p.originalClips?.length > 0 || p.originalClip) && p.editedClip && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); openReelsPopup(i); }}
                      className="absolute top-1.5 left-1.5 z-30 bg-black/30 backdrop-blur-sm rounded-md p-0.5 hover:bg-black/50 transition-colors" 
                      title="Double Layer (Original + Edited)"
                    >
                      <HiOutlineSquare2Stack className="text-white/80 text-[14px] md:text-[18px] drop-shadow-lg" />
                    </button>
                  )}
                  
                  {/* Bottom-left: Views (if published) */}
                  {isReel && (
                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 text-white text-[11px] font-bold z-10 drop-shadow-lg">
                      <FaEye className="text-white text-[10px]" />
                      <span>{p.viewsCount || 0}</span>
                    </div>
                  )}
                  
                  {/* Hover Overlay with Push to Reel button for Private items */}
                   {!isPublic && !isReel && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                        <button
                          onClick={(e) => handlePushToReel(p._id, e)}
                          className="px-4 py-1.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl hover:bg-zinc-100 transition-colors"
                        >
                          Add to Reel
                        </button>
                    </div>
                  )}
                  
                  {/* Bottom-right: Delete button (always visible) */}
                  {!isPublic && (
                    <button
                      onClick={(e) => confirmDelete(p._id, e)}
                      className="absolute bottom-2.5 right-2.5 w-7 h-7 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 z-10 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                    >
                      <FaTrash className="text-[10px]" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 flex items-center justify-center">
              <FaFilm className="text-zinc-600 text-xl" />
            </div>
            <h3 className="text-sm font-medium text-zinc-400 mb-1">
              {isPublic ? "No portfolio yet" : "No portfolios yet"}
            </h3>
            {!isPublic && (
              <>
                <p className="text-xs text-zinc-600 mb-4">Showcase your work</p>
                <button
                  onClick={() => navigate("/upload-reel")}
                  className="px-4 py-2 bg-white text-black text-xs font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  Add Portfolio
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Reels Popup */}
      <AnimatePresence>
        {showReelsPopup && portfolios.length > 0 && (
          <ReelPreviewModal 
            reels={portfolios}
            initialIndex={reelsIndex}
            isPortfolioMode={true}
            onClose={() => setShowReelsPopup(false)} 
            portfolioOwner={profileOwner}
          />
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

      {/* Incomplete Profile Modal */}
      <AnimatePresence>
        {showIncompleteProfileModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[100] p-4" onClick={() => setShowIncompleteProfileModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaExclamationTriangle className="text-amber-500 text-3xl" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Profile Incomplete</h3>
              <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
                Please complete all required profile fields to <span className="text-white font-bold">100%</span> before you can publish portfolio items to Reels.
              </p>
              <div className="flex flex-col gap-3">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }} 
                  onClick={() => navigate("/editor-profile-update")} 
                  className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-white/5"
                >
                  Complete Profile
                </motion.button>
                <button 
                  onClick={() => setShowIncompleteProfileModal(false)} 
                  className="w-full py-3 text-zinc-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
       </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmPublishModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[100] p-4" onClick={() => setShowConfirmPublishModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaGlobe className="text-emerald-500 text-3xl" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Ready to Publish?</h3>
              <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
                This will publish your portfolio work to the <span className="text-white font-bold">Public Reels</span> feed for everyone to see.
              </p>
              <div className="flex flex-col gap-3">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }} 
                  onClick={handleConfirmPublish} 
                  className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20"
                >
                  Confirm & Publish
                </motion.button>
                <button 
                  onClick={() => setShowConfirmPublishModal(false)} 
                  className="w-full py-3 text-zinc-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors"
                >
                  Nevermind, Skip
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PortfolioSection;
