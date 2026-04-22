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
  HiOutlineSparkles,
  HiOutlineChevronRight
} from "react-icons/hi2";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import React from "react";

// Optimized Sub-component for the dynamic placeholder to prevent full search bar re-renders
const DynamicPlaceholder = React.memo(({ items }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [items.length]);

  return (
    <div className="absolute left-11 md:left-14 top-1/2 -translate-y-1/2 pointer-events-none flex items-center overflow-hidden h-6">
      <span className="text-[11px] md:text-xs text-zinc-400 whitespace-nowrap">Are looking for "</span>
      <div className="relative h-full flex flex-col justify-center mx-0.5">
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -15, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-[11px] md:text-xs font-bold text-indigo-600 light:text-indigo-500 whitespace-nowrap"
          >
            {items[index]?.label}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[11px] md:text-xs text-zinc-400 whitespace-nowrap">"?</span>
    </div>
  );
});

const AdvancedSearchBar = React.memo(({ 
  value, 
  onChange, 
  onSearch, 
  className = "",
  variant = "pill" // "default" or "pill"
}) => {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [isFocused, setIsFocused] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
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
    const handleScroll = () => {
      setIsFocused(false);
      inputRef.current?.blur();
    };
    
    // 2. Auto-hide after 8s of inactivity
    const timer = setTimeout(() => {
      setIsFocused(false);
      inputRef.current?.blur();
    }, 8000);

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
        { label: "Home", icon: HiOutlineHome, path: "/editor-home", color: "text-blue-400" },
        { label: "Reels", icon: HiOutlineSparkles, path: "/reels", color: "text-amber-400" },
        { label: "Profile", icon: HiOutlineUser, path: "/editor-profile", color: "text-zinc-400" },
        { label: "Orders", icon: HiOutlineShoppingCart, path: "/my-orders", color: "text-emerald-400" },
        { label: "Gigs", icon: HiOutlineRectangleStack, path: "/my-gigs", color: "text-purple-400" },
        { label: "Analytics", icon: HiOutlineChartBar, path: "/reels-analytics", color: "text-indigo-400" },
        { label: "Messages", icon: HiOutlineChatBubbleLeftRight, path: "/chats", color: "text-pink-400" },
        { label: "Wallet", icon: HiOutlineCreditCard, path: "/editor-wallet", color: "text-amber-400" },
      ],
      client: [
        { label: "Home", icon: HiOutlineHome, path: "/client-home", color: "text-blue-400" },
        { label: "Reels", icon: HiOutlineSparkles, path: "/reels", color: "text-amber-400" },
        { label: "Profile", icon: HiOutlineUser, path: "/client-profile", color: "text-zinc-400" },
        { label: "Orders", icon: HiOutlineShoppingCart, path: "/client-orders", color: "text-emerald-400" },
        { label: "Editors", icon: HiOutlineMagnifyingGlassCircle, path: "/explore/editors", color: "text-purple-400" },
        { label: "Briefs", icon: HiOutlineDocumentPlus, path: "/create-brief", color: "text-pink-400" },
        { label: "Chats", icon: HiOutlineChatBubbleLeftRight, path: "/chats", color: "text-indigo-400" },
        { label: "Payments", icon: HiOutlineCreditCard, path: "/payments", color: "text-amber-400" },
        { label: "Advertise", icon: HiOutlineSpeakerWave, path: "/advertise", color: "text-orange-400" },
      ]
    };
    return items[role] || items.editor;
  }, [user?.role]);

  // Placeholder loop moved to sub-component for performance


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
            ? variant === 'pill' ? "text-indigo-600" : "text-violet-400" 
            : "text-zinc-400"
        }`}>
          <motion.div
            animate={{ 
              scale: isFocused ? [1, 1.15, 1] : [1, 1.05, 1],
              opacity: isFocused ? 1 : 0.7
            }}
            transition={{ 
              duration: isFocused ? 1.5 : 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <FaSearch className={variant === 'pill' ? "text-base" : "text-sm"} />
          </motion.div>
        </div>

        <input
          ref={inputRef}
          type="text"
          readOnly
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onClick={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSearch) {
              onSearch(value);
            }
          }}
          placeholder=""
          className={`w-full py-2.5 md:py-3 pl-11 md:pl-14 pr-16 md:pr-20 transition-all duration-500 focus:outline-none cursor-pointer ${
            variant === 'pill'
              ? `rounded-full text-xs md:text-sm text-zinc-950 border border-white/10 shadow-lg ${
                  isFocused 
                    ? "bg-white border-white ring-4 ring-indigo-500/10 shadow-indigo-500/20" 
                    : "bg-white/95 border-transparent"
                }`
              : `bg-white/5 backdrop-blur-md border rounded-2xl text-sm md:text-base text-white ${
                  isFocused
                    ? "border-violet-500/40 ring-4 ring-violet-500/5 bg-black/40"
                    : "border-white/5 hover:border-white/10"
                }`
          }`}
        />

        {/* Animated Dynamic Placeholder - Now a performance-optimized sub-component */}
        {!value && <DynamicPlaceholder items={navItems} />}


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
              whileHover={{ scale: 1.1, boxShadow: "0 0 15px rgba(91, 94, 240, 0.4)" }}
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
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`overflow-visible ${variant === 'pill' ? 'w-[95%] md:w-[80%]' : 'w-full'}`}
          >
            <div className="relative pt-6 pb-2 group/nav overflow-visible">
              {/* Horizontal Scrollable Carousel - Minimalist */}
              <div 
                onScroll={() => setShowScrollHint(false)}
                className="flex overflow-x-auto gap-1 px-4 no-scrollbar scroll-smooth relative z-0"
              >
                {navItems.map((item, idx) => (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 + 0.1 }}
                    whileInView={{ scale: 1.15 }}
                    viewport={{ once: false, amount: 0.8 }}
                    whileHover={{ y: -4, scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleNavClick(item.path)}
                    className="flex-shrink-0 w-16 py-3 flex flex-col items-center justify-center gap-2 group/item"
                  >
                    {/* Raw Icon */}
                    <div className={`text-xl md:text-2xl transition-all duration-300 drop-shadow-sm ${item.color}`}>
                      <item.icon />
                    </div>

                    {/* Label */}
                    <span className="text-[7px] font-bold text-zinc-400 group-hover/item:text-white transition-colors uppercase tracking-[0.05em] text-center">
                      {item.label}
                    </span>
                  </motion.button>
                ))}

                {/* Fading Edge Hint */}
                <div className="sticky right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/40 to-transparent pointer-events-none z-10" />
              </div>

              {/* Animated Scroll Hint Icon */}
              <AnimatePresence>
                {showScrollHint && navItems.length >= 5 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute top-1 right-3 z-20 pointer-events-none flex items-center gap-1 bg-indigo-600/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-lg"
                  >
                    <span className="text-[5px] font-black text-white uppercase tracking-widest">Explore</span>
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <HiOutlineChevronRight className="text-white text-[8px]" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default AdvancedSearchBar;
