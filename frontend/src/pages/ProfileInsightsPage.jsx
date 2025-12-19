/**
 * ProfileInsightsPage
 * Shows visitor analytics and visitor list (requires subscription)
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiEye,
  HiUserGroup,
  HiChartPie,
  HiArrowDownTray,
  HiArrowPath,
  HiLockClosed,
  HiSparkles,
  HiUser,
} from "react-icons/hi2";
import { FaCrown, FaBuilding, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import EditorNavbar from "../components/EditorNavbar";
import { useSubscription } from "../context/SubscriptionContext";
import { useAppContext } from "../context/AppContext";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const ProfileInsightsPage = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const { hasActiveSubscription, checkFeatureSubscription, getSubscription } =
    useSubscription();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [stats, setStats] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filter, setFilter] = useState("all");

  // Check subscription status
  useEffect(() => {
    const check = async () => {
      const hasSub = await checkFeatureSubscription("profile_insights");
      setHasSubscription(hasSub);
      setSubscription(getSubscription("profile_insights"));
    };
    if (user) check();
  }, [user, checkFeatureSubscription, getSubscription]);

  // Fetch stats and visitors
  const fetchData = useCallback(async () => {
    if (!user?.token) return;

    setLoading(true);
    try {
      if (hasSubscription) {
        // Fetch full stats (Pro)
        const [statsRes, visitorsRes] = await Promise.all([
          axios.get(`${API_BASE}/api/profile-insights/stats`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`${API_BASE}/api/profile-insights/visitors`, {
            headers: { Authorization: `Bearer ${user.token}` },
            params: { page: pagination.page, role: filter },
          }),
        ]);
        setStats(statsRes.data.stats);
        setVisitors(visitorsRes.data.visitors);
        setPagination(visitorsRes.data.pagination);
      } else {
        // Fetch basic stats (Free)
        const res = await axios.get(
          `${API_BASE}/api/profile-insights/stats/basic`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setStats(res.data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch insights:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.token, hasSubscription, pagination.page, filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export visitors
  const handleExport = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/profile-insights/export`, {
        headers: { Authorization: `Bearer ${user.token}` },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `visitors-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="md:ml-64 pt-20 md:pt-24 px-4 md:px-8 pb-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HiEye className="text-2xl text-emerald-400" />
                <h1 className="text-2xl font-bold">Profile Insights</h1>
                {hasSubscription && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-zinc-400 text-sm">
                {hasSubscription
                  ? "See who's viewing your profile in the last 30 days"
                  : "Upgrade to see who's viewing your profile"}
              </p>
            </div>

            {hasSubscription && (
              <div className="flex gap-2">
                <button
                  onClick={fetchData}
                  className="p-2.5 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  <HiArrowPath className="text-lg" />
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
                >
                  <HiArrowDownTray />
                  Export CSV
                </button>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800"
            >
              <div className="flex items-center gap-2 mb-2">
                <HiEye className="text-blue-400" />
                <span className="text-xs text-zinc-500">Total Views</span>
              </div>
              <p className="text-2xl font-bold">{stats?.totalViews || 0}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800"
            >
              <div className="flex items-center gap-2 mb-2">
                <HiUserGroup className="text-emerald-400" />
                <span className="text-xs text-zinc-500">Unique Visitors</span>
              </div>
              <p className="text-2xl font-bold">{stats?.uniqueVisitors || 0}</p>
            </motion.div>

            {hasSubscription && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FaBuilding className="text-purple-400" />
                    <span className="text-xs text-zinc-500">Client Views</span>
                  </div>
                  <p className="text-2xl font-bold">{stats?.clientViews || 0}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FaEdit className="text-orange-400" />
                    <span className="text-xs text-zinc-500">Editor Views</span>
                  </div>
                  <p className="text-2xl font-bold">{stats?.editorViews || 0}</p>
                </motion.div>
              </>
            )}
          </div>

          {/* Main Content */}
          {!hasSubscription ? (
            // Locked State
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-zinc-900/30 rounded-2xl border border-zinc-800"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                <HiLockClosed className="text-2xl text-zinc-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Unlock Profile Insights
              </h2>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                See exactly who's viewing your profile. Know which clients are
                interested in your work.
              </p>

              {/* Blurred Preview */}
              <div className="relative max-w-2xl mx-auto mb-8">
                <div className="absolute inset-0 backdrop-blur-md bg-black/30 z-10 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <HiSparkles className="text-3xl text-amber-400 mx-auto mb-2" />
                    <p className="text-sm text-zinc-300">
                      Upgrade to see your visitors
                    </p>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-700"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-zinc-700 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-zinc-700/50 rounded w-20"></div>
                      </div>
                      <div className="h-3 bg-zinc-700/50 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate("/subscription/plans")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-colors"
              >
                <FaCrown />
                Upgrade to Pro
              </button>
            </motion.div>
          ) : (
            // Visitors List (Pro)
            <div>
              {/* Filter */}
              <div className="flex gap-2 mb-4">
                {["all", "client", "editor"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      filter === f
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                  >
                    {f === "all" ? "All" : f === "client" ? "Clients" : "Editors"}
                  </button>
                ))}
              </div>

              {/* Visitors */}
              <div className="space-y-3">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 animate-pulse"
                    >
                      <div className="w-12 h-12 rounded-full bg-zinc-800"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-zinc-800 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-zinc-800/50 rounded w-20"></div>
                      </div>
                    </div>
                  ))
                ) : visitors.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <HiUserGroup className="text-4xl mx-auto mb-3 opacity-50" />
                    <p>No visitors yet</p>
                    <p className="text-sm">
                      Share your profile to get more views
                    </p>
                  </div>
                ) : (
                  visitors.map((visit, i) => (
                    <motion.div
                      key={visit._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                      onClick={() =>
                        visit.visitor?._id &&
                        navigate(`/public-profile/${visit.visitor._id}`)
                      }
                    >
                      <img
                        src={
                          visit.visitorPicture ||
                          visit.visitor?.profilePicture ||
                          "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }
                        alt=""
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {visit.visitorName || visit.visitor?.name || "Anonymous"}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded ${
                              visit.visitorRole === "client"
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-orange-500/20 text-orange-400"
                            }`}
                          >
                            {visit.visitorRole}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500">
                          via {visit.source || "direct"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-zinc-400">
                          {formatDate(visit.visitedAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page }))
                        }
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          pagination.page === page
                            ? "bg-emerald-500 text-white"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* Subscription Info (if subscribed) */}
          {hasSubscription && subscription && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 p-4 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-xl border border-emerald-500/20"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <FaCrown className="text-lg text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{subscription.planName}</p>
                      {subscription.status === "trial" && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-400 rounded">TRIAL</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">
                      {subscription.status === "trial"
                        ? "Free trial period"
                        : "Active subscription"}
                    </p>
                  </div>
                </div>

                {/* Days Remaining Badge */}
                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    {(() => {
                      const endDate = new Date(subscription.endDate);
                      const now = new Date();
                      const diff = endDate - now;
                      const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
                      return (
                        <>
                          <p className={`text-2xl font-bold ${days <= 7 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {days}
                          </p>
                          <p className="text-[10px] text-zinc-500 uppercase">Days Left</p>
                        </>
                      );
                    })()}
                  </div>
                  <button
                    onClick={() => navigate("/subscription/plans")}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm text-white rounded-lg transition-colors"
                  >
                    Manage →
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfileInsightsPage;
