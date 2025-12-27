/**
 * NotificationsPage - Advanced Professional Design
 * Features: Time grouping, Type filters, Search, Beautiful UI
 * Dark base with light: variant overrides
 */

import { useEffect, useState, useMemo } from "react";
import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineXCircle,
  HiOutlineInformationCircle,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineEnvelopeOpen,
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass,
  HiOutlineArchiveBox,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineChevronDown,
  HiOutlineCurrencyRupee,
  HiOutlineDocumentCheck,
  HiOutlineChatBubbleLeftRight,
  HiOutlineUserCircle,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import EditorNavbar from "../components/EditorNavbar";
import Sidebar from "../components/Sidebar";
import ClientNavbar from "../components/ClientNavbar";
import ClientSidebar from "../components/ClientSidebar";

const NotificationsPage = () => {
  const { backendURL, fetchNotifications, user } = useAppContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const isEditor = user?.role === "editor";

  useEffect(() => {
    loadNotifications();
  }, [backendURL]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendURL}/api/notifications?limit=100`);
      setNotifications(res.data.notifications || []);
      fetchNotifications?.();
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${backendURL}/api/notifications/read/${id}`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("markAsRead error", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${backendURL}/api/notifications/read/all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      fetchNotifications?.();
      toast.success("All marked as read");
    } catch (error) {
      console.error("markAllAsRead error", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${backendURL}/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (selectedNotification?._id === id) setSelectedNotification(null);
      toast.success("Deleted");
    } catch (error) {
      console.error("deleteNotification error", error);
    }
  };

  const clearAll = async () => {
    if (!confirm("Delete all notifications?")) return;
    try {
      await Promise.all(notifications.map(n => axios.delete(`${backendURL}/api/notifications/${n._id}`)));
      setNotifications([]);
      toast.success("All notifications cleared");
    } catch (error) {
      console.error("clearAll error", error);
    }
  };

  // Group by time
  const groupByTime = (notifs) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const lastWeek = new Date(today.getTime() - 7 * 86400000);

    const groups = { today: [], yesterday: [], thisWeek: [], earlier: [] };
    
    notifs.forEach(n => {
      const date = new Date(n.createdAt);
      if (date >= today) groups.today.push(n);
      else if (date >= yesterday) groups.yesterday.push(n);
      else if (date >= lastWeek) groups.thisWeek.push(n);
      else groups.earlier.push(n);
    });

    return groups;
  };

  // Get icon based on notification type/category
  const getIcon = (notification) => {
    const type = notification.type || "info";
    const title = notification.title?.toLowerCase() || "";

    if (title.includes("order") || title.includes("payment")) 
      return { icon: HiOutlineCurrencyRupee, color: "text-emerald-500", bg: "bg-emerald-500/10" };
    if (title.includes("message") || title.includes("chat")) 
      return { icon: HiOutlineChatBubbleLeftRight, color: "text-blue-500", bg: "bg-blue-500/10" };
    if (title.includes("kyc") || title.includes("verified")) 
      return { icon: HiOutlineShieldCheck, color: "text-violet-500", bg: "bg-violet-500/10" };
    if (title.includes("profile")) 
      return { icon: HiOutlineUserCircle, color: "text-cyan-500", bg: "bg-cyan-500/10" };
    if (title.includes("complete") || title.includes("success")) 
      return { icon: HiOutlineDocumentCheck, color: "text-green-500", bg: "bg-green-500/10" };

    switch (type) {
      case "success": return { icon: HiOutlineCheckCircle, color: "text-green-500", bg: "bg-green-500/10" };
      case "warning": return { icon: HiOutlineExclamationTriangle, color: "text-amber-500", bg: "bg-amber-500/10" };
      case "error": return { icon: HiOutlineXCircle, color: "text-red-500", bg: "bg-red-500/10" };
      default: return { icon: HiOutlineInformationCircle, color: "text-blue-500", bg: "bg-blue-500/10" };
    }
  };

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filter === "unread" && n.isRead) return false;
      if (typeFilter !== "all" && n.type !== typeFilter) return false;
      if (searchQuery && !n.title?.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !n.message?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [notifications, filter, typeFilter, searchQuery]);

  const groupedNotifications = groupByTime(filteredNotifications);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const NotificationCard = ({ notification, index }) => {
    const { icon: Icon, color, bg } = getIcon(notification);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: index * 0.02 }}
        className={`relative rounded-2xl border overflow-hidden cursor-pointer group transition-all
          ${!notification.isRead 
            ? "bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent light:from-emerald-50 light:via-teal-50/50 light:to-white border-emerald-500/30 light:border-emerald-300 shadow-lg shadow-emerald-500/5" 
            : "bg-zinc-900/50 light:bg-white border-zinc-800/50 light:border-zinc-200 hover:bg-zinc-800/50 light:hover:bg-zinc-50"
          }`}
        onClick={() => {
          setSelectedNotification(notification);
          if (!notification.isRead) markAsRead(notification._id);
        }}
      >
        {/* Left accent bar for unread */}
        {!notification.isRead && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-500" />
        )}

        <div className="flex gap-4 p-4 pl-5">
          {/* Icon with glow for unread */}
          <div className={`relative p-3 rounded-xl ${!notification.isRead ? "bg-emerald-500/20 light:bg-emerald-100" : bg} shrink-0`}>
            <Icon className={`w-5 h-5 ${!notification.isRead ? "text-emerald-400 light:text-emerald-600" : color}`} />
            {!notification.isRead && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900 light:border-white animate-pulse" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className={`font-bold text-sm truncate ${!notification.isRead ? "text-white light:text-zinc-900" : "text-zinc-300 light:text-zinc-700"}`}>
                {notification.title}
              </h3>
              
              {/* Unread Badge */}
              {!notification.isRead && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wide shrink-0 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  New
                </span>
              )}
              
              <span className="text-[10px] text-zinc-500 whitespace-nowrap ml-auto shrink-0">{formatTime(notification.createdAt)}</span>
            </div>
            <p className={`text-xs line-clamp-2 ${!notification.isRead ? "text-zinc-300 light:text-zinc-600" : "text-zinc-500 light:text-zinc-500"}`}>
              {notification.message}
            </p>
            
            {/* Bottom info */}
            <div className="flex items-center gap-3 mt-2">
              {notification.isRead ? (
                <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                  <HiOutlineCheckCircle className="w-3 h-3 text-emerald-500" /> Read
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Tap to view
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2 border-l border-zinc-800/50 light:border-zinc-200">
            {!notification.isRead && (
              <button
                onClick={(e) => { e.stopPropagation(); markAsRead(notification._id); }}
                className="p-2 rounded-lg hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400 transition-all"
                title="Mark as read"
              >
                <HiOutlineCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id); }}
              className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all"
              title="Delete"
            >
              <HiOutlineTrash className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
        )}
      </motion.div>
    );
  };

  const TimeGroup = ({ title, notifications, icon: Icon }) => {
    if (!notifications.length) return null;
    
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Icon className="w-4 h-4 text-zinc-500" />
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{title}</h4>
          <span className="text-[10px] text-zinc-600 bg-zinc-800/50 light:bg-zinc-100 px-2 py-0.5 rounded-full">
            {notifications.length}
          </span>
        </div>
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {notifications.map((n, i) => <NotificationCard key={n._id} notification={n} index={i} />)}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090B] light:bg-[#FAFAFA] flex text-white light:text-zinc-900" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {isEditor ? (
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      ) : (
        <ClientSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}

      <div className="flex-1 md:ml-64 transition-all flex flex-col">
        {isEditor ? (
          <EditorNavbar onMenuClick={() => setIsSidebarOpen(true)} />
        ) : (
          <ClientNavbar onMenuClick={() => setIsSidebarOpen(true)} />
        )}

        <main className="flex-1 p-4 md:p-6 w-full max-w-4xl mx-auto pt-6 md:pt-20">
          
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 light:bg-emerald-50 rounded-xl">
                  <HiOutlineBell className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>Notifications</h1>
                  <p className="text-xs text-zinc-500">
                    {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-3 py-2 bg-zinc-800/60 light:bg-white border border-zinc-700 light:border-zinc-200 rounded-lg text-xs font-medium hover:bg-zinc-700 light:hover:bg-zinc-50 transition-all flex items-center gap-1.5"
                  >
                    <HiOutlineEnvelopeOpen className="w-4 h-4" /> Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="px-3 py-2 bg-zinc-800/60 light:bg-white border border-zinc-700 light:border-zinc-200 rounded-lg text-xs font-medium hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all flex items-center gap-1.5"
                  >
                    <HiOutlineArchiveBox className="w-4 h-4" /> Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 light:bg-white border border-zinc-800 light:border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex p-1 bg-zinc-900/60 light:bg-white border border-zinc-800 light:border-zinc-200 rounded-xl">
                {["all", "unread"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      filter === f 
                        ? "bg-emerald-500 text-white" 
                        : "text-zinc-400 hover:text-white light:hover:text-zinc-900"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 border rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                  typeFilter !== "all" 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : "bg-zinc-900/60 light:bg-white border-zinc-800 light:border-zinc-200 text-zinc-400"
                }`}
              >
                <HiOutlineFunnel className="w-4 h-4" />
                Type
                <HiOutlineChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Type Filter Dropdown */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 mt-3 p-3 bg-zinc-900/40 light:bg-zinc-50 border border-zinc-800/60 light:border-zinc-200 rounded-xl">
                    {["all", "info", "success", "warning", "error"].map((type) => (
                      <button
                        key={type}
                        onClick={() => { setTypeFilter(type); setShowFilters(false); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                          typeFilter === type 
                            ? "bg-emerald-500 text-white" 
                            : "bg-zinc-800/60 light:bg-white text-zinc-400 hover:text-white light:hover:text-zinc-900 border border-zinc-700 light:border-zinc-200"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-zinc-900/40 light:bg-zinc-100 animate-pulse" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800/50 light:bg-zinc-100 flex items-center justify-center">
                <HiOutlineBell className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No notifications</h3>
              <p className="text-sm text-zinc-500">
                {filter === "unread" ? "All caught up!" : "You'll see updates here"}
              </p>
              {filter === "unread" && notifications.length > 0 && (
                <button
                  onClick={() => setFilter("all")}
                  className="mt-4 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-all"
                >
                  View all notifications
                </button>
              )}
            </motion.div>
          ) : (
            <div>
              <TimeGroup title="Today" notifications={groupedNotifications.today} icon={HiOutlineSparkles} />
              <TimeGroup title="Yesterday" notifications={groupedNotifications.yesterday} icon={HiOutlineClock} />
              <TimeGroup title="This Week" notifications={groupedNotifications.thisWeek} icon={HiOutlineClock} />
              <TimeGroup title="Earlier" notifications={groupedNotifications.earlier} icon={HiOutlineArchiveBox} />
            </div>
          )}
        </main>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedNotification(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-zinc-800 light:border-zinc-100">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${getIcon(selectedNotification).bg}`}>
                    {(() => { const { icon: Icon, color } = getIcon(selectedNotification); return <Icon className={`w-6 h-6 ${color}`} />; })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold mb-1">{selectedNotification.title}</h2>
                    <p className="text-xs text-zinc-500">
                      {new Date(selectedNotification.createdAt).toLocaleString(undefined, { 
                        dateStyle: 'medium', timeStyle: 'short' 
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="p-2 hover:bg-zinc-800 light:hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400"
                  >
                    <HiOutlineXMark className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-sm text-zinc-300 light:text-zinc-600 leading-relaxed">
                  {selectedNotification.message}
                </p>
              </div>

              {/* Footer */}
              <div className="p-4 bg-zinc-800/50 light:bg-zinc-50 border-t border-zinc-800 light:border-zinc-100 flex justify-between">
                <button
                  onClick={() => deleteNotification(selectedNotification._id)}
                  className="px-4 py-2 text-red-500 font-medium text-sm hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                >
                  <HiOutlineTrash className="w-4 h-4" /> Delete
                </button>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm rounded-lg transition-colors"
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

export default NotificationsPage;
