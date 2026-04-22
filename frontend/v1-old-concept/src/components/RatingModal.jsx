/**
 * RatingModal.jsx - Modal for client to rate editor after delivery
 * Features:
 * - Multi-criteria star rating (Overall, Quality, Communication, Delivery Speed)
 * - Optional written review
 * - Premium animated UI
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar, FaTimes, FaCheckCircle } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import axios from "axios";
import { useAppContext } from "../context/AppContext";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const RatingModal = ({ isOpen, onClose, orderId, editorName, onSuccess }) => {
  const { user } = useAppContext();
  const [ratings, setRatings] = useState({
    overall: 0,
    quality: 0,
    communication: 0,
    deliverySpeed: 0,
  });
  const [review, setReview] = useState("");
  const [hoveredRating, setHoveredRating] = useState({ category: null, value: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { key: "overall", label: "Overall Experience", icon: "⭐" },
    { key: "quality", label: "Work Quality", icon: "✨" },
    { key: "communication", label: "Communication", icon: "💬" },
    { key: "deliverySpeed", label: "Delivery Speed", icon: "⚡" },
  ];

  const handleStarClick = (category, value) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const handleSubmit = async () => {
    // Validate all ratings are filled
    const allRated = Object.values(ratings).every((r) => r >= 1);
    if (!allRated) {
      alert("Please rate all categories before submitting");
      return;
    }

    if (!user?.token) {
      alert("Authentication error. Please login again.");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE}/api/ratings/${orderId}`,
        { ...ratings, review },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (category, currentValue) => {
    const displayValue = hoveredRating.category === category ? hoveredRating.value : currentValue;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(category, star)}
            onMouseEnter={() => setHoveredRating({ category, value: star })}
            onMouseLeave={() => setHoveredRating({ category: null, value: 0 })}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <FaStar
              className={`text-2xl transition-colors ${
                star <= displayValue
                  ? "text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]"
                  : "text-gray-300 dark:text-zinc-600"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Success State */}
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center"
              >
                <FaCheckCircle className="text-white text-4xl" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Thank You!
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Your rating has been submitted successfully.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <button
                  onClick={onClose}
                  disabled={submitting}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <FaTimes />
                </button>
                <div className="flex items-center gap-3">
                  <HiSparkles className="text-2xl text-yellow-300" />
                  <div>
                    <h2 className="text-xl font-bold">Rate Your Experience</h2>
                    <p className="text-purple-200 text-sm">with {editorName}</p>
                  </div>
                </div>
              </div>

              {/* Rating Form */}
              <div className="p-6 space-y-5">
                {/* Rating Categories */}
                {categories.map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span>{icon}</span>
                      {label}
                    </span>
                    {renderStars(key, ratings[key])}
                  </div>
                ))}

                {/* Written Review */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Written Review (Optional)
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your experience working with this editor..."
                    className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/30 text-gray-900 dark:text-white resize-none"
                    rows={3}
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {review.length}/1000
                  </p>
                </div>

                {/* Required Notice */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-400">
                  ⚠️ Rating is required to download the final file. Your feedback helps improve our platform!
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    "Submit Rating & Download"
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RatingModal;
