// Navbar.jsx - Top navigation bar
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaBell, FaMoon, FaSun, FaUserCog, FaKey, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";

const Navbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { admin, logout, theme, toggleTheme } = useAdmin();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Mock notifications for demo
  const notifications = [
    { id: 1, text: "New user registered", time: "2m ago", unread: true },
    { id: 2, text: "Order #ORD-2025-1234 disputed", time: "15m ago", unread: true },
    { id: 3, text: "Gig approved successfully", time: "1h ago", unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="fixed top-0 left-0 right-0 md:left-64 h-16 bg-dark-800/90 backdrop-blur-xl border-b border-dark-500 z-30">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Left - Mobile menu */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
        >
          <FaBars size={20} />
        </button>

        {/* Center - Search (hidden on mobile) */}
        <div className="hidden md:flex flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search users, orders..."
            className="w-full bg-dark-700 border border-dark-500 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
          />
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            {theme === "dark" ? <FaSun size={18} /> : <FaMoon size={18} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <FaBell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-72 bg-dark-700 border border-dark-500 rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="p-3 border-b border-dark-500">
                    <h3 className="font-semibold text-white">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`p-3 border-b border-dark-500 hover:bg-white/5 ${notif.unread ? "bg-purple-500/10" : ""}`}
                      >
                        <p className="text-sm text-white">{notif.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Admin Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {admin?.name?.charAt(0)?.toUpperCase() || "A"}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm text-white font-medium">{admin?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{admin?.role}</p>
              </div>
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-dark-700 border border-dark-500 rounded-xl shadow-xl overflow-hidden"
                >
                  <button
                    onClick={() => { setShowDropdown(false); navigate("/settings"); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5"
                  >
                    <FaUserCog />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5"
                  >
                    <FaKey />
                    <span>Change Password</span>
                  </button>
                  <div className="border-t border-dark-500" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10"
                  >
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
