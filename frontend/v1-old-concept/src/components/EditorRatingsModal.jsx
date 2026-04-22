/**
 * EditorRatingsModal.jsx - Professional ratings modal
 * Features:
 * - Fully responsive (mobile-first)
 * - Clean professional design
 * - Stats breakdown
 * - Reply to reviews
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiXMark, HiStar, HiChatBubbleLeft, HiCheck, HiArrowPath } from "react-icons/hi2";
import { FaStar, FaReply } from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const EditorRatingsModal = ({ isOpen, onClose, editorId }) => {
  const { user } = useAppContext();
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && editorId) {
      fetchRatings();
    }
  }, [isOpen, editorId]);

  const fetchRatings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/ratings/editor/${editorId}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setRatings(res.data.ratings || []);
      setStats(res.data.stats || null);
    } catch (err) {
      console.error("Failed to fetch ratings:", err);
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (ratingId) => {
    if (replyText.trim().length < 10) {
      alert("Response must be at least 10 characters");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE}/api/ratings/${ratingId}/respond`,
        { response: replyText },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setReplyingTo(null);
      setReplyText("");
      fetchRatings();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, size = "sm" }) => {
    const sizeClass = size === "lg" ? "text-base" : "text-xs";
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`${sizeClass} ${star <= value ? "text-amber-400" : "text-zinc-700"}`}
          />
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  const isOwner = user?._id === editorId;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full md:max-w-lg md:mx-4 max-h-[90vh] md:max-h-[85vh] bg-zinc-950 md:rounded-2xl rounded-t-2xl shadow-2xl border border-zinc-800 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-5 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <FaStar className="text-amber-400 text-sm" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-white">
                  {isOwner ? "My Reviews" : "Reviews"}
                </h2>
                <p className="text-xs text-zinc-500">
                  {stats?.totalReviews || 0} {(stats?.totalReviews || 0) === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <HiXMark className="text-lg text-zinc-400" />
            </button>
          </div>

          {/* Stats Summary */}
          {stats && stats.totalReviews > 0 && (
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-4">
                {/* Overall Rating */}
                <div className="text-center flex-shrink-0">
                  <div className="text-2xl md:text-3xl font-bold text-white">
                    {stats.averageRating?.toFixed(1)}
                  </div>
                  <StarRating value={Math.round(stats.averageRating)} size="lg" />
                </div>
                
                {/* Breakdown */}
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
                    <div className="text-sm font-semibold text-white">{stats.qualityAvg?.toFixed(1)}</div>
                    <div className="text-[10px] text-zinc-500">Quality</div>
                  </div>
                  <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
                    <div className="text-sm font-semibold text-white">{stats.communicationAvg?.toFixed(1)}</div>
                    <div className="text-[10px] text-zinc-500">Comm.</div>
                  </div>
                  <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
                    <div className="text-sm font-semibold text-white">{stats.speedAvg?.toFixed(1)}</div>
                    <div className="text-[10px] text-zinc-500">Speed</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <HiArrowPath className="text-2xl text-zinc-500 animate-spin mb-2" />
                <p className="text-sm text-zinc-500">Loading reviews...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-sm text-red-400">{error}</p>
                <button onClick={fetchRatings} className="mt-2 text-xs text-emerald-400">Try again</button>
              </div>
            ) : ratings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-zinc-900 flex items-center justify-center">
                  <FaStar className="text-zinc-700 text-xl" />
                </div>
                <p className="text-sm text-zinc-400">No reviews yet</p>
                <p className="text-xs text-zinc-600 mt-1">Complete orders to receive reviews</p>
              </div>
            ) : (
              ratings.map((rating) => (
                <div
                  key={rating._id}
                  className="p-3 md:p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50"
                >
                  {/* Reviewer */}
                  <div className="flex items-start gap-2.5 mb-2">
                    <img
                      src={rating.reviewer?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white truncate">
                          {rating.reviewer?.name || "Client"}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating value={rating.overall} />
                        <span className="text-xs font-medium text-white">{rating.overall}</span>
                      </div>
                    </div>
                  </div>

                  {/* Project */}
                  <div className="text-[11px] text-zinc-500 mb-2">
                    Project: <span className="text-zinc-400">{rating.order?.title || "—"}</span>
                  </div>

                  {/* Review Text */}
                  {rating.review && (
                    <p className="text-xs text-zinc-300 leading-relaxed mb-2 italic">
                      "{rating.review}"
                    </p>
                  )}

                  {/* Breakdown */}
                  <div className="flex gap-3 text-[10px] text-zinc-500 mb-2">
                    <span>Quality: <span className="text-zinc-400">{rating.quality}★</span></span>
                    <span>Comm: <span className="text-zinc-400">{rating.communication}★</span></span>
                    <span>Speed: <span className="text-zinc-400">{rating.deliverySpeed}★</span></span>
                  </div>

                  {/* Editor Response */}
                  {rating.editorResponse ? (
                    <div className="mt-2 p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <HiCheck className="text-emerald-500 text-xs" />
                        <span className="text-[10px] font-medium text-emerald-400">Your Reply</span>
                      </div>
                      <p className="text-xs text-zinc-300">{rating.editorResponse}</p>
                    </div>
                  ) : isOwner && (
                    <>
                      {replyingTo === rating._id ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your response (min 10 chars)..."
                            className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs resize-none focus:outline-none focus:border-emerald-500/50"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReply(rating._id)}
                              disabled={submitting || replyText.trim().length < 10}
                              className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {submitting ? "..." : "Send"}
                            </button>
                            <button
                              onClick={() => { setReplyingTo(null); setReplyText(""); }}
                              className="px-3 py-1.5 bg-zinc-800 text-zinc-400 text-xs rounded-lg hover:bg-zinc-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingTo(rating._id)}
                          className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300"
                        >
                          <FaReply className="text-[10px]" />
                          Reply to this review
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Mobile Bottom Padding */}
          <div className="h-6 md:hidden bg-zinc-950" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditorRatingsModal;
