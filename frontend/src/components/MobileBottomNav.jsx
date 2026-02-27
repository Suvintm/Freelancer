/**
 * MobileBottomNav - Clean Modern Bottom Navigation Bar
 * Based on reference design with dark/light theme support
 * Only visible on mobile/small devices
 */

import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  IoPlay, 
  IoPlayOutline 
} from "react-icons/io5";

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppContext();
  const { theme } = useTheme();

  // Don't render if not logged in
  if (!user) return null;

  // Don't render on chat pages (individual chat view) OR Reels scrolling page
  const hidePaths = ["/chat/", "/reels"];
  if (hidePaths.some(path => location.pathname.startsWith(path) || location.pathname === path)) return null;

  const isDark = theme === "dark";

  // Define navigation items based on user role
  const navItems = [
    {
      id: "home",
      label: "Home",
      path: user?.role === "client" ? "/client-home" : user?.role === "editor" ? "/editor-home" : "/",
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
      activeIcon: IoPlay,
      inactiveIcon: IoPlay, // Solid for center button
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
      path: user?.role === "client" ? "/client-profile" : "/editor-profile",
      activeIcon: HiUser,
      inactiveIcon: HiOutlineUser,
    },
  ];

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="md:hidden fixed bottom-6 left-6 right-6 z-50 h-[60px]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Premium Glass Container */}
      <div 
        className={`relative h-full w-full rounded-[2rem] overflow-visible backdrop-blur-3xl border ${
          isDark 
            ? "bg-zinc-900/90 border-white/[0.05]" 
            : "bg-white/95 border-zinc-200/40"
        } shadow-[0_12px_40px_rgba(0,0,0,0.2)] ${isDark ? 'shadow-black/60' : 'shadow-zinc-300/40'}`}
      >
        <div className="flex items-center justify-around h-full px-2 relative">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = active ? item.activeIcon : item.inactiveIcon;

            // Center floating button (Reels) - Sharp Black/White Design
            if (item.isCenter) {
              return (
                <div key={item.id} className="relative flex flex-col items-center">
                  <div className="relative w-12 h-12 -mt-10">
                    <motion.button
                      onClick={() => navigate(item.path)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`absolute inset-0 flex items-center justify-center rounded-2xl shadow-xl transition-all duration-300 ring-2 ${
                        active 
                          ? "bg-black ring-emerald-500/50" 
                          : "bg-black ring-white/10"
                      }`}
                    >
                      <Icon className="text-white text-xl relative z-10" />
                      
                      {/* Pulsing Active Indicator (Subtle) */}
                      {active && (
                        <motion.div 
                          layoutId="centerGlow"
                          className="absolute -inset-1 rounded-2xl bg-emerald-500/20 blur-md -z-10"
                          animate={{ opacity: [0.5, 0.8, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.button>
                  </div>
                  <span className={`mt-1 text-[9px] font-black tracking-widest uppercase transition-colors duration-300 ${
                    active ? 'text-emerald-500' : isDark ? 'text-white/40' : 'text-black/40'
                  }`}>
                    {item.label}
                  </span>
                </div>
              );
            }

            // Regular nav items
            return (
              <motion.button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center min-w-[44px] h-full group"
                whileTap={{ scale: 0.9 }}
              >
                {/* Icon Container with Highlight */}
                <div className="relative p-2 rounded-2xl">
                  {/* Active Indicator Background - Only for Icon */}
                  {active && (
                    <motion.div
                      layoutId="navTab"
                      className={`absolute inset-0 rounded-2xl -z-10 ${
                        isDark ? 'bg-white/5' : 'bg-emerald-50'
                      }`}
                      transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                    />
                  )}

                  <motion.div
                    animate={{ 
                      y: active ? -1 : 0,
                      scale: active ? 1.1 : 1
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`${
                      active 
                        ? "text-emerald-500" 
                        : isDark ? "text-white" : "text-black"
                    }`}
                  >
                    <Icon className="text-[1.3rem]" />
                  </motion.div>
                </div>

                <AnimatePresence>
                  {active && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-[8px] font-black tracking-widest uppercase text-emerald-500 absolute -bottom-1"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Micro active dot */}
                {active && (
                  <motion.div 
                    layoutId="activeDot"
                    className="absolute -bottom-2 w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                    transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default MobileBottomNav;
