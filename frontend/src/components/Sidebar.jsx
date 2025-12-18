import { useNavigate, useLocation } from "react-router-dom";
import {
  FaBriefcase,
  FaCheckCircle,
  FaUserTie,
  FaEnvelope,
  FaTimes,
  FaShoppingCart,
  FaClipboardList,
  FaWallet,
  FaUniversity,
  FaChartLine,
  FaHome,
} from "react-icons/fa";
import { HiOutlineSun, HiOutlineMoon } from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/logo.png";
import { useTheme } from "../context/ThemeContext";
import { useSocket } from "../context/SocketContext";

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  // 🆕 Get real-time unread count from socket context
  const socketContext = useSocket();
  const totalUnread = socketContext?.totalUnread || 0;

  // 🆕 Move navItems inside component to access totalUnread
  const navItems = [
    { path: "/editor-home", icon: FaHome, label: "Dashboard" },
    { path: "/my-gigs", icon: FaShoppingCart, label: "My Gigs" },
    { path: "/my-orders", icon: FaClipboardList, label: "My Orders" },
    { path: "/reels-analytics", icon: FaChartLine, label: "Reels Analytics" },
    { path: "/payments", icon: FaWallet, label: "Payments" },
    { path: "/kyc-details", icon: FaUniversity, label: "KYC Details" },
    { path: "/editor-profile", icon: FaUserTie, label: "Profile" },
    { path: "/chats", icon: FaEnvelope, label: "Messages", badge: totalUnread },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-[#050509] light:bg-white text-white light:text-slate-900 shadow-xl
        flex flex-col fixed top-0 left-0 z-50 h-screen transition-all duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        w-64 border-r border-white/10 light:border-slate-200`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10 light:border-slate-100 bg-[#050509] light:bg-white">
          <img
            onClick={() => handleNavigation("/")}
            src={logo}
            className="w-10 h-10 cursor-pointer hover:scale-105 transition-transform"
            alt="SuviX"
          />
          <div>
            <h1
              onClick={() => handleNavigation("/")}
              className="text-lg font-bold cursor-pointer text-white light:text-slate-900"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Suvi<span className="text-emerald-500">X</span>
            </h1>
            <p className="text-[11px] text-gray-500 light:text-slate-500">Editor Workspace</p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden ml-auto text-gray-500 light:text-slate-400 hover:text-gray-300 light:hover:text-slate-600 text-lg p-2 hover:bg-white/10 light:hover:bg-slate-100 rounded-lg transition-all"
          >
            <FaTimes />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label, badge }) => {
            const isActive = location.pathname === path;

            return (
              <button
                key={path}
                onClick={() => handleNavigation(path)}
                className={`
                  relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all overflow-hidden group
                  ${isActive
                    ? "bg-emerald-500/10 light:bg-emerald-50 text-emerald-400 light:text-emerald-600"
                    : "text-gray-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-white/5 light:hover:bg-slate-50"
                  }
                `}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebarActiveIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}

                {/* Icon + Text */}
                <Icon className={`text-base ${isActive ? "text-emerald-500" : "text-gray-500 light:text-slate-400 group-hover:text-gray-300 light:group-hover:text-slate-600"}`} />
                <span>{label}</span>

                {/* 🆕 Badge for unread count */}
                {badge > 0 && (
                  <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full animate-pulse">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}

                {/* Active Dot - only show if no badge */}
                {isActive && !badge && (
                  <motion.div
                    layoutId="sidebarDot"
                    className="absolute right-4 w-2 h-2 rounded-full bg-emerald-500"
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="px-3 py-3 border-t border-white/10 light:border-slate-100">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 light:bg-slate-50 hover:bg-white/10 light:hover:bg-slate-100 transition-all group"
          >
            <span className="text-sm font-medium text-gray-400 light:text-slate-600 group-hover:text-white light:group-hover:text-slate-900">
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
            <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-[#0a0a0c] light:bg-white border border-white/10 light:border-slate-200 overflow-hidden">
              <AnimatePresence mode="wait">
                {theme === "dark" ? (
                  <motion.div
                    key="moon"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HiOutlineMoon className="text-xl text-gray-400 light:text-slate-600" />
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
        <div className="px-4 py-4 text-[11px] text-gray-600 light:text-slate-400 text-center border-t border-white/10 light:border-slate-100">
          © 2024 SuviX • All rights reserved
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
