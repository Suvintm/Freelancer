// ===============================
// PART 1 — IMPORTS + MAIN LAYOUT
// ===============================

import { useEffect, useState } from "react";
import {
  HiBell,
  HiCheckCircle,
  HiExclamationTriangle,
  HiXCircle,
  HiInformationCircle,
  HiTrash,
  HiCheck,
  HiXMark,
  HiChevronRight,
  HiEnvelopeOpen,
} from "react-icons/hi2";

import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import EditorNavbar from "../components/EditorNavbar";
import Sidebar from "../components/Sidebar";

const NotificationsPage = () => {
  const { backendURL, fetchNotifications } = useAppContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load notifications
  useEffect(() => {
    loadNotifications();
  }, [backendURL]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendURL}/api/notifications?limit=50`);
      setNotifications(res.data.notifications);
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${backendURL}/api/notifications/read/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      fetchNotifications();
    } catch (error) {}
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${backendURL}/api/notifications/read/all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      fetchNotifications();
      toast.success("All marked as read");
    } catch (error) {}
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${backendURL}/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (selectedNotification?._id === id) setSelectedNotification(null);
      toast.success("Notification removed");
    } catch (error) {}
  };

  // Icons based on type
  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <HiCheckCircle className="text-green-400 text-2xl" />;
      case "warning":
        return <HiExclamationTriangle className="text-yellow-400 text-2xl" />;
      case "error":
        return <HiXCircle className="text-red-500 text-2xl" />;
      default:
        return <HiInformationCircle className="text-blue-400 text-2xl" />;
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === "unread" ? !n.isRead : true
  );
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#050509] flex text-white">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* MAIN CONTAINER */}
      <div className="flex-1 md:ml-64 transition-all duration-300 flex flex-col">
        <EditorNavbar onMenuClick={() => setIsSidebarOpen(true)} />

        {/* CONTENT WRAPPER */}
        <main className="flex-1 p-4 md:p-8 w-full max-w-5xl mx-auto pt-6 md:pt-24">

          {/* PAGE HEADER */}
          <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-0 mb-10">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold flex items-center gap-3"
              >
                <div className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg">
                  <HiBell className="text-blue-400 text-2xl" />
                </div>
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </motion.h1>

              <p className="text-gray-400 mt-2 ml-1">
                Stay updated with your latest alerts
              </p>
            </div>

            {/* FILTER BUTTONS */}
            <div className="flex flex-wrap gap-3">
              <div className="flex bg-white/5 backdrop-blur-xl border border-white/10 p-1 rounded-2xl shadow-lg">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                    filter === "all"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  All
                </button>

                <button
                  onClick={() => setFilter("unread")}
                  className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                    filter === "unread"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Unread
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:text-blue-400 transition-all flex items-center gap-2 backdrop-blur-xl"
                >
                  <HiEnvelopeOpen className="text-lg" />
                  Mark all read
                </button>
              )}
            </div>
          </div>
          {/* NOTIFICATIONS LIST */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="h-24 rounded-2xl bg-white/5 border border-white/10 shadow-[0_18px_45px_rgba(0,0,0,0.9)] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4 pb-20">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification._id}
                    layout
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{
                      opacity: 0,
                      y: -10,
                      scale: 0.96,
                      transition: { duration: 0.18 },
                    }}
                    transition={{
                      duration: 0.28,
                      delay: index * 0.035,
                      type: "spring",
                      stiffness: 260,
                      damping: 22,
                    }}
                    className={`relative rounded-2xl border backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,0.85)] overflow-hidden cursor-pointer group
                      ${
                        !notification.isRead
                          ? "border-blue-500/40 bg-blue-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }
                    `}
                    onClick={() => {
                      setSelectedNotification(notification);
                      if (!notification.isRead) markAsRead(notification._id);
                    }}
                  >
                    {/* Subtle gradient overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Unread badge */}
                    {!notification.isRead && (
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-4 right-4 flex items-center gap-1 bg-red-600/90 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg"
                      >
                        <span className="w-2 h-2 rounded-full bg-white" />
                        New
                      </motion.div>
                    )}

                    <div className="flex gap-4 items-start p-4 md:p-5">
                      {/* Icon bubble */}
                      <div
                        className={`mt-0.5 p-3 rounded-2xl shrink-0 shadow-[0_12px_30px_rgba(0,0,0,0.7)]
                          ${
                            !notification.isRead
                              ? "bg-blue-950/60 border border-blue-500/40"
                              : "bg-black/40 border border-white/10"
                          }
                        `}
                      >
                        {getIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1 pr-2">
                          <h3
                            className={`font-semibold text-base md:text-lg truncate
                              ${
                                !notification.isRead
                                  ? "text-white"
                                  : "text-gray-200"
                              }
                            `}
                          >
                            {notification.title}
                          </h3>
                        </div>

                        <p
                          className={`text-sm leading-relaxed mb-2 line-clamp-2
                            ${
                              !notification.isRead
                                ? "text-gray-100"
                                : "text-gray-400"
                            }
                          `}
                        >
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
                            {new Date(
                              notification.createdAt
                            ).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>

                          {notification.isRead ? (
                            <span className="inline-flex items-center gap-1 text-emerald-300/80">
                              <HiCheck className="text-xs" /> Read
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-blue-300/80">
                              <HiChevronRight className="text-xs" /> Tap to
                              open
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete button (desktop only) */}
                      <div className="hidden md:flex flex-col justify-center self-center opacity-0 group-hover:opacity-100 transition-opacity pl-3 ml-1 border-l border-white/10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Delete"
                        >
                          <HiTrash className="text-lg" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* EMPTY STATE */}
              {filteredNotifications.length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="rounded-3xl border border-dashed border-white/15 bg-white/5 backdrop-blur-xl text-center py-20 px-6 shadow-[0_18px_45px_rgba(0,0,0,0.9)]"
                >
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/15 flex items-center justify-center mx-auto mb-6 text-gray-300 text-4xl shadow-inner">
                    <HiBell />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">
                    No notifications found
                  </h3>

                  <p className="text-gray-400 max-w-sm mx-auto text-sm">
                    {filter === "unread"
                      ? "You have no unread notifications at the moment."
                      : "You're all caught up! We'll let you know when something new arrives."}
                  </p>

                  {filter === "unread" && (
                    <button
                      onClick={() => setFilter("all")}
                      className="mt-6 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-all shadow-[0_12px_35px_rgba(37,99,235,0.7)]"
                    >
                      View all notifications
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </main>
      </div>
     {/* Detail Modal */} <AnimatePresence> {selectedNotification && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedNotification(null)} > <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()} > <div className="p-6 md:p-8 overflow-y-auto"> <div className="flex justify-between items-start mb-6"> <div className="flex items-center gap-4"> <div className="p-3.5 bg-gray-50 rounded-2xl shadow-inner text-gray-700"> {getIcon(selectedNotification.type)} </div> <div> <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight"> {selectedNotification.title} </h2> <p className="text-sm text-gray-500 mt-1 font-medium"> {new Date(selectedNotification.createdAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })} </p> </div> </div> <button onClick={() => setSelectedNotification(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600" > <HiXMark className="text-2xl" /> </button> </div> <div className="prose prose-lg max-w-none text-gray-600 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 text-base leading-relaxed"> {selectedNotification.message} </div> </div> <div className="bg-gray-50 px-6 md:px-8 py-4 flex justify-between items-center border-t border-gray-100 shrink-0"> <button onClick={() => deleteNotification(selectedNotification._id)} className="px-4 py-2 text-red-500 font-semibold hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 text-sm" > <HiTrash /> Delete </button> <button onClick={() => setSelectedNotification(null)} className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm" > Close </button> </div> </motion.div> </motion.div> )} </AnimatePresence> </div > ); }; export default NotificationsPage;
