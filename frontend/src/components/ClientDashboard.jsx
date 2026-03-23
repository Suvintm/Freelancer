import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    HiOutlineRocketLaunch, 
    HiOutlineClipboardDocumentList, 
    HiOutlineCurrencyRupee, 
    HiOutlineUserGroup,
    HiOutlineArrowRight,
    HiOutlineSparkles,
    HiOutlineChatBubbleLeftRight,
    HiOutlinePlus,
    HiOutlineChartBar,
    HiOutlineCreditCard,
    HiOutlineHeart,
    HiOutlineCog8Tooth,
    HiOutlineBell,
    HiOutlineLockClosed,
    HiOutlineArrowLeftOnRectangle,
    HiOutlineEye
} from "react-icons/hi2";
import { FaUser, FaLock, FaEnvelope, FaCalendarAlt, FaCheck, FaClipboardList } from "react-icons/fa";
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const ClientDashboard = ({ user, stats, activeProjects, getStatusStyle }) => {
    const navigate = useNavigate();
    const { logout, backendURL } = useAppContext();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeSubTab, setActiveSubTab] = useState("overview");
    const [allOrders, setAllOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [privacySettings, setPrivacySettings] = useState({
        manualApproval: user?.followSettings?.manualApproval || false,
    });
    const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Fetch all orders when switching to orders tab
    useEffect(() => {
        if (activeSubTab === "orders" && allOrders.length === 0) {
            const fetchAllOrders = async () => {
                setLoadingOrders(true);
                try {
                    const res = await axios.get(`${backendURL}/api/orders`, {
                        headers: { Authorization: `Bearer ${user.token}` },
                    });
                    setAllOrders(res.data.orders || []);
                } catch (err) {
                    console.error("Failed to fetch all orders:", err);
                } finally {
                    setLoadingOrders(false);
                }
            };
            fetchAllOrders();
        }
    }, [activeSubTab, backendURL, user?.token]);

    const greeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Sample data for charts - in a real app, this would come from an API
    const spendingData = [
        { name: 'Mon', value: 400 },
        { name: 'Tue', value: 300 },
        { name: 'Wed', value: 600 },
        { name: 'Thu', value: 800 },
        { name: 'Fri', value: 500 },
        { name: 'Sat', value: 900 },
        { name: 'Sun', value: 700 },
    ];

    const orderStatusData = [
        { name: 'Completed', value: stats?.completedOrders || 0, color: '#10B981' },
        { name: 'Active', value: stats?.activeOrders || 0, color: '#6366F1' },
    ];

    const hasNoOrders = stats?.totalOrders === 0;

    if (hasNoOrders) {
        return (
            <div className="px-4 py-8 max-w-4xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0d0d12] border border-white/5 rounded-[2.5rem] p-12 text-center shadow-2xl overflow-hidden relative"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-500/10 rounded-full blur-[100px] -z-10" />
                    
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                        <HiOutlineSparkles className="w-10 h-10 text-violet-400" />
                    </div>
                    
                    <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Ready to start your first project?</h2>
                    <p className="text-zinc-400 text-lg mb-10 max-w-md mx-auto leading-relaxed">
                        Connect with top editors, manage your projects, and track your creative spending all in one place.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                        <button 
                            onClick={() => navigate('/explore/editors')}
                            className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl transition-all group text-left"
                        >
                            <HiOutlineUserGroup className="w-8 h-8 text-violet-400 mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-white font-bold mb-1">Find Editors</h3>
                            <p className="text-zinc-500 text-sm">Browse 1,200+ specialized video editors.</p>
                        </button>
                        
                        <button 
                            onClick={() => navigate('/create-brief')}
                            className="p-6 bg-violet-600 hover:bg-violet-500 rounded-3xl transition-all group text-left"
                        >
                            <HiOutlinePlus className="w-8 h-8 text-white mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-white font-bold mb-1">Post a Brief</h3>
                            <p className="text-white/70 text-sm">Let editors come to you with proposals.</p>
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="px-4 space-y-8 pb-20 max-w-7xl mx-auto">
            {/* Header / Greeting */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        {greeting()}, {user?.name?.split(' ')[0] || 'Member'}
                        <motion.span 
                            animate={{ rotate: [0, 10, -10, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                        >
                            👋
                        </motion.span>
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Here's your creative overview for today.</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => navigate('/create-brief')}
                        className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-violet-600/20 flex items-center gap-2"
                    >
                        <HiOutlinePlus className="w-4 h-4" /> New Project
                    </button>
                </div>
            </header>

            {/* Dashboard Sub-Tabs */}
            <div className="flex justify-center md:justify-start">
                <div className="inline-flex bg-zinc-900/50 border border-white/5 p-1 rounded-2xl backdrop-blur-md">
                    {[
                        { id: 'overview', label: 'Overview', icon: HiOutlineChartBar },
                        { id: 'orders', label: 'Orders', icon: HiOutlineClipboardDocumentList },
                        { id: 'settings', label: 'Settings', icon: HiOutlineCog8Tooth }
                    ].map((tab) => {
                        const isActive = activeSubTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSubTab(tab.id)}
                                className={`relative flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                                }`}
                            >
                                <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-400' : ''}`} />
                                {tab.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="dashboardSubTab"
                                        className="absolute inset-0 bg-white/5 rounded-xl -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeSubTab === "overview" && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Active Projects", value: stats?.activeOrders || 0, icon: HiOutlineRocketLaunch, color: "text-violet-400", bg: "bg-violet-500/10" },
                    { label: "Total Completed", value: stats?.completedOrders || 0, icon: HiOutlineClipboardDocumentList, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    { label: "Total Spent", value: `₹${stats?.totalSpent?.toLocaleString() || 0}`, icon: HiOutlineCurrencyRupee, color: "text-amber-400", bg: "bg-amber-500/10" },
                    { label: "Saved Editors", value: "12", icon: HiOutlineUserGroup, color: "text-indigo-400", bg: "bg-indigo-500/10" },
                ].map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#0d0d12] border border-white/5 rounded-3xl p-5 hover:border-white/10 transition-all group"
                    >
                        <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Spending & Active Tasks */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Spending Overview */}
                    <div className="bg-[#0d0d12] border border-white/5 rounded-[2rem] p-6">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <HiOutlineChartBar className="text-violet-400" /> Spending Overview
                            </h3>
                            <button className="text-[10px] px-3 py-1 bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors uppercase font-bold tracking-tighter">
                                Last 7 Days
                            </button>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={spendingData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#71717a', fontSize: 12 }} 
                                    />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#8B5CF6" 
                                        fillOpacity={1} 
                                        fill="url(#colorValue)" 
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Active Projects (Migrated Carousel) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Active Projects</h3>
                            <button onClick={() => navigate('/client-orders')} className="text-[10px] text-violet-400 hover:underline uppercase font-bold">View All</button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                            {activeProjects.map((project, idx) => {
                                const statusStyle = getStatusStyle(project.status);
                                return (
                                    <motion.div
                                        key={project._id}
                                        whileHover={{ y: -5 }}
                                        onClick={() => navigate(`/chat/${project._id}`)}
                                        className="snap-start flex-shrink-0 w-80 bg-[#0d0d12] border border-white/5 rounded-3xl p-5 cursor-pointer shadow-xl hover:border-violet-500/30 transition-all group"
                                    >
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="relative">
                                                <img 
                                                    src={project.editor?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                                                    alt="" 
                                                    className="w-12 h-12 rounded-xl object-cover border border-zinc-800"
                                                />
                                                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0d0d12]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{project.title}</p>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{project.editor?.name}</p>
                                            </div>
                                            <HiOutlineArrowRight className="text-zinc-700 group-hover:text-violet-400 transition-colors" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={`px-3 py-1 text-[9px] font-bold uppercase rounded-lg ${statusStyle.bg} ${statusStyle.text}`}>
                                                {statusStyle.label}
                                            </span>
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-white">₹{project.amount}</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column: Quick Actions & Breakdown */}
                <div className="space-y-8">
                    {/* Status Pie Chart */}
                    <div className="bg-[#0d0d12] border border-white/5 rounded-[2rem] p-6 lg:h-full flex flex-col">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Order Status</h3>
                        <div className="flex-1 min-h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={orderStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {orderStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3 mt-4">
                            {orderStatusData.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-xs font-bold text-zinc-400">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-white">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Access Menu */}
                    <div className="bg-[#0d0d12] border border-white/5 rounded-[2rem] p-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Quick Management</h3>
                        <div className="space-y-3">
                            {[
                                { label: "Manage My Orders", icon: HiOutlineClipboardDocumentList, path: "/client-orders", color: "text-blue-400" },
                                { label: "Payment History", icon: HiOutlineCreditCard, path: "/payments", color: "text-emerald-400" },
                                { label: "Saved Editors", icon: HiOutlineHeart, path: "/saved-editors", color: "text-rose-400" },
                                { label: "Help Center", icon: HiOutlineChatBubbleLeftRight, path: "/legal-center", color: "text-amber-400" },
                            ].map((item, i) => (
                                <button 
                                    key={i}
                                    onClick={() => navigate(item.path)}
                                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <item.icon className={`w-5 h-5 ${item.color}`} />
                                        <span className="text-xs font-bold text-white">{item.label}</span>
                                    </div>
                                    <HiOutlineArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-all group-hover:translate-x-1" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                        </div>
                    </motion.div>
                )}

                {activeSubTab === "orders" && (
                    <motion.div
                        key="orders"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="bg-[#0d0d12] border border-white/5 rounded-[2rem] p-6">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Order History</h3>
                            {loadingOrders ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : allOrders.length === 0 ? (
                                <div className="text-center py-12">
                                    <HiOutlineClipboardDocumentList className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                    <p className="text-zinc-500 text-sm">No orders found</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {allOrders.map((order) => {
                                        const statusStyle = getStatusStyle(order.status);
                                        return (
                                            <div
                                                key={order._id}
                                                onClick={() => navigate(`/chat/${order._id}`)}
                                                className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all cursor-pointer group"
                                            >
                                                <img 
                                                    src={order.editor?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                                                    alt="" 
                                                    className="w-10 h-10 rounded-xl object-cover"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white truncate">{order.title}</p>
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{order.editor?.name || 'Editor'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-bold text-white mb-1">₹{order.amount}</div>
                                                    <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-md ${statusStyle.bg} ${statusStyle.text}`}>
                                                        {statusStyle.label}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeSubTab === "settings" && (
                    <motion.div
                        key="settings"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Account Settings */}
                            <div className="bg-[#0d0d12] border border-white/5 rounded-[2rem] p-6">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Account Settings</h3>
                                <div className="space-y-3">
                                    <button onClick={() => navigate('/editor-profile-update')} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
                                        <div className="flex items-center gap-4">
                                            <FaUser className="w-4 h-4 text-zinc-500" />
                                            <span className="text-xs font-bold text-white">Update Bio & Info</span>
                                        </div>
                                        <HiOutlineArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-all" />
                                    </button>
                                    <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
                                        <div className="flex items-center gap-4">
                                            <HiOutlineBell className="w-4 h-4 text-zinc-500" />
                                            <span className="text-xs font-bold text-white">Notifications</span>
                                        </div>
                                        <HiOutlineArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-all" />
                                    </button>
                                    <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
                                        <div className="flex items-center gap-4">
                                            <HiOutlineLockClosed className="w-4 h-4 text-zinc-500" />
                                            <span className="text-xs font-bold text-white">Security & Privacy</span>
                                        </div>
                                        <HiOutlineArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-all" />
                                    </button>
                                </div>
                            </div>

                            {/* Privacy Preferences */}
                            <div className="bg-[#0d0d12] border border-white/5 rounded-[2rem] p-6">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Privacy</h3>
                                <div className="p-4 bg-white/5 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-white uppercase tracking-widest">Manual Follow Approval</p>
                                        <p className="text-[10px] text-zinc-500 mt-1">Approve or ignore follow requests manually.</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (updatingPrivacy) return;
                                            setUpdatingPrivacy(true);
                                            const newValue = !privacySettings.manualApproval;
                                            try {
                                                await axios.put(`${backendURL}/api/profile`, {
                                                    followSettings: { manualApproval: newValue }
                                                }, {
                                                    headers: { Authorization: `Bearer ${user.token}` }
                                                });
                                                setPrivacySettings({ manualApproval: newValue });
                                                toast.success(`Follow approval set to ${newValue ? 'Manual' : 'Automatic'}`);
                                            } catch (err) {
                                                toast.error("Failed to update privacy settings");
                                            } finally {
                                                setUpdatingPrivacy(false);
                                            }
                                        }}
                                        className={`w-12 h-6 rounded-full transition-all relative ${privacySettings.manualApproval ? 'bg-violet-600' : 'bg-zinc-800'}`}
                                    >
                                        <motion.div 
                                            animate={{ x: privacySettings.manualApproval ? 26 : 2 }}
                                            className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                                        />
                                    </button>
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/5">
                                    <button 
                                        onClick={logout}
                                        className="w-full flex items-center gap-3 p-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest"
                                    >
                                        <HiOutlineArrowLeftOnRectangle className="w-5 h-5" /> Logout from SuviX
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClientDashboard;
