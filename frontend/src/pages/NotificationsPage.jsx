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
    const [filter, setFilter] = useState("all"); // all, unread
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, [backendURL]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${backendURL}/api/notifications?limit=50`);
            setNotifications(res.data.notifications);
            fetchNotifications(); // Update global count
        } catch (error) {
            console.error("Error loading notifications:", error);
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
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put(`${backendURL}/api/notifications/read/all`);
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            fetchNotifications();
            toast.success("All marked as read");
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await axios.delete(`${backendURL}/api/notifications/${id}`);
            setNotifications((prev) => prev.filter((n) => n._id !== id));
            if (selectedNotification?._id === id) setSelectedNotification(null);
            toast.success("Notification removed");
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case "success":
                return <HiCheckCircle className="text-green-500 text-2xl" />;
            case "warning":
                return <HiExclamationTriangle className="text-yellow-500 text-2xl" />;
            case "error":
                return <HiXCircle className="text-red-500 text-2xl" />;
            default:
                return <HiInformationCircle className="text-blue-500 text-2xl" />;
        }
    };

    const filteredNotifications = notifications.filter((n) =>
        filter === "unread" ? !n.isRead : true
    );

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-900">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 md:ml-64 transition-all duration-300 flex flex-col">
                {/* Navbar */}
                <EditorNavbar onMenuClick={() => setIsSidebarOpen(true)} />

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full pt-6 md:pt-24">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-gray-900">
                                <div className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                                    <HiBell className="text-green-600" />
                                </div>
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                                        {unreadCount} new
                                    </span>
                                )}
                            </h1>
                            <p className="text-gray-500 mt-2 ml-1 text-sm md:text-base">
                                Manage your alerts and updates
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-full md:w-auto">
                                <button
                                    onClick={() => setFilter("all")}
                                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${filter === "all"
                                        ? "bg-gray-900 text-white shadow-md"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter("unread")}
                                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${filter === "unread"
                                        ? "bg-gray-900 text-white shadow-md"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    Unread
                                </button>
                            </div>

                            {notifications.some((n) => !n.isRead) && (
                                <button
                                    onClick={markAllAsRead}
                                    className="flex-1 md:flex-none px-4 py-2 rounded-xl font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-green-600 transition-all flex items-center justify-center gap-2 shadow-sm text-sm whitespace-nowrap"
                                >
                                    <HiEnvelopeOpen className="text-lg" /> Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="h-24 bg-white rounded-2xl shadow-sm animate-pulse border border-gray-100"
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
                                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className={`relative bg-white p-4 md:p-5 rounded-2xl shadow-sm border transition-all hover:shadow-md cursor-pointer group overflow-hidden ${!notification.isRead
                                            ? "border-green-500/30 bg-green-50/10"
                                            : "border-gray-100 hover:border-gray-200"
                                            }`}
                                        onClick={() => {
                                            setSelectedNotification(notification);
                                            if (!notification.isRead) markAsRead(notification._id);
                                        }}
                                    >
                                        {/* Unread Dot */}
                                        {!notification.isRead && (
                                            <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm animate-pulse" />
                                        )}

                                        <div className="flex gap-4 items-start">
                                            <div className={`mt-0.5 p-2.5 md:p-3 rounded-xl shadow-sm shrink-0 ${!notification.isRead ? "bg-white" : "bg-gray-50"
                                                }`}>
                                                {getIcon(notification.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1 pr-6">
                                                    <h3 className={`font-bold text-base md:text-lg truncate ${!notification.isRead ? "text-gray-900" : "text-gray-700"
                                                        }`}>
                                                        {notification.title}
                                                    </h3>
                                                </div>
                                                <p className={`line-clamp-2 text-sm leading-relaxed mb-2 ${!notification.isRead ? "text-gray-800 font-medium" : "text-gray-500"
                                                    }`}>
                                                    {notification.message}
                                                </p>
                                                <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md inline-block">
                                                    {new Date(notification.createdAt).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>

                                            <div className="hidden md:flex flex-col justify-center self-center opacity-0 group-hover:opacity-100 transition-opacity pl-2 border-l border-gray-100 ml-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification._id);
                                                    }}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Delete"
                                                >
                                                    <HiTrash className="text-xl" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {filteredNotifications.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200"
                                >
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 text-4xl">
                                        <HiBell />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        No notifications found
                                    </h3>
                                    <p className="text-gray-500 max-w-xs mx-auto text-sm">
                                        {filter === "unread"
                                            ? "You have no unread notifications."
                                            : "You're all caught up! We'll notify you when something important happens."}
                                    </p>
                                    {filter === "unread" && (
                                        <button
                                            onClick={() => setFilter("all")}
                                            className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-gray-800 transition-all"
                                        >
                                            View All
                                        </button>
                                    )}
                                </motion.div>
                            )}
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
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 md:p-8 overflow-y-auto">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3.5 bg-gray-50 rounded-2xl shadow-inner text-gray-700">
                                            {getIcon(selectedNotification.type)}
                                        </div>
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                                                {selectedNotification.title}
                                            </h2>
                                            <p className="text-sm text-gray-500 mt-1 font-medium">
                                                {new Date(selectedNotification.createdAt).toLocaleString(undefined, {
                                                    dateStyle: 'full',
                                                    timeStyle: 'short'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedNotification(null)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                    >
                                        <HiXMark className="text-2xl" />
                                    </button>
                                </div>

                                <div className="prose prose-lg max-w-none text-gray-600 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 text-base leading-relaxed">
                                    {selectedNotification.message}
                                </div>
                            </div>

                            <div className="bg-gray-50 px-6 md:px-8 py-4 flex justify-between items-center border-t border-gray-100 shrink-0">
                                <button
                                    onClick={() => deleteNotification(selectedNotification._id)}
                                    className="px-4 py-2 text-red-500 font-semibold hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 text-sm"
                                >
                                    <HiTrash /> Delete
                                </button>
                                <button
                                    onClick={() => setSelectedNotification(null)}
                                    className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default NotificationsPage;
