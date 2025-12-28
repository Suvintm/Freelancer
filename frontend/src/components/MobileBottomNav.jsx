/**
 * MobileBottomNav - Clean Modern Bottom Navigation Bar
 * Based on reference design with dark/light theme support
 * Only visible on mobile/small devices
 */

import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { 
  HiHome, 
  HiOutlineHome,
  HiMagnifyingGlass,
  HiOutlineMagnifyingGlass,
  HiChatBubbleLeftRight,
  HiOutlineChatBubbleLeftRight,
  HiUser,
  HiOutlineUser,
  HiMapPin,
  HiOutlineMapPin,
  HiBriefcase,
  HiOutlineBriefcase
} from "react-icons/hi2";
import { 
  IoPlayCircle, 
  IoPlayCircleOutline 
} from "react-icons/io5";

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppContext();
  const { theme } = useTheme();

  // Don't render if not logged in
  if (!user) return null;

  // Don't render on chat pages (individual chat view)
  if (location.pathname.startsWith("/chat/")) return null;

  const isClient = user?.role === "client";
  const isEditor = user?.role === "editor";
  const isDark = theme === "dark";

  // Define navigation items based on user role
  const navItems = [
    {
      id: "home",
      label: "Home",
      path: isClient ? "/client-home" : isEditor ? "/editor-home" : "/",
      activeIcon: HiHome,
      inactiveIcon: HiOutlineHome,
    },
    {
      id: "explore",
      label: "Explore",
      path: "/explore-editors",
      activeIcon: HiMagnifyingGlass,
      inactiveIcon: HiOutlineMagnifyingGlass,
    },
    {
      id: "nearby",
      label: "Nearby",
      path: "/editors-near-you",
      activeIcon: HiMapPin,
      inactiveIcon: HiOutlineMapPin,
    },
    {
      id: "reels",
      label: "Reels",
      path: "/reels",
      activeIcon: IoPlayCircle,
      inactiveIcon: IoPlayCircleOutline,
      isCenter: true,
    },
    {
      id: "jobs",
      label: "Jobs",
      path: "/jobs",
      activeIcon: HiBriefcase,
      inactiveIcon: HiOutlineBriefcase,
    },
    {
      id: "messages",
      label: "Chats",
      path: "/chats",
      activeIcon: HiChatBubbleLeftRight,
      inactiveIcon: HiOutlineChatBubbleLeftRight,
    },
    {
      id: "profile",
      label: "Profile",
      path: isClient ? "/client-profile" : "/editor-profile",
      activeIcon: HiUser,
      inactiveIcon: HiOutlineUser,
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Main Navigation Container */}
      <div 
        className={`relative mx-0 rounded-t-3xl shadow-2xl ${
          isDark 
            ? "bg-[#0f0f12] border-t border-white/10" 
            : "bg-white border-t border-gray-100"
        }`}
        style={{
          boxShadow: isDark 
            ? "0 -8px 32px rgba(0, 0, 0, 0.5)" 
            : "0 -8px 32px rgba(0, 0, 0, 0.08)"
        }}
      >
        {/* Navigation Content */}
        <div className="relative flex items-end justify-between pt-2 pb-1 px-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = active ? item.activeIcon : item.inactiveIcon;

            // Center floating button (Reels)
            if (item.isCenter) {
              return (
                <motion.button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex flex-col items-center -mt-4"
                  style={{ marginBottom: "-2px" }}
                >
                  {/* Floating Circle Button */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center justify-center w-11 h-11 rounded-full shadow-lg ${
                      active
                        ? "bg-emerald-500"
                        : isDark 
                          ? "bg-emerald-600" 
                          : "bg-emerald-500"
                    }`}
                    style={{
                      boxShadow: active 
                        ? "0 4px 20px rgba(16, 185, 129, 0.4)" 
                        : "0 4px 16px rgba(16, 185, 129, 0.3)"
                    }}
                  >
                    <Icon className="text-white text-lg" />
                  </motion.div>
                </motion.button>
              );
            }

            // Regular nav items
            return (
              <motion.button
                key={item.id}
                onClick={() => navigate(item.path)}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center justify-center py-1 px-1 min-w-[42px]"
              >
                <Icon
                  className={`text-lg mb-0.5 transition-colors duration-200 ${
                    active
                      ? "text-emerald-500"
                      : isDark 
                        ? "text-gray-400" 
                        : "text-gray-600"
                  }`}
                />
                <span
                  className={`text-[9px] font-medium transition-colors duration-200 ${
                    active
                      ? "text-emerald-500"
                      : isDark 
                        ? "text-gray-400" 
                        : "text-gray-600"
                  }`}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* iOS Home Indicator */}
        <div className="flex justify-center pb-1">
          <div 
            className={`w-28 h-1 rounded-full ${
              isDark ? "bg-gray-600" : "bg-gray-300"
            }`}
          />
        </div>
      </div>
    </motion.nav>
  );
};

export default MobileBottomNav;
