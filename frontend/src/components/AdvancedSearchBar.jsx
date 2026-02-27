import { useState, useRef, useEffect } from "react";
import { FaSearch, FaTimes, FaHistory, FaFire, FaLightbulb } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import { useAppContext } from "../context/AppContext";

const AdvancedSearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  recentSearches = [], 
  onSearch, 
  suggestionType, // "editors" or "gigs"
  className = "" 
}) => {
  const { backendURL } = useAppContext();
  const [isFocused, setIsFocused] = useState(false);
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
      try {
        const endpoint = suggestionType === "editors" 
          ? `${backendURL}/api/explore/suggestions` 
          : `${backendURL}/api/gigs/suggestions`;
        
        const res = await axios.get(`${endpoint}?query=${value}`);
        if (res.data.success) {
          setApiSuggestions(res.data.suggestions || []);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
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
    <div className={`relative z-30 ${className}`}>
      {/* Search Input Container */}
      <div 
        className={`relative flex items-center w-full transition-all duration-300 ${
          isFocused 
            ? "scale-[1.01] shadow-xl shadow-violet-500/10" 
            : "hover:bg-white/5"
        }`}
      >
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
          isFocused ? "text-violet-400" : "text-gray-400"
        }`}>
          <FaSearch />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className={`w-full py-2.5 md:py-3.5 pl-10 md:pl-12 pr-16 md:pr-20 bg-white/5 backdrop-blur-md border rounded-2xl text-sm md:text-base text-white placeholder:text-gray-500 focus:outline-none transition-all duration-300 ${
            isFocused
              ? "border-violet-500/40 ring-4 ring-violet-500/5 bg-black/40"
              : "border-white/5 hover:border-white/10"
          }`}
        />

        {/* Right Actions */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* Keyboard Shortcut Hint */}
          {!value && !isFocused && (
            <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-gray-500 font-mono">
              <span>⌘</span><span>K</span>
            </div>
          )}

          {/* Clear Button */}
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes className="text-xs" />
            </motion.button>
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
            className="absolute top-full left-0 right-0 mt-3 bg-[#121216] light:bg-white border border-white/10 light:border-slate-200 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-3xl"
          >
            {/* Live API Suggestions */}
            {apiSuggestions.length > 0 && (
              <div className="p-2 border-b border-white/5 light:border-slate-100">
                <div className="px-3 py-2 text-[10px] font-semibold text-emerald-500 light:text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                  <FaLightbulb /> Suggestions
                </div>
                <div className="flex flex-col gap-1 px-1">
                  {apiSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSuggestionClick(item.text)}
                      className="px-3 py-2 rounded-lg hover:bg-white/5 light:hover:bg-slate-50 text-sm text-gray-300 light:text-slate-700 text-left transition-colors flex items-center gap-2"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.type === 'skill' || item.type === 'category' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                      <span dangerouslySetInnerHTML={{ 
                        __html: item.text.replace(new RegExp(`(${value})`, 'gi'), '<span class="text-white light:text-black font-semibold">$1</span>') 
                      }} />
                      {item.type && <span className="text-[10px] text-gray-600 light:text-slate-400 ml-auto uppercase bg-white/5 light:bg-slate-100 px-1.5 py-0.5 rounded">{item.type}</span>}
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
