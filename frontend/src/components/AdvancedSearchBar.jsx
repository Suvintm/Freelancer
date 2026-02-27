import { useState, useRef, useEffect } from "react";
import { FaSearch, FaTimes, FaHistory, FaFire, FaLightbulb } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const AdvancedSearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  recentSearches = [], 
  onSearch, 
  suggestionType, // "editors", "gigs", or "users"
  className = "",
  variant = "default" // "default" or "pill"
}) => {
  const { backendURL } = useAppContext();
  const navigate = useNavigate();
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState([]);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

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

  // Fetch suggestions
  useEffect(() => {
    if (!value || value.length < 2 || !suggestionType) {
      setApiSuggestions([]);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const endpoint = suggestionType === "users"
          ? `${backendURL}/api/user/search`
          : suggestionType === "editors" 
          ? `${backendURL}/api/explore/suggestions` 
          : `${backendURL}/api/gigs/suggestions`;
        
        const res = await axios.get(`${endpoint}?query=${value}`);
        if (res.data.success) {
          const results = suggestionType === "users" ? res.data.users : res.data.suggestions;
          setApiSuggestions(results || []);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer.current);
  }, [value, suggestionType, backendURL]);

  const handleClear = () => {
    onChange("");
    setApiSuggestions([]);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (term) => {
    onChange(term);
    onSearch && onSearch(term);
    setIsFocused(false);
  };

  return (
    <div className={`relative z-30 ${className} flex items-center justify-center`}>
      {/* Search Input Container */}
      <div 
        className={`relative flex items-center w-[80%] transition-all duration-300 ${
          variant === 'pill' ? 'rounded-full' : ''
        } ${
          isFocused 
            ? variant === 'pill' ? "scale-[1.01] shadow-2xl shadow-black/10" : "scale-[1.01] shadow-xl shadow-violet-500/10" 
            : "hover:bg-white/5"
        }`}
      >
        <div className={`absolute left-5 md:left-6 top-1/2 -translate-y-1/2 transition-colors ${
          isFocused 
            ? variant === 'pill' ? "text-orange-500" : "text-violet-400" 
            : "text-gray-400"
        }`}>
          <FaSearch className={variant === 'pill' ? "text-lg" : "text-base"} />
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
          className={`w-full py-2.5 md:py-3 pl-11 md:pl-14 pr-20 md:pr-24 transition-all duration-300 focus:outline-none ${
            variant === 'pill'
              ? `rounded-full text-sm md:text-base text-zinc-800 placeholder:text-zinc-400 border-2 ${
                  isFocused 
                    ? "bg-white border-orange-500 ring-4 ring-orange-500/10" 
                    : "bg-white border-zinc-200 light:border-zinc-300"
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
          {/* Clear Button */}
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

          {/* GO Button for Pill Variant */}
          {variant === 'pill' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSearch && onSearch(value)}
              className="w-8 h-8 rounded-full bg-[#FF4500] flex items-center justify-center text-white text-[10px] md:text-xs font-black shadow-lg shadow-orange-500/20 tracking-tighter"
            >
              GO
            </motion.button>
          )}

          {/* Keyboard Shortcut Hint (Hidden in Pill Variant) */}
          {!value && !isFocused && variant !== 'pill' && (
            <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-gray-500 font-mono">
              <span>⌘</span><span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full left-0 right-0 z-50 mt-3 bg-[#121216] light:bg-white border border-white/10 light:border-slate-200 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-3xl mx-auto ${variant === 'pill' ? 'w-[80%]' : 'w-full'}`}
          >
            {/* Live API Suggestions */}
            {apiSuggestions.length > 0 && (
              <div className="p-2 border-b border-white/5 light:border-slate-100">
                <div className="px-3 py-2 text-[10px] font-semibold text-emerald-500 light:text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                  <FaLightbulb /> {loading ? "Searching..." : "Suggestions"}
                  {loading && <div className="ml-auto w-3 h-3 border border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />}
                </div>
                <div className="flex flex-col gap-1 px-1">
                  {apiSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (suggestionType === "users") {
                          navigate(item.role === 'editor' ? `/editor/${item._id}` : `/public-profile/${item._id}`);
                        } else {
                          handleSuggestionClick(item.text);
                        }
                      }}
                      className="px-3 py-2 rounded-lg hover:bg-white/5 light:hover:bg-slate-50 text-sm text-gray-300 light:text-slate-700 text-left transition-colors flex items-center gap-2"
                    >
                      {suggestionType === "users" && item.profilePicture ? (
                        <img src={item.profilePicture} className="w-6 h-6 rounded-full object-cover mr-1" alt="" />
                      ) : (
                        <span className={`w-1.5 h-1.5 rounded-full ${item.type === 'skill' || item.type === 'category' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                      )}
                      
                      <span dangerouslySetInnerHTML={{ 
                        __html: (suggestionType === "users" ? item.name : item.text).replace(new RegExp(`(${value})`, 'gi'), '<span class="text-white light:text-black font-semibold">$1</span>') 
                      }} />
                      
                      {item.role && <span className="text-[10px] text-gray-600 light:text-slate-400 ml-auto uppercase bg-white/5 light:bg-slate-100 px-1.5 py-0.5 rounded">{item.role}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Searches Section */}
            {recentSearches.length > 0 && (
              <div className="p-2 border-b border-white/5 light:border-slate-100">
                <div className="px-3 py-2 text-[10px] font-semibold text-gray-500 light:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FaHistory className="text-violet-400" /> Recent
                </div>
                <div className="flex flex-wrap gap-2 px-2">
                  {recentSearches.slice(0, 3).map((term, idx) => (
                    <button
                      key={idx}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSuggestionClick(term)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 light:bg-slate-100/80 hover:bg-white/10 light:hover:bg-slate-200 border border-white/5 light:border-slate-200 text-xs text-gray-300 light:text-slate-700 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular/Trending Section */}
            {!value && (
              <div className="p-2">
                <div className="px-3 py-2 text-[10px] font-semibold text-gray-500 light:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FaFire className="text-amber-500" /> Popular
                </div>
                <div className="grid grid-cols-2 gap-1 p-1">
                  {["Wedding Video", "Reels Editor", "Gaming Montage", "VFX Artist"].map((term) => (
                    <button
                      key={term}
                      onMouseDown={(e) => e.preventDefault()} // Prevent blur
                      onClick={() => handleSuggestionClick(term)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 light:hover:bg-slate-50 text-left group transition-colors"
                    >
                      <span className="text-sm text-gray-400 light:text-slate-600 group-hover:text-white light:group-hover:text-violet-600 transition-colors">
                        {term}
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-gray-500">
                        ↗
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedSearchBar;
