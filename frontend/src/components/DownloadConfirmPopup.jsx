// DownloadConfirmPopup.jsx - Confirmation popup before downloading final delivery
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaExclamationTriangle,
  FaDownload,
  FaTimes,
  FaLock,
  FaMoneyBillWave,
  FaComments,
  FaStar,
} from "react-icons/fa";
import axios from "axios";
import RatingModal from "./RatingModal";
import { useAppContext } from "../context/AppContext";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const DownloadConfirmPopup = ({ isOpen, onClose, onConfirm, editorEarning, loading, orderId, editorName }) => {
  const { user } = useAppContext();
  const [confirmText, setConfirmText] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isRated, setIsRated] = useState(null); // null = loading, true = rated, false = not rated
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [checkingRating, setCheckingRating] = useState(false);

  // Check if order is already rated when popup opens - if not, show rating modal first
  useEffect(() => {
    if (isOpen && orderId && user?.token) {
      checkRatingAndShowModal();
    } else if (isOpen && orderId && !user?.token) {
      // No token but modal opened - show rating modal anyway
      setIsRated(false);
      setShowRatingModal(true);
    }
  }, [isOpen, orderId, user?.token]);

  const checkRatingAndShowModal = async () => {
    setCheckingRating(true);
    try {
      const res = await axios.get(`${API_BASE}/api/ratings/check/${orderId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setIsRated(res.data.isRated);
      
      // If not rated, show rating modal immediately
      if (!res.data.isRated) {
        setShowRatingModal(true);
      }
    } catch (error) {
      console.error("Error checking rating:", error);
      // If error (like 401), just show rating modal
      setIsRated(false);
      setShowRatingModal(true);
    } finally {
      setCheckingRating(false);
    }
  };

  const isConfirmValid = confirmText.toUpperCase() === "CONFIRM";
  const canProceed = isConfirmValid && agreed && isRated;

  const handleConfirm = () => {
    if (canProceed) {
      onConfirm(confirmText);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setConfirmText("");
    setAgreed(false);
    setIsRated(null);
    setShowRatingModal(false);
    onClose();
  };

  // After rating is submitted successfully
  const handleRatingSuccess = () => {
    setIsRated(true);
    setShowRatingModal(false);
    // Now show the download confirm popup
  };

  // If rating modal is showing, render only that
  if (showRatingModal) {
    return (
      <RatingModal
        isOpen={true}
        onClose={handleClose}
        orderId={orderId}
        editorName={editorName}
        onSuccess={handleRatingSuccess}
      />
    );
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[110] flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1a1a] rounded-2xl border border-white/10 max-w-md w-full overflow-hidden shadow-2xl"
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
                {/* Rating Completed Indicator */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/20 border border-green-500/30">
                  <FaStar className="text-green-400" />
                  <p className="text-sm font-medium text-green-300">
                    ✅ Thank you for rating! You can now download the file.
                  </p>
                </div>

                {/* What happens */}
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm">
                    By downloading this file, you acknowledge that:
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                      <FaMoneyBillWave className="text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-white text-sm font-medium">Payment Release</p>
                        <p className="text-gray-400 text-xs">
                          ₹{editorEarning || "---"} will be released to the editor immediately
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                      <FaComments className="text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-white text-sm font-medium">Chat Disabled</p>
                        <p className="text-gray-400 text-xs">
                          The chat will be closed and marked as completed
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                      <FaLock className="text-orange-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-white text-sm font-medium">No Refunds</p>
                        <p className="text-gray-400 text-xs">
                          You cannot request changes or refunds after downloading
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirm Input */}
                <div>
                  <label className="text-gray-400 text-xs mb-2 block">
                    Type <span className="text-white font-bold">CONFIRM</span> to proceed
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type CONFIRM here"
                    className={`w-full bg-black/50 border-2 rounded-xl px-4 py-3 text-white font-mono text-lg tracking-widest focus:outline-none transition ${
                      confirmText.length > 0 
                        ? isConfirmValid 
                          ? "border-green-500" 
                          : "border-red-500"
                        : "border-white/20 focus:border-purple-500"
                    }`}
                  />
                </div>

                {/* Agreement Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="mt-0.5">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                      agreed ? "bg-purple-500 border-purple-500" : "border-gray-500 group-hover:border-gray-400"
                    }`}>
                      {agreed && <span className="text-white text-xs">✓</span>}
                    </div>
                  </div>
                  <span className="text-gray-300 text-sm">
                    I understand that this action cannot be undone and I'm satisfied with the delivered work
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-white/10 flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!canProceed || loading || checkingRating}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition ${
                    canProceed 
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90" 
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FaDownload />
                      Proceed & Download
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DownloadConfirmPopup;

