import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPaperPlane, FaTimes, FaSpinner } from "react-icons/fa";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const CommentSection = ({ reelId, onClose, onCommentAdded }) => {
    const { user, backendURL } = useAppContext();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const commentsEndRef = useRef(null);

    const fetchComments = async (pageNum = 1) => {
        try {
            const { data } = await axios.get(
                `${backendURL}/api/reels/${reelId}/comments?page=${pageNum}&limit=20`
            );
            if (pageNum === 1) {
                setComments(data.comments);
            } else {
                setComments((prev) => [...prev, ...data.comments]);
            }
            setHasMore(data.pagination.hasMore);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching comments:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [reelId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;

        if (!user) {
            toast.error("Please login to comment");
            return;
        }

        setSubmitting(true);
        try {
            const { data } = await axios.post(
                `${backendURL}/api/reels/${reelId}/comments`,
                { text: newComment },
                {
                    headers: { Authorization: `Bearer ${user.token}` },
                }
            );

            setComments((prev) => [data.comment, ...prev]);
            setNewComment("");
            onCommentAdded(data.commentsCount);
            commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to post comment");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[60] bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] h-[70vh] flex flex-col md:max-w-md md:mx-auto md:inset-x-auto md:left-1/2 md:-translate-x-1/2"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-bold text-gray-800">Comments</h3>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <FaTimes className="text-gray-500" />
                </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading && page === 1 ? (
                    <div className="flex justify-center py-10">
                        <FaSpinner className="animate-spin text-green-500 text-2xl" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <p>No comments yet. Be the first!</p>
                    </div>
                ) : (
                    <>
                        {comments.map((comment) => (
                            <div key={comment._id} className="flex gap-3">
                                <img
                                    src={comment.user.profilePicture || "https://via.placeholder.com/40"}
                                    alt={comment.user.name}
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                                <div className="flex-1">
                                    <div className="bg-gray-50 rounded-2xl p-3 rounded-tl-none">
                                        <p className="text-xs font-bold text-gray-700 mb-1">
                                            {comment.user.name}
                                        </p>
                                        <p className="text-sm text-gray-800">{comment.text}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 ml-2 mt-1 block">
                                        {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {hasMore && (
                            <button
                                onClick={() => {
                                    setPage((p) => p + 1);
                                    fetchComments(page + 1);
                                }}
                                className="w-full py-2 text-sm text-green-600 font-medium hover:bg-green-50 rounded-lg transition-colors"
                            >
                                Load more comments
                            </button>
                        )}
                    </>
                )}
                <div ref={commentsEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 border-t bg-white pb-6 md:pb-4">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-gray-100 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        disabled={submitting}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || submitting}
                        className={`p-3 rounded-full transition-all ${newComment.trim() && !submitting
                                ? "bg-green-500 text-white hover:bg-green-600 shadow-lg transform hover:scale-105"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        {submitting ? (
                            <FaSpinner className="animate-spin" />
                        ) : (
                            <FaPaperPlane className="text-sm" />
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default CommentSection;
