/**
 * DownloadPage.jsx - High Quality Download Page
 * 
 * Flow:
 * 1. Show file details and "Download Full Quality" button
 * 2. Click → Show Confirm Modal (type CONFIRM)
 * 3. After CONFIRM → Check if rated
 * 4. If not rated → Show Rating Modal
 * 5. After rating → Proceed with download
 * 6. Download complete!
 */

import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaDownload,
  FaCheck,
  FaClock,
  FaFilm,
  FaImage,
  FaMusic,
  FaExpand,
  FaStar,
  FaMoneyBillWave,
  FaLock,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  HiOutlineArrowDownTray,
  HiOutlineShieldCheck,
  HiOutlineArrowLeft,
} from "react-icons/hi2";
import { BiData, BiTime, BiCodeBlock } from "react-icons/bi";
import axios from "axios";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";
import RatingModal from "../components/RatingModal";

// === Format Utilities ===
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatResolution = (width, height) => {
  if (!width || !height) return null;
  if (width >= 3840) return { label: "4K Ultra HD", detail: `${width}×${height}` };
  if (width >= 2560) return { label: "2K QHD", detail: `${width}×${height}` };
  if (width >= 1920) return { label: "Full HD", detail: `${width}×${height}` };
  if (width >= 1280) return { label: "HD", detail: `${width}×${height}` };
  if (width >= 854) return { label: "SD", detail: `${width}×${height}` };
  return { label: "Custom", detail: `${width}×${height}` };
};

const DownloadPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { backendURL, user } = useAppContext();

  // Data states
  const [delivery, setDelivery] = useState(location.state?.delivery || null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Flow states
  const [step, setStep] = useState("info"); // info → confirm → rating → downloading → done
  const [confirmText, setConfirmText] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isRated, setIsRated] = useState(null);
  
  // Download states
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [error, setError] = useState(null);

  // Get orderId
  const orderId = delivery?.orderId || id;

  // Fetch delivery and order details
  useEffect(() => {
    const fetchData = async () => {
      if (!orderId) {
        setError("Order ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get delivery status
        const statusRes = await axios.get(`${backendURL}/api/delivery/${orderId}/status`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        
        // Merge delivery data
        if (statusRes.data.delivery) {
          setDelivery(prev => ({ ...prev, ...statusRes.data.delivery, orderId }));
        }
        
        // Get order details for editor info
        try {
          const orderRes = await axios.get(`${backendURL}/api/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          });
          setOrder(orderRes.data.order || orderRes.data);
        } catch (e) {
          console.log("Could not fetch order details:", e);
        }

        // Check if already rated
        try {
          const ratingRes = await axios.get(`${backendURL}/api/ratings/check/${orderId}`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          });
          setIsRated(ratingRes.data.isRated);
        } catch (e) {
          setIsRated(false);
        }

      } catch (err) {
        setError(err.response?.data?.message || "Failed to load delivery");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId, backendURL, user?.token]);

  // Countdown timer
  useEffect(() => {
    const targetDate = delivery?.expiresAt;
    if (!targetDate) return;

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(targetDate);
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, mins, secs });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [delivery?.expiresAt]);

  // Handle download button click - show confirm modal
  const handleStartDownload = () => {
    setStep("confirm");
  };

  // Handle confirm submission
  const handleConfirmSubmit = () => {
    if (confirmText.toUpperCase() !== "CONFIRM" || !agreed) return;
    
    // Check if rated
    if (!isRated) {
      setStep("rating");
    } else {
      // Already rated, proceed to download
      proceedWithDownload();
    }
  };

  // After rating submitted
  const handleRatingSuccess = () => {
    setIsRated(true);
    setStep("downloading");
    proceedWithDownload();
  };

  // Proceed with actual download
  const proceedWithDownload = async () => {
    setStep("downloading");
    setDownloading(true);
    setDownloadProgress(0);

    try {
      const downloadToken = delivery?.downloadToken || delivery?.token;
      
      if (!downloadToken) {
        throw new Error("Download token not found");
      }

      // Call confirm endpoint
      const res = await axios.post(
        `${backendURL}/api/delivery/${orderId}/confirm`,
        {
          confirmText: "CONFIRM",
          token: downloadToken,
        },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      // Simulate progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 90) {
          clearInterval(progressInterval);
          progress = 90;
        }
        setDownloadProgress(Math.min(progress, 90));
      }, 150);

      // Get download URL
      const downloadUrl = res.data.downloadUrl || res.data.originalUrl;
      if (!downloadUrl) {
        throw new Error("Download URL not available");
      }

      // Create download link
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = delivery?.fileName || "final_output";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Complete
      clearInterval(progressInterval);
      setDownloadProgress(100);
      setDownloaded(true);
      setStep("done");
      toast.success("🎉 Download started! Full quality file.");

    } catch (err) {
      console.error("Download error:", err);
      toast.error(err.response?.data?.message || "Download failed");
      setDownloadProgress(0);
      setStep("info");
    } finally {
      setDownloading(false);
    }
  };

  // Derived values
  const isVideo = delivery?.mimeType?.startsWith("video/");
  const isImage = delivery?.mimeType?.startsWith("image/");
  const resolution = delivery ? formatResolution(delivery.width, delivery.height) : null;
  const editorName = order?.editor?.name || "the editor";
  const editorEarning = order?.editorEarning;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <HiOutlineArrowLeft className="text-lg" />
            <span className="text-sm">Back to Chat</span>
          </button>
          
          {timeLeft && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <FaClock className="text-amber-400 text-xs" />
              <span className="text-amber-400 font-mono text-sm">
                {timeLeft.hours.toString().padStart(2, "0")}:
                {timeLeft.mins.toString().padStart(2, "0")}:
                {timeLeft.secs.toString().padStart(2, "0")}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          {/* Card */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            
            {/* Preview Section */}
            <div className="relative aspect-video bg-black">
              {delivery?.thumbnailUrl ? (
                <img
                  src={delivery.thumbnailUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {isVideo ? <FaFilm className="text-6xl text-zinc-700" /> :
                   isImage ? <FaImage className="text-6xl text-zinc-700" /> :
                   <FaMusic className="text-6xl text-zinc-700" />}
                </div>
              )}
              
              {resolution && (
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg">
                  <span className="text-white font-bold text-sm">{resolution.label}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Title */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {downloaded ? "Download Complete!" : "Your File is Ready!"}
                </h1>
                <p className="text-zinc-400 text-sm">
                  {downloaded 
                    ? "Check your downloads folder for the file"
                    : "Download the original full-quality file with zero compression"}
                </p>
              </div>

              {/* File Info */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <p className="text-white font-medium mb-3 truncate">{delivery?.fileName || "Final Output"}</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {resolution && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-zinc-500 text-[10px] uppercase mb-1">
                        <FaExpand className="text-indigo-400" />
                        Resolution
                      </div>
                      <p className="text-white font-semibold text-sm">{resolution.detail}</p>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-zinc-500 text-[10px] uppercase mb-1">
                      <BiData className="text-blue-400" />
                      Size
                    </div>
                    <p className="text-white font-semibold text-sm">{formatBytes(delivery?.fileSize)}</p>
                  </div>
                  
                  {delivery?.duration && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-zinc-500 text-[10px] uppercase mb-1">
                        <BiTime className="text-green-400" />
                        Duration
                      </div>
                      <p className="text-white font-semibold text-sm">{formatDuration(delivery.duration)}</p>
                    </div>
                  )}
                  
                  {delivery?.codec && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-zinc-500 text-[10px] uppercase mb-1">
                        <BiCodeBlock className="text-amber-400" />
                        Codec
                      </div>
                      <p className="text-white font-semibold text-sm uppercase">{delivery.codec}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quality Guarantee */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <HiOutlineShieldCheck className="text-emerald-400 text-xl" />
                  <div>
                    <p className="text-emerald-300 font-medium text-sm">Original Quality Guaranteed</p>
                    <p className="text-emerald-400/70 text-xs">No compression • Exactly as created by editor</p>
                  </div>
                </div>
              </div>

              {/* Download Progress */}
              {downloading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Downloading...</span>
                    <span className="text-white font-mono">{Math.round(downloadProgress)}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${downloadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Download Button or Success */}
              {!downloaded ? (
                <button
                  onClick={handleStartDownload}
                  disabled={downloading}
                  className={`w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                    downloading
                      ? "bg-zinc-700 cursor-not-allowed"
                      : "bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02]"
                  }`}
                >
                  {downloading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <HiOutlineArrowDownTray className="text-xl" />
                      Download Full Quality
                    </>
                  )}
                </button>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                    <FaCheck className="text-white text-2xl" />
                  </div>
                  <p className="text-emerald-400 font-bold text-lg">Download Complete!</p>
                  <p className="text-zinc-500 text-sm">Check your downloads folder</p>
                </div>
              )}

              {/* Timer Warning */}
              {timeLeft && timeLeft.hours < 2 && (
                <p className="text-center text-amber-400 text-sm">
                  ⚠️ Download expires in {timeLeft.hours}h {timeLeft.mins}m
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* === CONFIRM MODAL === */}
      <AnimatePresence>
        {step === "confirm" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setStep("info")}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 rounded-2xl border border-white/10 max-w-md w-full overflow-hidden"
            >
              {/* Warning Header */}
              <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <FaExclamationTriangle className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Confirm Download</h3>
                    <p className="text-white/80 text-sm">This action is irreversible</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <FaMoneyBillWave className="text-emerald-400 mt-0.5" />
                    <div>
                      <p className="text-white text-sm font-medium">Payment Release</p>
                      <p className="text-zinc-400 text-xs">
                        {editorEarning ? `₹${editorEarning}` : "Payment"} will be released to the editor
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <FaLock className="text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-white text-sm font-medium">No Refunds</p>
                      <p className="text-zinc-400 text-xs">
                        You cannot request changes after downloading
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confirm Input */}
                <div>
                  <label className="text-zinc-400 text-xs mb-2 block">
                    Type <span className="text-white font-bold">CONFIRM</span> to proceed
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="Type CONFIRM"
                    className={`w-full bg-black/50 border-2 rounded-xl px-4 py-3 text-white font-mono text-lg tracking-widest text-center focus:outline-none transition ${
                      confirmText === "CONFIRM" ? "border-green-500" : "border-white/20 focus:border-purple-500"
                    }`}
                    autoFocus
                  />
                </div>

                {/* Agreement */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-purple-500"
                  />
                  <span className="text-zinc-300 text-sm">
                    I understand and I'm satisfied with the delivered work
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => {
                    setStep("info");
                    setConfirmText("");
                    setAgreed(false);
                  }}
                  className="flex-1 py-3 bg-zinc-700 text-white rounded-xl hover:bg-zinc-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  disabled={confirmText !== "CONFIRM" || !agreed}
                  className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                    confirmText === "CONFIRM" && agreed
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                      : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  <FaDownload />
                  Proceed
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === RATING MODAL === */}
      <RatingModal
        isOpen={step === "rating"}
        onClose={() => setStep("info")}
        orderId={orderId}
        editorName={editorName}
        onSuccess={handleRatingSuccess}
      />
    </div>
  );
};

export default DownloadPage;
