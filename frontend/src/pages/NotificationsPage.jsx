import { useEffect, useState, useMemo } from "react";
import {
  HiOutlineBell,
  HiOutlineTrash,
  HiOutlineEnvelopeOpen,
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass,
  HiOutlineArchiveBox,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineEllipsisHorizontal,
  HiOutlineUserPlus,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineShieldCheck,
   
} from "react-icons/hi2";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import EditorNavbar from "../components/EditorNavbar";
import Sidebar from "../components/Sidebar";
import ClientNavbar from "../components/ClientNavbar";
import ClientSidebar from "../components/ClientSidebar";

const HighlightText = ({ text, highlight }) => {
  if (!highlight?.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="text-emerald-500 font-black decoration-emerald-500/30 underline-offset-2">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const NotificationsPage = () => {
  const { backendURL, fetchNotifications, user } = useAppContext();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

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
      fetchNotifications?.();
    } catch (error) {
      console.error("markAsRead error", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${backendURL}/api/notifications/read/all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      fetchNotifications?.();
      toast.success("All caught up!");
    } catch (error) {
      console.error("markAllAsRead error", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${backendURL}/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      setSelectedIds(prev => prev.filter(sid => sid !== id));
      toast.success("Notification removed");
    } catch (error) {
      console.error("deleteNotification error", error);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.info("No notifications selected");
      return;
    }
    
    if (!confirm(`Delete ${selectedIds.length} selected notifications?`)) return;

    try {
      setLoading(true);
      await Promise.all(selectedIds.map(id => axios.delete(`${backendURL}/api/notifications/${id}`)));
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n._id)));
      setSelectedIds([]);
      setIsSelectMode(false);
      fetchNotifications?.();
      toast.success("Selected notifications deleted");
    } catch (error) {
      toast.error("Failed to delete some notifications");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const onHandleFollowRequest = async (requestId, followRequestId, status) => {
    try {
      await axios.post(`${backendURL}/api/user/follow-request/${followRequestId}/${status}`);
      toast.success(`Request ${status}`);
      await axios.put(`${backendURL}/api/notifications/read/${requestId}`);
      loadNotifications();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to handle request");
    }
  };

  // Grouping logic
  const groupedNotifications = useMemo(() => {
    const sorted = [...notifications]
      .filter(n => {
        if (filter === "unread" && n.isRead) return false;
        if (searchQuery && !n.title?.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !n.message?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);

    const groups = { Today: [], Yesterday: [], Earlier: [] };
    
    sorted.forEach(n => {
      const date = new Date(n.createdAt);
      if (date >= today) groups.Today.push(n);
      else if (date >= yesterday) groups.Yesterday.push(n);
      else groups.Earlier.push(n);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [notifications, filter, searchQuery]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const NotificationIcon = ({ notification }) => {
    const type = notification.type || "info";
    const title = notification.title?.toLowerCase() || "";

    if (notification.sender && (type === "follow" || type === "follow_request" || type === "follow_accept")) {
      return (
        <div className="relative">
          <img 
            src={notification.sender.profilePicture || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
            alt=""
            className="w-11 h-11 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
          />
          {type === "follow_request" && (
            <div className="absolute -bottom-1 -right-1 bg-violet-500 text-white p-1 rounded-full border-2 border-white dark:border-zinc-900">
              <HiOutlineUserPlus className="w-2.5 h-2.5" />
            </div>
          )}
        </div>
      );
    }

    const getIconData = () => {
      if (title.includes("order") || title.includes("payment")) 
        return { icon: HiOutlineSparkles, bg: "bg-emerald-500", shadow: "shadow-emerald-500/20" };
      if (title.includes("kyc") || title.includes("verified")) 
        return { icon: HiOutlineShieldCheck, bg: "bg-blue-500", shadow: "shadow-blue-500/20" };
      return { icon: HiOutlineBell, bg: "bg-zinc-500", shadow: "shadow-zinc-500/20" };
    };

    const { icon: Icon, bg, shadow } = getIconData();
    return (
      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white ${bg} ${shadow} shadow-lg`}>
        <Icon className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#000000] flex text-zinc-900 dark:text-zinc-100" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {isEditor ? (
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      ) : (
        <ClientSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}

      <div className="flex-1 md:ml-64 transition-all flex flex-col min-w-0">
        {isEditor ? (
          <EditorNavbar onMenuClick={() => setIsSidebarOpen(true)} />
        ) : (
          <ClientNavbar onMenuClick={() => setIsSidebarOpen(true)} />
        )}

        <main className="flex-1 w-full max-w-2xl mx-auto py-6 px-4 md:px-0">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center bg-emerald-500 text-white min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold align-middle">
                  {unreadCount}
                </span>
              )}
            </h1>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => {
                    setIsSelectMode(!isSelectMode);
                    if (isSelectMode) setSelectedIds([]);
                  }}
                  title="Select mode"
                  className={`p-2 rounded-full transition-all ${isSelectMode ? "bg-emerald-500 text-white" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
                >
                  <HiOutlineCheck className="w-5 h-5" />
                </button>
                <span className="text-[10px] font-bold text-zinc-400 mt-0.5">Select</span>
              </div>

              <div className="flex flex-col items-center">
                <button
                  onClick={() => {
                    if (isSelectMode) {
                      handleDeleteSelected();
                    } else {
                      if (confirm("Clear all notifications?")) {
                        notifications.forEach(n => deleteNotification(n._id));
                      }
                    }
                  }}
                  title={isSelectMode ? "Delete selected" : "Clear all"}
                  className={`p-2 rounded-full transition-all ${isSelectMode && selectedIds.length > 0 ? "text-red-500 bg-red-50 dark:bg-red-500/10" : "text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"}`}
                >
                  <HiOutlineTrash className="w-5 h-5" />
                </button>
                <span className="text-[10px] font-bold text-zinc-400 mt-0.5">Delete</span>
              </div>
            </div>
          </div>

          {/* Inline Filters & Search */}
          <div className="flex flex-col md:flex-row items-center gap-3 mb-8">
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
              {["all", "unread"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-all border
                    ${filter === f 
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white" 
                      : "bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="relative flex-1 w-full">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-full text-xs focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-zinc-100 dark:bg-zinc-900 rounded w-1/4" />
                    <div className="h-3 bg-zinc-100 dark:bg-zinc-900 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : groupedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-6">
                <HiOutlineBell className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
              </div>
              <h2 className="text-lg font-black mb-2">No notifications yet</h2>
              <p className="text-sm text-zinc-500 max-w-[240px]">
                {filter === "unread" ? "You're all caught up for now!" : "Updates including followers, orders, and system alerts appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedNotifications.map(([group, items]) => (
                <section key={group}>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
                      {group}
                    </h3>
                  </div>

                  <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-black">
                    <AnimatePresence mode="popLayout">
                      {items.map((n) => (
                        <motion.div
                          key={n._id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`group relative px-6 py-5 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all border-b last:border-0 border-zinc-100 dark:border-zinc-800 ${!n.isRead ? "bg-emerald-50/20 dark:bg-emerald-500/5" : ""} cursor-pointer`}
                          onClick={() => {
                            if (isSelectMode) {
                              toggleSelect(n._id);
                            } else {
                              if (!n.isRead) markAsRead(n._id);
                              setSelectedNotification(n);
                            }
                          }}
                        >
                          {isSelectMode && (
                            <div className="shrink-0">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedIds.includes(n._id) ? "bg-emerald-500 border-emerald-500" : "border-zinc-300 dark:border-zinc-700"}`}>
                                {selectedIds.includes(n._id) && (
                                  <HiOutlineCheck className="w-3.5 h-3.5 text-white" />
                                )}
                              </div>
                            </div>
                          )}
                          {!n.isRead && (
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full" />
                          )}

                          <div className="shrink-0 pt-0.5">
                            <NotificationIcon notification={n} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className={`text-[13px] leading-tight ${!n.isRead ? "font-black text-black dark:text-white" : "font-medium text-zinc-600 dark:text-zinc-400"}`}>
                                <span className={`${!n.isRead ? "text-zinc-900 dark:text-white" : "text-zinc-900 dark:text-zinc-200"}`}>
                                  <HighlightText text={n.title} highlight={searchQuery} />
                                </span>{" "}
                                <span className="text-zinc-500 dark:text-zinc-500">
                                  <HighlightText text={n.message} highlight={searchQuery} />
                                </span>
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600 flex items-center gap-1.5">
                                <HiOutlineClock className="w-3 h-3" />
                                {(() => {
                                  const diff = Date.now() - new Date(n.createdAt);
                                  const hours = Math.floor(diff / 3600000);
                                  const mins = Math.floor(diff / 60000);
                                  if (mins < 60) return `${mins}m`;
                                  if (hours < 24) return `${hours}h`;
                                  return new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
                                })()}
                              </span>
                            </div>

                            {n.type === "follow_request" && !n.isRead && (
                              <div className="flex items-center gap-2 mt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onHandleFollowRequest(n._id, n.metaData?.followRequestId, "accepted");
                                  }}
                                  className="px-5 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-black rounded-lg hover:opacity-90 transition-all shadow-lg shadow-black/10 flex items-center gap-1.5"
                                >
                                  <HiOutlineCheck className="w-3.5 h-3.5" /> Accept
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onHandleFollowRequest(n._id, n.metaData?.followRequestId, "rejected");
                                  }}
                                  className="px-5 py-1.5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-[11px] font-black rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5"
                                >
                                  <HiOutlineXMark className="w-3.5 h-3.5" /> Decline
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotification(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-100 dark:border-zinc-800"
            >
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <NotificationIcon notification={selectedNotification} />
                    <div>
                      <h3 className="text-xl font-black leading-tight">
                        <HighlightText text={selectedNotification.title} highlight={searchQuery} />
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                        {new Date(selectedNotification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedNotification(null)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  >
                    <HiOutlineXMark className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="p-5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-semibold">
                      <HighlightText text={selectedNotification.message} highlight={searchQuery} />
                    </p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        deleteNotification(selectedNotification._id);
                        setSelectedNotification(null);
                      }}
                      className="px-6 py-2.5 text-red-500 font-black text-xs hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      Delete Notification
                    </button>
                    <button
                      onClick={() => setSelectedNotification(null)}
                      className="px-8 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black text-xs rounded-xl hover:opacity-90 transition-all shadow-xl shadow-zinc-950/20"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsPage;
