/**
 * MyGigs - Enhanced Gig Management Page
 * Features: Stats dashboard, filter tabs, Explore theme styling, mobile responsive
 */

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaRupeeSign,
  FaClock,
  FaStar,
  FaShoppingCart,
  FaEye,
  FaChartLine,
  FaCheckCircle,
  FaPause,
  FaLayerGroup,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import Sidebar from "../components/Sidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";

// Default banner for gigs without custom banner
const DEFAULT_GIG_BANNER = "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&q=80";

// Filter options
const FILTER_TABS = [
  { id: "all", label: "All", icon: FaLayerGroup },
  { id: "active", label: "Active", icon: FaCheckCircle },
  { id: "paused", label: "Paused", icon: FaPause },
];

const MyGigs = () => {
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetchGigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGigs = async () => {
    try {
      setLoading(true);
      const token = user?.token;

      const res = await axios.get(`${backendURL}/api/gigs/my/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setGigs(res.data.gigs || []);
    } catch (err) {
      toast.error("Failed to load gigs");
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from gigs data
  const stats = useMemo(() => {
    const activeGigs = gigs.filter(g => g.isActive);
    const totalOrders = gigs.reduce((sum, g) => sum + (g.totalOrders || 0), 0);
    const totalEarnings = gigs.reduce((sum, g) => sum + ((g.totalOrders || 0) * (g.price || 0)), 0);
    const totalViews = gigs.reduce((sum, g) => sum + (g.views || 0), 0);
    
    return {
      total: gigs.length,
      active: activeGigs.length,
      orders: totalOrders,
      earnings: totalEarnings,
      views: totalViews,
    };
  }, [gigs]);

  // Filter gigs based on active filter
  const filteredGigs = useMemo(() => {
    switch (activeFilter) {
      case "active":
        return gigs.filter(g => g.isActive);
      case "paused":
        return gigs.filter(g => !g.isActive);
      default:
        return gigs;
    }
  }, [gigs, activeFilter]);

  const handleToggleStatus = async (gigId, currentStatus) => {
    try {
      const token = user?.token;
      await axios.patch(
        `${backendURL}/api/gigs/${gigId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGigs((prev) =>
        prev.map((g) => (g._id === gigId ? { ...g, isActive: !currentStatus } : g))
      );

      toast.success(currentStatus ? "Gig paused" : "Gig activated");
    } catch (err) {
      toast.error("Failed to update gig status");
    }
  };

  const handleDelete = async (gigId) => {
    if (!window.confirm("Delete this gig permanently?")) return;

    try {
      const token = user?.token;
      await axios.delete(`${backendURL}/api/gigs/${gigId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setGigs((prev) => prev.filter((g) => g._id !== gigId));
      toast.success("Gig deleted");
    } catch (err) {
      toast.error("Failed to delete gig");
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-[#09090B] light:bg-[#FAFAFA] text-white light:text-slate-900 transition-colors">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 flex items-center justify-center md:ml-64 mt-14 md:mt-20">
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full"
            />
            <p className="mt-4 text-gray-400 light:text-slate-500 text-sm">Loading gigs...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#09090B] light:bg-[#FAFAFA] text-white light:text-slate-900 transition-colors overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-3 py-3 md:px-8 md:py-6 md:ml-64 mt-12 md:mt-16 pb-24 md:pb-8 min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-lg bg-white/5 light:bg-white border border-white/10 light:border-slate-200 hover:bg-white/10 light:hover:bg-slate-50 transition-all"
            >
              <FaArrowLeft className="text-sm light:text-slate-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white light:text-slate-900 flex items-center gap-2">
                My Gigs
                <HiSparkles className="text-purple-400 text-sm" />
              </h1>
              <p className="text-gray-500 light:text-slate-500 text-xs">{gigs.length} gigs created</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/create-gig")}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-purple-500/25"
          >
            <FaPlus className="text-xs" /> Create
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { icon: FaLayerGroup, label: "Total", value: stats.total, color: "text-blue-400", bg: "bg-blue-500/10" },
            { icon: FaCheckCircle, label: "Active", value: stats.active, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { icon: FaShoppingCart, label: "Orders", value: stats.orders, color: "text-orange-400", bg: "bg-orange-500/10" },
            { icon: FaChartLine, label: "Earned", value: formatCurrency(stats.earnings), color: "text-green-400", bg: "bg-green-500/10" },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-3 rounded-lg bg-white/5 light:bg-white border border-white/10 light:border-slate-200"
            >
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`text-sm ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 light:text-slate-500">{stat.label}</p>
                <p className="text-sm font-semibold text-white light:text-slate-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white/5 light:bg-slate-100 rounded-lg mb-4 w-fit">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeFilter === tab.id
                  ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg"
                  : "text-gray-400 light:text-slate-600 hover:text-white light:hover:text-slate-900"
              }`}
            >
              <tab.icon className="text-[10px]" />
              {tab.label}
              {tab.id !== "all" && (
                <span className="ml-1 text-[10px] opacity-70">
                  ({tab.id === "active" ? stats.active : stats.total - stats.active})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Gigs List */}
        {filteredGigs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-white/5 light:bg-slate-100 flex items-center justify-center mb-4">
              <FaShoppingCart className="text-2xl text-gray-500 light:text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-white light:text-slate-900 mb-1">
              {activeFilter === "all" ? "No gigs yet" : `No ${activeFilter} gigs`}
            </h3>
            <p className="text-gray-500 light:text-slate-500 text-xs mb-4 text-center">
              {activeFilter === "all" ? "Create your first gig to start getting orders" : "Try a different filter"}
            </p>
            {activeFilter === "all" && (
              <button
                onClick={() => navigate("/create-gig")}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg text-sm font-medium"
              >
                <FaPlus /> Create Gig
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <AnimatePresence>
              {filteredGigs.map((gig, index) => (
                <motion.div
                  key={gig._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#0a0a0c] light:bg-white border border-white/10 light:border-slate-200 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all group"
                >
                  {/* Banner Image */}
                  <div className="relative w-full h-28 overflow-hidden">
                    <img
                      src={gig.thumbnail || DEFAULT_GIG_BANNER}
                      alt={gig.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    {/* Status Badge */}
                    <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
                      gig.isActive 
                        ? "bg-emerald-500/90 text-white" 
                        : "bg-red-500/90 text-white"
                    }`}>
                      {gig.isActive ? <FaCheckCircle className="text-[8px]" /> : <FaPause className="text-[8px]" />}
                      {gig.isActive ? "Active" : "Paused"}
                    </div>

                    {/* Price Badge */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/70 rounded-lg text-xs font-semibold text-green-400">
                      <FaRupeeSign className="text-[10px]" />
                      {gig.price}
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="font-semibold text-white light:text-slate-900 text-sm mb-0.5 truncate">{gig.title}</h3>
                    <p className="text-gray-500 light:text-slate-500 text-[10px] mb-2">{gig.category}</p>

                    <div className="flex items-center gap-3 text-[10px] text-gray-400 light:text-slate-500 mb-3">
                      <span className="flex items-center gap-1">
                        <FaClock className="text-blue-400" /> {gig.deliveryDays}d
                      </span>
                      <span className="flex items-center gap-1">
                        <FaShoppingCart className="text-orange-400" /> {gig.totalOrders || 0}
                      </span>
                      {gig.rating > 0 && (
                        <span className="flex items-center gap-1 text-yellow-400">
                          <FaStar /> {gig.rating.toFixed(1)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <FaEye className="text-purple-400" /> {gig.views || 0}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-white/10 light:border-slate-100">
                      <button
                        onClick={() => handleToggleStatus(gig._id, gig.isActive)}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                          gig.isActive
                            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                        }`}
                      >
                        {gig.isActive ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                      <button
                        onClick={() => navigate(`/edit-gig/${gig._id}`)}
                        className="p-1.5 rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                      >
                        <FaEdit className="text-xs" />
                      </button>
                      <button
                        onClick={() => handleDelete(gig._id)}
                        className="p-1.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyGigs;
