import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    HiOutlineChartBar, 
    HiOutlineEye, 
    HiOutlineHeart, 
    HiOutlineChatBubbleLeft, 
    HiOutlinePlay, 
    HiOutlineArrowTrendingUp,
    HiOutlineClock,
    HiOutlineArrowPath,
    HiOutlineExclamationTriangle,
    HiChevronLeft,
    HiChevronRight
} from "react-icons/hi2";
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    AreaChart, 
    Area,
    BarChart,
    Bar
} from "recharts";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { repairUrl } from "../utils/urlHelper";
import { useSearchParams } from "react-router-dom";

const ReelsAnalyticsPage = () => {
    const { user, backendURL } = useAppContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialReelId = searchParams.get("id");

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ summary: {}, reels: [] });
    const [selectedReel, setSelectedReel] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await axios.get(`${backendURL}/api/reels/analytics/my-reels`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                if (data.success) {
                    setStats(data);
                    
                    // Auto-select reel from URL or first in list
                    if (initialReelId) {
                        const found = data.reels.find(r => r._id === initialReelId);
                        setSelectedReel(found || data.reels[0]);
                    } else if (data.reels.length > 0) {
                        setSelectedReel(data.reels[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch analytics:", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchStats();
    }, [user, backendURL, initialReelId]);

    // Derived stats for the selected reel
    const selectedMetrics = useMemo(() => {
        if (!selectedReel) return null;
        const ctr = selectedReel.viewsCount > 0 
            ? ((selectedReel.likesCount / selectedReel.viewsCount) * 100).toFixed(1) 
            : 0;
        const completion = (selectedReel.avgCompletionRate * 100).toFixed(0);
        const skipRate = selectedReel.viewsCount > 0 
            ? ((selectedReel.skipCount / selectedReel.viewsCount) * 100).toFixed(1) 
            : 0;
        
        return { ctr, completion, skipRate };
    }, [selectedReel]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 pt-24 pb-20">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl font-black tracking-tight mb-2"
                        >
                            Reels Insights
                        </motion.h1>
                        <p className="text-zinc-500 font-medium">Performance telemetry for your published content</p>
                    </div>
                    
                    {/* Summary Totals */}
                    <div className="flex gap-8 px-6 py-4 rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-xl">
                        <div className="text-center">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Total Views</p>
                            <p className="text-xl font-black">{(stats.summary.totalViews || 0).toLocaleString()}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10 self-center" />
                        <div className="text-center">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Avg. Completion</p>
                            <p className="text-xl font-black">{(stats.summary.avgCompletion * 100).toFixed(0)}%</p>
                        </div>
                        <div className="w-px h-8 bg-white/10 self-center" />
                        <div className="text-center">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Engagement</p>
                            <p className="text-xl font-black">{(stats.summary.engagementRate || 0).toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto space-y-12">
                {/* 1. Selection Carousel */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Select Content</h2>
                        <span className="text-xs text-zinc-600 font-medium">{stats.reels.length} Reels Published</span>
                    </div>
                    
                    <div className="relative group">
                        <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar scroll-smooth snap-x">
                            {stats.reels.map((r) => (
                                <motion.div
                                    key={r._id}
                                    whileHover={{ y: -5 }}
                                    onClick={() => setSelectedReel(r)}
                                    className={`relative flex-shrink-0 w-32 aspect-[9/16] rounded-xl overflow-hidden cursor-pointer snap-start transition-all duration-300 ${
                                        selectedReel?._id === r._id 
                                        ? "ring-2 ring-white ring-offset-4 ring-offset-black scale-105 z-10" 
                                        : "opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
                                    }`}
                                >
                                    <video 
                                        src={repairUrl(r.mediaUrl)} 
                                        className="w-full h-full object-cover"
                                        muted
                                        playsInline
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                                        <p className="text-[10px] font-bold truncate">{r.title}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <AnimatePresence mode="wait">
                    {selectedReel && (
                        <motion.div
                            key={selectedReel._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                        >
                            {/* 2. Main Stats Panel */}
                            <div className="lg:col-span-8 space-y-8">
                                {/* Metric Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <MetricCard 
                                        icon={<HiOutlineEye />} 
                                        label="Impressions" 
                                        value={selectedReel.viewsCount} 
                                        color="blue"
                                    />
                                    <MetricCard 
                                        icon={<HiOutlineArrowTrendingUp />} 
                                        label="Completion Rate" 
                                        value={`${selectedMetrics?.completion}%`} 
                                        color="green"
                                    />
                                    <MetricCard 
                                        icon={<HiOutlineExclamationTriangle />} 
                                        label="Skip Rate" 
                                        value={`${selectedMetrics?.skipRate}%`} 
                                        color="red"
                                    />
                                    <MetricCard 
                                        icon={<HiOutlineArrowPath />} 
                                        label="Re-watches" 
                                        value={selectedReel.reWatchCount} 
                                        color="purple"
                                    />
                                </div>

                                {/* Deep Insights Chart */}
                                <div className="bg-zinc-900 rounded-3xl p-6 border border-white/5 shadow-2xl">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-xl font-bold">Retention vs. Friction</h3>
                                            <p className="text-xs text-zinc-500">How users interact with this reel over time</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] uppercase font-black text-zinc-400">Retention</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-rose-500" />
                                                <span className="text-[10px] uppercase font-black text-zinc-400">Skips</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={[
                                                { name: 'Views', value: selectedReel.viewsCount, skip: selectedReel.skipCount },
                                                { name: 'Engaged', value: selectedReel.likesCount + selectedReel.commentsCount, skip: 0 },
                                                { name: 'Completed', value: Math.round(selectedReel.viewsCount * selectedReel.avgCompletionRate), skip: 0 },
                                            ]}>
                                                <defs>
                                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorVal)" />
                                                <Area type="monotone" dataKey="skip" stroke="#f43f5e" fillOpacity={0.1} fill="#f43f5e" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                
                                {/* Raw Stats Table */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5">
                                        <h4 className="text-xs font-bold text-zinc-500 mb-4 uppercase tracking-widest">Signal Weights</h4>
                                        <div className="space-y-3">
                                            <SignalItem label="Wilson Score" value={selectedReel.recommendationScore?.toFixed(4)} />
                                            <SignalItem label="Bayesian Prior" value={(selectedReel.avgCompletionRate * 100).toFixed(1) + "%"} />
                                            <SignalItem label="Skip Multiplier" value={(selectedReel.skipCount / (selectedReel.viewsCount || 1)).toFixed(2)} />
                                        </div>
                                     </div>
                                     <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5">
                                        <h4 className="text-xs font-bold text-zinc-500 mb-4 uppercase tracking-widest">Metadata</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedReel.hashtags?.map(h => (
                                                <span key={h} className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-zinc-400">
                                                    #{h}
                                                </span>
                                            ))}
                                        </div>
                                     </div>
                                </div>
                            </div>

                            {/* 3. Preview & Sidebar */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="aspect-[9/16] w-full max-w-[300px] mx-auto rounded-3xl overflow-hidden border-8 border-zinc-900 shadow-2xl relative">
                                    <video 
                                        src={repairUrl(selectedReel.mediaUrl)} 
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                    />
                                    <div className="absolute inset-0 bg-black/20" />
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="flex items-center gap-4 text-white/90">
                                            <div className="flex items-center gap-1.5">
                                                <HiOutlineHeart className="text-xl" />
                                                <span className="text-xs font-bold">{selectedReel.likesCount}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <HiOutlineChatBubbleLeft className="text-xl" />
                                                <span className="text-xs font-bold">{selectedReel.commentsCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-zinc-900 rounded-2xl p-6 text-center">
                                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-3">Recommendation Status</p>
                                    <div className={`text-xs font-bold inline-block px-4 py-1.5 rounded-full ${
                                        selectedReel.recommendationScore > 0.5 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                                    }`}>
                                        {selectedReel.recommendationScore > 0.5 ? "Top Performer" : "In Review / Cold Start"}
                                    </div>
                                    <div className="mt-4 flex flex-col gap-2">
                                        <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-bold">
                                            <span>Feed Weight</span>
                                            <span className="text-white">{Math.round(selectedReel.recommendationScore * 100)}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, selectedReel.recommendationScore * 100)}%` }}
                                                className="h-full bg-gradient-to-r from-emerald-500 to-sky-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

const MetricCard = ({ icon, label, value, color }) => {
    const colors = {
        blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        green: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        red: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        purple: "text-purple-500 bg-purple-500/10 border-purple-500/20"
    };

    return (
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl mb-4 ${colors[color]}`}>
                {icon}
            </div>
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black">{value}</p>
        </div>
    );
};

const SignalItem = ({ label, value }) => (
    <div className="flex justify-between items-center text-[10px] font-bold">
        <span className="text-zinc-500">{label}</span>
        <span className="text-white bg-white/5 px-2 py-0.5 rounded">{value}</span>
    </div>
);

export default ReelsAnalyticsPage;
