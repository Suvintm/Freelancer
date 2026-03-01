import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
    FaHeart,
    FaRegHeart,
    FaPaperPlane,
    FaTimes,
    FaSpinner,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { repairUrl } from "../utils/urlHelper.jsx";

const MentionLink = ({ username, currentUser, onClose, comments, reelAuthor }) => {
    const navigate = useNavigate();
    const nameWithoutAt = username.replace('@', '');

    const handleMentionClick = () => {
        let targetId = null;
        if (reelAuthor?.name === nameWithoutAt) {
            targetId = reelAuthor._id;
        } else {
            const mentionedUser = comments.find(c => c.user.name === nameWithoutAt);
            if (mentionedUser) targetId = mentionedUser.user._id;
        }

        if (targetId) {
            onClose();
            if (targetId === currentUser?._id) {
                const role = currentUser?.role;
                if (role === 'editor') navigate('/editor-profile');
                else if (role === 'client') navigate('/client-profile');
                else navigate('/editor-profile');
            } else {
                navigate(`/public-profile/${targetId}`);
            }
        } else {
            toast.info(`Looking for ${username}...`);
        }
    };

    return (
        <span
            onClick={handleMentionClick}
            className="text-blue-400 font-semibold hover:underline cursor-pointer"
        >
            {username}
        </span>
    );
};

const renderTextWithMentions = (text, currentUser, onClose, comments, reelAuthor) => {
    if (!text) return null;
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
        if (part.startsWith('@')) {
            return <MentionLink key={i} username={part} currentUser={currentUser} onClose={onClose} comments={comments} reelAuthor={reelAuthor} />;
        }
        return part;
    });
};

const CommentItem = ({
    comment,
    isReply = false,
    parentId = null,
    onReply,
    onToggleLike,
    onToggleReplies,
    isExpanded,
    replies,
    onClose,
    currentUser,
    allComments,
    reelAuthor
}) => {
    return (
        <div className={`flex gap-3 ${isReply ? 'mb-3' : 'mb-5'}`}>
            <Link to={`/public-profile/${comment.user._id}`} onClick={onClose} className="flex-shrink-0">
                <img
                    src={repairUrl(comment.user.profilePicture)}
                    className={`${isReply ? 'w-7 h-7' : 'w-9 h-9'} rounded-full object-cover`}
                    alt=""
                />
            </Link>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="mb-0.5">
                            <Link
                                to={`/public-profile/${comment.user._id}`}
                                className="text-[13px] font-bold text-white hover:underline mr-2"
                            >
                                {comment.user.name}
                            </Link>
                            <span className="text-[13px] text-white/80 leading-snug whitespace-pre-wrap">
                                {renderTextWithMentions(comment.text, currentUser, onClose, allComments, reelAuthor)}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5">
                            <span className="text-[11px] text-white/40">
                                {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            {comment.likesCount > 0 && (
                                <span className="text-[11px] text-white/40 font-semibold">
                                    {comment.likesCount} {comment.likesCount === 1 ? 'like' : 'likes'}
                                </span>
                            )}
                            <button
                                onClick={() => onReply(comment)}
                                className="text-[11px] font-bold text-white/40 hover:text-white transition-colors"
                            >
                                Reply
                            </button>
                            {!isReply && (
                                <button className="text-[11px] font-bold text-white/40 hover:text-white transition-colors">
                                    See translation
                                </button>
                            )}
                        </div>
                    </div>
                    {/* Like Button */}
                    <button
                        onClick={() => onToggleLike(comment._id, !isReply, parentId)}
                        className="flex flex-col items-center gap-1 pt-1 flex-shrink-0"
                    >
                        {comment.isLiked ? (
                            <FaHeart className="text-red-500 text-[14px]" />
                        ) : (
                            <FaRegHeart className="text-white/40 text-[14px] hover:text-white/80 transition-colors" />
                        )}
                    </button>
                </div>

                {/* View Replies */}
                {!isReply && comment.repliesCount > 0 && (
                    <div className="mt-3 ml-1">
                        <button
                            onClick={() => onToggleReplies(comment._id)}
                            className="flex items-center gap-3 text-white/40 hover:text-white/70 transition-colors group"
                        >
                            <div className="w-6 h-[1px] bg-white/20 group-hover:bg-white/40" />
                            <span className="text-[12px] font-semibold">
                                {isExpanded
                                    ? "Hide replies"
                                    : `View ${comment.repliesCount} ${comment.repliesCount === 1 ? 'reply' : 'replies'}`
                                }
                            </span>
                        </button>
                    </div>
                )}

                {/* Replies */}
                <AnimatePresence>
                    {isExpanded && replies && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mt-3 space-y-1"
                        >
                            {replies.map(reply => (
                                <CommentItem
                                    key={reply._id}
                                    comment={reply}
                                    isReply={true}
                                    parentId={comment._id}
                                    onReply={onReply}
                                    onToggleLike={onToggleLike}
                                    onToggleReplies={onToggleReplies}
                                    onClose={onClose}
                                    currentUser={currentUser}
                                    allComments={allComments}
                                    reelAuthor={reelAuthor}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const ReelCommentsDrawer = ({ reel, onClose, onCommentAdded, isEmbedded = false }) => {
    const { user, backendURL } = useAppContext();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [expandedReplies, setExpandedReplies] = useState(new Set());
    const [repliesData, setRepliesData] = useState({});

    const commentsEndRef = useRef(null);
    const inputRef = useRef(null);
    // For drag-to-dismiss
    const dragY = useMotionValue(0);

    const fetchComments = async () => {
        if (!reel?._id) return;
        try {
            const { data } = await axios.get(
                `${backendURL}/api/reels/${reel._id}/comments?limit=50&parentComment=null`,
                user ? { headers: { Authorization: `Bearer ${user.token}` } } : {}
            );
            setComments(data.comments.filter(c => !c.parentComment));
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch comments", err);
            setLoading(false);
        }
    };

    const fetchReplies = async (commentId) => {
        try {
            const { data } = await axios.get(
                `${backendURL}/api/reels/${reel._id}/comments?parentComment=${commentId}`,
                user ? { headers: { Authorization: `Bearer ${user.token}` } } : {}
            );
            setRepliesData(prev => ({ ...prev, [commentId]: data.comments }));
        } catch (err) {
            console.error("Error fetching replies:", err);
        }
    };

    useEffect(() => {
        if (reel?._id) fetchComments();
    }, [reel?._id]);

    const handleToggleLike = async (commentId, isTopLevel = true, parentId = null) => {
        if (!user) return toast.error("Please login to like");

        try {
            const { data } = await axios.post(
                `${backendURL}/api/reels/${reel._id}/comments/${commentId}/like`,
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            const updateItem = (item) => item._id === commentId ? { ...item, isLiked: data.liked, likesCount: data.likesCount } : item;

            if (isTopLevel) {
                setComments(prev => prev.map(updateItem));
            } else if (parentId) {
                setRepliesData(prev => ({
                    ...prev,
                    [parentId]: prev[parentId].map(updateItem)
                }));
            }
        } catch (err) {
            toast.error("Failed to update like");
        }
    };

    const handleReplyClick = useCallback((comment) => {
        setReplyTo({ id: comment._id, name: comment.user.name });
        setNewComment(`@${comment.user.name} `);
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    const toggleReplies = useCallback((commentId) => {
        setExpandedReplies(prev => {
            const next = new Set(prev);
            if (next.has(commentId)) {
                next.delete(commentId);
            } else {
                next.add(commentId);
                if (!repliesData[commentId]) fetchReplies(commentId);
            }
            return next;
        });
    }, [repliesData, backendURL, reel._id, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const textToSubmit = newComment.trim();
        if (!textToSubmit || submitting) return;
        if (!user) return toast.error("Please login to comment");
        if (replyTo && textToSubmit === `@${replyTo.name}`) return toast.warn("Please add a message to your reply");

        setSubmitting(true);
        try {
            const { data } = await axios.post(
                `${backendURL}/api/reels/${reel._id}/comments`,
                {
                    text: textToSubmit,
                    parentCommentId: replyTo?.id
                },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            const newCommentData = data.comment;

            if (newCommentData.parentComment) {
                const pId = newCommentData.parentComment.toString();
                setRepliesData(prev => ({
                    ...prev,
                    [pId]: [newCommentData, ...(prev[pId] || [])]
                }));
                setExpandedReplies(prev => new Set(prev).add(pId));
                setComments(prev => prev.map(c =>
                    c._id === pId ? { ...c, repliesCount: (c.repliesCount || 0) + 1 } : c
                ));
            } else {
                setComments(prev => [newCommentData, ...prev]);
            }

            setNewComment("");
            setReplyTo(null);
            onCommentAdded(data.commentsCount);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to post");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDragEnd = (event, info) => {
        // Close drawer if dragged down more than 100px or with enough velocity
        if (info.offset.y > 120 || info.velocity.y > 400) {
            onClose();
        }
    };

    return (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{ y: dragY }}
            className={`
                ${isEmbedded
                    ? "absolute rounded-none"
                    : "fixed rounded-t-3xl max-w-[450px] mx-auto left-0 right-0"
                }
                bottom-0 inset-x-0 h-[75vh]
                bg-black z-[1200] flex flex-col overflow-hidden
                border-t border-white/10
            `}
        >
            {/* ── DRAG HANDLE AREA ── */}
            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                style={{ y: dragY }}
                className="pt-3 pb-2 cursor-grab active:cursor-grabbing flex flex-col items-center flex-shrink-0"
            >
                {/* The pill handle */}
                <div className="w-10 h-[4px] rounded-full bg-white/30 mb-3" />

                {/* "Comments" title */}
                <h3 className="text-[15px] font-bold text-white tracking-tight">Comments</h3>
            </motion.div>

            {/* Divider */}
            <div className="w-full h-[0.5px] bg-white/10 flex-shrink-0" />

            {/* ── REEL INFO (Author + Caption) ── visually distinct from comments ── */}
            <div className="px-3 pt-3 pb-3 flex-shrink-0">
                <div className="bg-white/5 rounded-2xl px-3 py-3 border border-white/8 flex gap-3">
                    {/* Avatar with a subtle ring to mark it as "author" */}
                    <Link to={`/public-profile/${reel.editor?._id}`} onClick={onClose} className="flex-shrink-0">
                        <div className="relative">
                            <img
                                src={repairUrl(reel.editor?.profilePicture)}
                                className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20"
                                alt=""
                            />
                        </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                        {/* Author name + badge */}
                        <div className="flex items-center gap-2 mb-1">
                            <Link
                                to={`/public-profile/${reel.editor?._id}`}
                                className="text-[13px] font-bold text-white hover:underline"
                            >
                                {reel.editor?.name}
                            </Link>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
                                Author
                            </span>
                        </div>
                        {/* Caption — italic to stand out from comment text */}
                        {reel.description && (
                            <p className="text-[13px] text-white/60 italic leading-snug mb-1">
                                {reel.description}
                            </p>
                        )}
                        {/* Hashtags */}
                        <div className="flex flex-wrap gap-1.5 mb-1">
                            {reel.title?.split(' ').filter(w => w.startsWith('#')).map((tag, i) => (
                                <span key={i} className="text-[11px] text-blue-400 font-medium hover:underline cursor-pointer">{tag}</span>
                            ))}
                        </div>
                        {/* Date */}
                        <span className="text-[11px] text-white/25">
                            {new Date(reel.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="w-full h-[0.5px] bg-white/10 flex-shrink-0" />

            {/* ── SCROLLABLE COMMENTS ── */}
            <div className="flex-1 overflow-y-auto px-4 pt-4" style={{ scrollbarWidth: 'none' }}>
                {loading ? (
                    <div className="flex justify-center py-12">
                        <FaSpinner className="animate-spin text-white/30 text-xl" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2">
                        <p className="text-[15px] font-bold text-white">No comments yet.</p>
                        <p className="text-[13px] text-white/40">Start the conversation.</p>
                    </div>
                ) : (
                    <div className="pb-4">
                        {comments.map((comment) => (
                            <CommentItem
                                key={comment._id}
                                comment={comment}
                                onReply={handleReplyClick}
                                onToggleLike={handleToggleLike}
                                onToggleReplies={toggleReplies}
                                isExpanded={expandedReplies.has(comment._id)}
                                replies={repliesData[comment._id]}
                                onClose={onClose}
                                currentUser={user}
                                allComments={comments}
                                reelAuthor={reel.editor}
                            />
                        ))}
                        <div ref={commentsEndRef} />
                    </div>
                )}
            </div>

            {/* ── COMMENT INPUT ── */}
            <div className="flex-shrink-0 border-t border-white/10 bg-black pb-safe">
                {/* Reply banner */}
                <AnimatePresence>
                    {replyTo && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5"
                        >
                            <span className="text-[12px] text-white/50">
                                Replying to <span className="text-white font-bold">{replyTo.name}</span>
                            </span>
                            <button
                                onClick={() => { setReplyTo(null); setNewComment(""); }}
                                className="text-white/40 hover:text-white p-1 transition-colors"
                            >
                                <FaTimes size={11} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3">
                    <img
                        src={repairUrl(user?.profilePicture)}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        alt=""
                    />
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyTo ? `Reply to ${replyTo.name}...` : "Add a comment..."}
                            className="w-full bg-transparent border-none outline-none text-[14px] text-white placeholder-white/30 py-1 pr-12"
                        />
                        {/* Underline */}
                        <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-white/15" />

                        <motion.button
                            type="submit"
                            disabled={!newComment.trim() || submitting}
                            whileTap={{ scale: 0.9 }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-[13px] font-bold text-sky-400 disabled:opacity-20 transition-opacity"
                        >
                            {submitting ? <FaSpinner className="animate-spin" size={13} /> : "Post"}
                        </motion.button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default ReelCommentsDrawer;
