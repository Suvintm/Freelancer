import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FaHome,
  FaClipboardList,
  FaEnvelope,
  FaUserTie,
  FaTimes,
  FaCircle,
  FaHeart,
  FaCreditCard,
} from "react-icons/fa";
import { HiOutlineSun, HiOutlineMoon } from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/logo.png";

const ClientSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, backendURL } = useAppContext();
  const { theme, toggleTheme } = useTheme();

  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch counts for badges
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = user?.token;
        if (!token) return;

        // Fetch orders to count
        const ordersRes = await axios.get(`${backendURL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const orders = ordersRes.data.orders || [];
        // For client, count orders that are "in_progress" or "submitted" (active ones)
        const activeCount = orders.filter(o => 
          ["in_progress", "submitted"].includes(o.status)
        ).length;
        setNewOrdersCount(activeCount);

        // Count unread messages (accepted+ orders)
        const chatOrders = orders.filter(o => 
          ["accepted", "in_progress", "submitted"].includes(o.status)
        );
        setUnreadMessages(chatOrders.length);
      } catch (err) {
        console.error("Failed to fetch counts:", err);
      }
    };

    fetchCounts();
  }, [backendURL, user?.token]);

  const navItems = [
    { path: "/client-home", icon: FaHome, label: "Dashboard" },
    { path: "/client-orders", icon: FaClipboardList, label: "My Orders", badge: newOrdersCount },
    { path: "/payments", icon: FaCreditCard, label: "Payments" },
    { path: "/client-messages", icon: FaEnvelope, label: "Messages", badge: unreadMessages },
    { path: "/saved-editors", icon: FaHeart, label: "Saved Editors" },
    { path: "/client-profile", icon: FaUserTie, label: "Profile" },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`bg-[#050509] light:bg-white text-white light:text-slate-900 shadow-[0_18px_50px_rgba(0,0,0,0.9)] light:shadow-xl
        flex flex-col fixed top-0 left-0 z-50 h-screen transition-all duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        w-64 border-r border-[#111827] light:border-slate-200`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-emerald-600/20 light:border-slate-200 bg-[#050509] light:bg-white">
          <img
            onClick={() => handleNavigation("/")}
            src={logo}
            className="w-10 h-10 cursor-pointer"
            alt="SuviX"
          />
          <div>
            <h1
              onClick={() => handleNavigation("/")}
              className="text-lg font-semibold cursor-pointer hover:text-emerald-400 transition"
            >
              SuviX
            </h1>
            <p className="text-[11px] text-emerald-400/80 light:text-emerald-600">Client Workspace</p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden ml-auto text-[#9CA3AF] light:text-slate-600 hover:text-white light:hover:text-slate-900 text-lg"
          >
            <FaTimes />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 flex flex-col gap-2 overflow-y-auto relative">
          {navItems.map(({ path, icon: Icon, label, badge }) => {
            const isActive = location.pathname === path;

            return (
              <button
                key={path}
                onClick={() => handleNavigation(path)}
                className={`
                  relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium
                  transition-all overflow-hidden
                  ${isActive
                    ? "text-white light:text-emerald-600"
                    : "text-[#9CA3AF] light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-[#0A0D14] light:hover:bg-slate-100"
                  }
                `}
              >
                {/* Animated Bubble */}
                {isActive && (
                  <motion.div
                    layoutId="clientSidebarBubble"
                    className="absolute inset-0 bg-emerald-500/20 light:bg-emerald-100 rounded-2xl"
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 22,
                    }}
                  />
                )}

                {/* Icon + Text */}
                <div className="relative z-10 flex items-center gap-3 flex-1">
                  <Icon
                    className={`text-base ${
                      isActive ? "text-emerald-400 light:text-emerald-600" : "text-[#6B7280] light:text-slate-500"
                    }`}
                  />
                  <span>{label}</span>

                  {/* Badge */}
                  {badge > 0 && (
                    <span className="ml-auto bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {badge}
                    </span>
                  )}
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="clientSidebarActiveIcon"
                    className="absolute right-4 flex items-center justify-center"
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      mass: 0.4,
                    }}
                  >
                    <FaCircle className="text-emerald-500 text-xs drop-shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Stats */}
        <div className="px-4 py-3 border-t border-[#111827] light:border-slate-200">
          <div className="bg-gradient-to-r from-emerald-500/10 to-transparent p-3 rounded-xl border border-emerald-500/20">
            <p className="text-xs text-emerald-400 light:text-emerald-600 font-medium mb-1">Quick Stats</p>
            <div className="flex justify-between text-xs text-gray-400 light:text-slate-600">
              <span>Active Orders: {newOrdersCount}</span>
              <span>Messages: {unreadMessages}</span>
            </div>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="px-4 py-3 border-t border-[#111827] light:border-slate-200">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#0A0D14] light:bg-slate-100 hover:bg-[#111827] light:hover:bg-slate-200 transition-all group"
          >
            <span className="text-sm font-medium text-[#9CA3AF] light:text-slate-600 group-hover:text-white light:group-hover:text-slate-900">
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
            <div className="relative w-10 h-10 flex items-center justify-center rounded-lg bg-[#1a1d25] light:bg-white overflow-hidden">
              <AnimatePresence mode="wait">
                {theme === "dark" ? (
                  <motion.div
                    key="moon"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HiOutlineMoon className="text-xl text-amber-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HiOutlineSun className="text-xl text-amber-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 text-[11px] text-[#6B7280] light:text-slate-500 text-center border-t border-[#111827] light:border-slate-200">
          © 2024 SuviX • All rights reserved
        </div>
      </aside>
    </>
  );
};

export default ClientSidebar;
