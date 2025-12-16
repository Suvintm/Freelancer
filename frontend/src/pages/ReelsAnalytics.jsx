// ReelsAnalytics.jsx - Instagram-Style Reels Analytics Dashboard for Editors
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaArrowLeft,
    FaEye,
    FaHeart,
    FaComment,
    FaClock,
    FaUsers,
    FaChartLine,
    FaPlay,
    FaSpinner,
    FaFire,
    FaCalendarAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";

const ReelsAnalytics = () => {
    const { user, backendURL } = useAppContext();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [reels, setReels] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedReel, setSelectedReel] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const { data } = await axios.get(
                    `${backendURL}/api/reels/analytics/my-reels`,
                    { headers: { Authorization: `Bearer ${user?.token}` } }
                );
                setAnalytics(data.analytics);
                setReels(data.reels);
            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.token) {
            fetchAnalytics();
        }
    }, [backendURL, user?.token]);

    // Format large numbers
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num?.toString() || "0";
    };

    const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 light:bg-white border border-zinc-800/50 light:border-slate-200 rounded-2xl p-4 light:shadow-sm"
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon className="text-white text-lg" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-white light:text-slate-900">{value}</p>
                    <p className="text-xs text-zinc-500 light:text-slate-500">{label}</p>
                    {subtext && <p className="text-[10px] text-zinc-600 light:text-slate-400">{subtext}</p>}
                </div>
            </div>
        </motion.div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <FaSpinner className="text-white text-4xl animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-200">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

            <main className="md:ml-64 pt-6 md:pt-20 lg:pt-24 px-4 md:px-6 pb-10">
                <div className="max-w-6xl mx-auto">
                    
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-6"
                    >
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-10 h-10 bg-zinc-900 light:bg-white rounded-full flex items-center justify-center text-white light:text-slate-600 hover:bg-zinc-800 light:hover:bg-slate-100 transition light:border light:border-slate-200 light:shadow-sm"
                            >
                                <FaArrowLeft />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold light:text-slate-900">Reels Analytics</h1>
                                <p className="text-sm text-zinc-500 light:text-slate-500">Track your reel performance</p>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => navigate('/reels')}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-sm font-semibold hover:opacity-90 transition text-white"
                        >
                            <FaPlay className="text-xs" />
                            View Reels
                        </button>
                    </motion.div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <StatCard 
                            icon={FaEye} 
                            label="Total Views" 
                            value={formatNumber(analytics?.totalViews || 0)}
                            color="bg-blue-600"
                        />
                        <StatCard 
                            icon={FaHeart} 
                            label="Total Likes" 
                            value={formatNumber(analytics?.totalLikes || 0)}
                            color="bg-pink-600"
                        />
                        <StatCard 
                            icon={FaComment} 
                            label="Comments" 
                            value={formatNumber(analytics?.totalComments || 0)}
                            color="bg-emerald-600"
                        />
                        <StatCard 
                            icon={FaUsers} 
                            label="Unique Reach" 
                            value={formatNumber(analytics?.uniqueReach || 0)}
                            color="bg-amber-600"
                        />
                    </div>

                    {/* Secondary Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 light:from-purple-100 light:to-pink-100 border border-purple-500/20 rounded-2xl p-4 text-center"
                        >
                            <FaChartLine className="text-purple-400 light:text-purple-600 text-xl mx-auto mb-1" />
                            <p className="text-lg font-bold text-white light:text-slate-900">{analytics?.engagementRate || 0}%</p>
                            <p className="text-[10px] text-zinc-500 light:text-slate-500 uppercase">Engagement Rate</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 light:from-blue-100 light:to-cyan-100 border border-blue-500/20 rounded-2xl p-4 text-center"
                        >
                            <FaClock className="text-blue-400 light:text-blue-600 text-xl mx-auto mb-1" />
                            <p className="text-lg font-bold text-white light:text-slate-900">{analytics?.totalWatchTimeMinutes || 0} min</p>
                            <p className="text-[10px] text-zinc-500 light:text-slate-500 uppercase">Watch Time</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-orange-500/10 to-red-500/10 light:from-orange-100 light:to-red-100 border border-orange-500/20 rounded-2xl p-4 text-center"
                        >
                            <FaFire className="text-orange-400 light:text-orange-600 text-xl mx-auto mb-1" />
                            <p className="text-lg font-bold text-white light:text-slate-900">{analytics?.totalReels || 0}</p>
                            <p className="text-[10px] text-zinc-500 light:text-slate-500 uppercase">Total Reels</p>
                        </motion.div>
                    </div>

                    {/* Reels List */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-zinc-900/50 light:bg-white border border-zinc-800/50 light:border-slate-200 rounded-2xl overflow-hidden light:shadow-sm"
                    >
                        <div className="p-4 border-b border-zinc-800/50 light:border-slate-200">
                            <h2 className="font-semibold light:text-slate-900">Your Reels Performance</h2>
                        </div>

                        {reels.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500">
                                <FaPlay className="text-3xl mx-auto mb-2 opacity-50" />
                                <p>No reels published yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-800/50 light:divide-slate-200">
                                {reels.map((reel, index) => (
                                    <motion.div
                                        key={reel._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-4 hover:bg-zinc-800/30 light:hover:bg-slate-100 transition cursor-pointer"
                                        onClick={() => setSelectedReel(reel)}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Thumbnail */}
                                            <div className="w-16 h-24 bg-zinc-800 light:bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                                                {reel.mediaType === "video" ? (
                                                    <video
                                                        src={reel.mediaUrl}
                                                        className="w-full h-full object-cover"
                                                        muted
                                                    />
                                                ) : (
                                                    <img
                                                        src={reel.mediaUrl}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-white light:text-slate-900 truncate">{reel.title}</h3>
                                                <p className="text-xs text-zinc-500 light:text-slate-500 flex items-center gap-1 mt-1">
                                                    <FaCalendarAlt className="text-[10px]" />
                                                    {new Date(reel.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="text-center">
                                                    <p className="font-bold text-white light:text-slate-900">{formatNumber(reel.viewsCount)}</p>
                                                    <p className="text-[10px] text-zinc-500 light:text-slate-500">Views</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-pink-400 light:text-pink-600">{formatNumber(reel.likesCount)}</p>
                                                    <p className="text-[10px] text-zinc-500 light:text-slate-500">Likes</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-blue-400 light:text-blue-600">{formatNumber(reel.commentsCount)}</p>
                                                    <p className="text-[10px] text-zinc-500 light:text-slate-500">Comments</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>

            {/* Reel Detail Modal */}
            <AnimatePresence>
                {selectedReel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedReel(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-zinc-900 rounded-2xl w-full max-w-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Video Preview */}
                            <div className="aspect-[9/16] bg-black max-h-[50vh]">
                                {selectedReel.mediaType === "video" ? (
                                    <video
                                        src={selectedReel.mediaUrl}
                                        className="w-full h-full object-contain"
                                        controls
                                        autoPlay
                                        muted
                                    />
                                ) : (
                                    <img
                                        src={selectedReel.mediaUrl}
                                        alt=""
                                        className="w-full h-full object-contain"
                                    />
                                )}
                            </div>

                            {/* Stats */}
                            <div className="p-4">
                                <h3 className="font-bold text-white mb-3">{selectedReel.title}</h3>
                                
                                <div className="grid grid-cols-4 gap-2">
                                    <div className="bg-zinc-800 rounded-xl p-3 text-center">
                                        <FaEye className="text-blue-400 mx-auto mb-1" />
                                        <p className="text-lg font-bold">{formatNumber(selectedReel.viewsCount)}</p>
                                        <p className="text-[9px] text-zinc-500">Views</p>
                                    </div>
                                    <div className="bg-zinc-800 rounded-xl p-3 text-center">
                                        <FaHeart className="text-pink-400 mx-auto mb-1" />
                                        <p className="text-lg font-bold">{formatNumber(selectedReel.likesCount)}</p>
                                        <p className="text-[9px] text-zinc-500">Likes</p>
                                    </div>
                                    <div className="bg-zinc-800 rounded-xl p-3 text-center">
                                        <FaComment className="text-emerald-400 mx-auto mb-1" />
                                        <p className="text-lg font-bold">{formatNumber(selectedReel.commentsCount)}</p>
                                        <p className="text-[9px] text-zinc-500">Comments</p>
                                    </div>
                                    <div className="bg-zinc-800 rounded-xl p-3 text-center">
                                        <FaUsers className="text-amber-400 mx-auto mb-1" />
                                        <p className="text-lg font-bold">{formatNumber(selectedReel.uniqueViewers)}</p>
                                        <p className="text-[9px] text-zinc-500">Reach</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedReel(null)}
                                    className="w-full mt-4 py-3 bg-zinc-800 rounded-xl text-white font-medium hover:bg-zinc-700 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReelsAnalytics;
