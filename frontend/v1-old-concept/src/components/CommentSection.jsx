import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaPaperPlane,
    FaTimes,
    FaSpinner,
    FaMoon,
    FaSun
} from "react-icons/fa";
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

    // NEW — Dark Mode Toggle (local only)
    const [darkMode, setDarkMode] = useState(true);

    const fetchComments = async (pageNum = 1) => {
        try {
            const { data } = await axios.get(
                `${backendURL}/api/reels/${reelId}/comments?page=${pageNum}&limit=20`
            );

            if (pageNum === 1) setComments(data.comments);
            else setComments((prev) => [...prev, ...data.comments]);

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
            transition={{ type: "spring", damping: 22, stiffness: 180 }}
            className={`fixed inset-x-0 bottom-0 z-[60] 
                ${darkMode ? "bg-[#0d0d0d]" : "bg-white"}
                rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]
                h-[72vh] flex flex-col
                md:max-w-md md:mx-auto md:inset-x-auto md:left-1/2 md:-translate-x-1/2`}
        >

            {/* HEADER */}
            <div
                className={`flex items-center justify-between px-4 py-4 border-b
                ${darkMode ? "border-white/10" : "border-black/10"}`}
            >
                <h3
                    className={`font-bold text-lg 
                        ${darkMode ? "text-white" : "text-gray-800"}`}
                >
                    Comments
                </h3>

                <div className="flex items-center gap-3">

                    {/* Dark Mode Toggle (NEW) */}
                    <button
                        onClick={() => setDarkMode((prev) => !prev)}
                        className={`p-2 rounded-full transition 
                            ${darkMode ? "bg-white/10" : "bg-black/5"}`}
                    >
                        {darkMode ? (
                            <FaSun className="text-yellow-300 text-lg" />
                        ) : (
                            <FaMoon className="text-gray-700 text-lg" />
                        )}
                    </button>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition 
                        ${darkMode ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                    >
                        <FaTimes
                            className={`${darkMode ? "text-white" : "text-gray-600"}`}
                        />
                    </button>
                </div>
            </div>

            {/* COMMENTS LIST */}
            <div
                className="flex-1 overflow-y-auto px-4 py-3 space-y-4 
                custom-scrollbar"
            >
                {loading ? (
                    <div className="flex justify-center py-10">
                        <FaSpinner className="animate-spin text-green-500 text-3xl" />
                    </div>
                ) : comments.length === 0 ? (
                    <div
                        className={`text-center py-10 
                            ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                        <p>No comments yet. Be the first!</p>
                    </div>
                ) : (
                    <>
                        {comments.map((comment) => (
                            <div key={comment._id} className="flex gap-3">
                                <img
                                    src={
                                        comment.user.profilePicture ||
                                        "https://via.placeholder.com/40"
                                    }
                                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                                />

                                <div className="flex-1">

                                    {/* COMMENT BUBBLE */}
                                    <div
                                        className={`rounded-2xl p-3 rounded-tl-none
                                        backdrop-blur-md
                                        ${darkMode
                                                ? "bg-white/10 text-white"
                                                : "bg-gray-100 text-gray-900"
                                            }`}
                                    >
                                        <p
                                            className={`text-xs font-semibold mb-1 
                                            ${darkMode ? "text-gray-200" : "text-gray-700"}`}
                                        >
                                            {comment.user.name}
                                        </p>

                                        <p className="text-sm">
                                            {comment.text}
                                        </p>
                                    </div>

                                    <span
                                        className={`text-[10px] ml-2 mt-1 block 
                                        ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                                    >
                                        {new Date(comment.createdAt).toLocaleDateString(
                                            undefined,
                                            {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            }
                                        )}
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
                                className={`w-full py-2 text-sm mt-2 rounded-lg 
                                transition 
                                ${darkMode
                                        ? "text-green-400 hover:bg-white/10"
                                        : "text-green-600 hover:bg-green-50"
                                    }`}
                            >
                                Load more comments
                            </button>
                        )}
                    </>
                )}

                <div ref={commentsEndRef} />
            </div>

            {/* INPUT */}
            <form
                onSubmit={handleSubmit}
                className={`p-4 border-t 
                ${darkMode ? "border-white/10 bg-[#0d0d0d]" : "border-black/10 bg-white"}
                pb-6 md:pb-4`}
            >
                <div className="flex items-center gap-2">
                    <input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className={`flex-1 px-4 py-3 rounded-full text-sm
                            focus:outline-none transition-all
                            ${darkMode
                                ? "bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500"
                                : "bg-gray-100 text-gray-800 focus:ring-2 focus:ring-green-500"
                            }`}
                    />

                    <button
                        type="submit"
                        disabled={!newComment.trim() || submitting}
                        className={`p-3 rounded-full transition 
                        ${newComment.trim() && !submitting
                                ? "bg-green-500 text-white hover:bg-green-600"
                                : darkMode
                                    ? "bg-white/10 text-gray-500"
                                    : "bg-gray-200 text-gray-400"
                            }`}
                    >
                        {submitting ? (
                            <FaSpinner className="animate-spin" />
                        ) : (
                            <FaPaperPlane />
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default CommentSection;
