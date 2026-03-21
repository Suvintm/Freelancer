import { useState, useRef, useEffect, useMemo } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { 
  HiOutlineHome, 
  HiOutlineShoppingCart, 
  HiOutlineRectangleStack, 
  HiOutlineUser, 
  HiOutlineCreditCard, 
  HiOutlineChatBubbleLeftRight, 
  HiOutlineChartBar,
  HiOutlineMagnifyingGlassCircle,
  HiOutlineDocumentPlus,
  HiOutlineSpeakerWave,
  HiOutlineSparkles
} from "react-icons/hi2";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const AdvancedSearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  onSearch, 
  className = "",
  variant = "default" // "default" or "pill"
}) => {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-hide and Scroll-to-hide effects
  useEffect(() => {
    if (!isFocused) return;

    // 1. Hide on scroll
    const handleScroll = () => setIsFocused(false);
    
    // 2. Auto-hide after 8s of inactivity
    const timer = setTimeout(() => setIsFocused(false), 8000);

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [isFocused]);

  // Navigation Data based on Role
  const navItems = useMemo(() => {
    const role = user?.role || 'editor';
    const items = {
      editor: [
        { label: "Dashboard", icon: HiOutlineHome, path: "/editor-home", color: "text-blue-400" },
        { label: "Orders", icon: HiOutlineShoppingCart, path: "/my-orders", color: "text-emerald-400" },
        { label: "Gigs", icon: HiOutlineRectangleStack, path: "/my-gigs", color: "text-purple-400" },
        { label: "Messages", icon: HiOutlineChatBubbleLeftRight, path: "/messages", color: "text-pink-400" },
        { label: "Wallet", icon: HiOutlineCreditCard, path: "/wallet", color: "text-amber-400" },
        { label: "Analytics", icon: HiOutlineChartBar, path: "/reels-analytics", color: "text-indigo-400" },
        { label: "Profile", icon: HiOutlineUser, path: "/editor-profile", color: "text-zinc-400" },
      ],
      client: [
        { label: "Dashboard", icon: HiOutlineHome, path: "/client-home", color: "text-blue-400" },
        { label: "Find Editors", icon: HiOutlineMagnifyingGlassCircle, path: "/explore-editors", color: "text-emerald-400" },
        { label: "Post Brief", icon: HiOutlineDocumentPlus, path: "/create-brief", color: "text-purple-400" },
        { label: "My Orders", icon: HiOutlineShoppingCart, path: "/client-orders", color: "text-pink-400" },
        { label: "Chats", icon: HiOutlineChatBubbleLeftRight, path: "/chats", color: "text-indigo-400" },
        { label: "Payments", icon: HiOutlineCreditCard, path: "/payments", color: "text-amber-400" },
        { label: "Advertise", icon: HiOutlineSpeakerWave, path: "/advertise", color: "text-orange-400" },
        { label: "Profile", icon: HiOutlineUser, path: "/client-profile", color: "text-zinc-400" },
      ]
    };
    return items[role] || items.editor;
  }, [user?.role]);

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const handleNavClick = (path) => {
    navigate(path);
    setIsFocused(false);
  };

  return (
    <div className={`relative z-30 ${className} flex flex-col items-center justify-center`}>
      {/* Search Input Container */}
      <div 
        className={`relative flex items-center w-[95%] md:w-[80%] transition-all duration-300 ${
          variant === 'pill' ? 'rounded-full' : ''
        } ${
          isFocused 
            ? "scale-[1.01] shadow-2xl shadow-black/10" 
            : "hover:bg-white/5"
        }`}
      >
        <div className={`absolute left-5 md:left-6 top-1/2 -translate-y-1/2 transition-all duration-300 z-20 ${
          isFocused 
            ? variant === 'pill' ? "text-indigo-600 scale-110" : "text-violet-400" 
            : "text-zinc-400"
        }`}>
          <FaSearch className={variant === 'pill' ? "text-base" : "text-sm"} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSearch) {
              onSearch(value);
            }
          }}
          placeholder={placeholder}
          className={`w-full py-2.5 md:py-3 pl-11 md:pl-14 pr-16 md:pr-20 transition-all duration-500 focus:outline-none ${
            variant === 'pill'
              ? `rounded-full text-xs md:text-sm text-zinc-950 placeholder:text-zinc-400 border border-white/10 shadow-lg ${
                  isFocused 
                    ? "bg-white border-white ring-4 ring-indigo-500/10 shadow-indigo-500/20" 
                    : "bg-white/95 border-transparent"
                }`
              : `bg-white/5 backdrop-blur-md border rounded-2xl text-sm md:text-base text-white placeholder:text-gray-500 ${
                  isFocused
                    ? "border-violet-500/40 ring-4 ring-violet-500/5 bg-black/40"
                    : "border-white/5 hover:border-white/10"
                }`
          }`}
        />

        {/* Right Actions */}
        <div className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              className={`p-1.5 rounded-full transition-colors ${
                variant === 'pill' ? "bg-gray-100 hover:bg-gray-200 text-gray-400" : "bg-white/10 hover:bg-white/20 text-gray-400"
              }`}
            >
              <FaTimes className="text-xs" />
            </motion.button>
          )}

          {variant === 'pill' && (
            <motion.button
              whileHover={{ scale: 1.1, boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)" }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSearch && onSearch(value)}
              className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-[9px] font-black shadow-xl shadow-indigo-500/20 tracking-tighter uppercase transition-all duration-300"
            >
              GO
            </motion.button>
          )}
        </div>
      </div>

      {/* Navigation Carousel - Integrated into flow (Relative) */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: "auto", opacity: 1, marginTop: 8 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className={`overflow-hidden ${variant === 'pill' ? 'w-[95%] md:w-[80%]' : 'w-full'}`}
          >
            <div className="bg-zinc-950 border border-white/10 rounded-2xl py-2 shadow-2xl">
              {/* Horizontal Scrollable Carousel - Ultra Compact */}
              <div className="flex overflow-x-auto gap-2 px-3 no-scrollbar scroll-smooth">
                {navItems.map((item, idx) => (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 + 0.2 }}
                    whileHover={{ y: -2, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNavClick(item.path)}
                    className="flex-shrink-0 w-16 py-2 flex flex-col items-center justify-center gap-1.5 group transition-all duration-300"
                  >
                    <div className={`w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 ${item.color}`}>
                      <item.icon className="text-base" />
                    </div>
                    <span className="text-[7px] font-medium text-white group-hover:text-amber-400 transition-colors uppercase tracking-tight">
                      {item.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedSearchBar;
