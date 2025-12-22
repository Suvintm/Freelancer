import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  HiOutlineMagnifyingGlass, 
  HiOutlineAdjustmentsHorizontal,
  HiOutlineMapPin,
  HiOutlineStar,
  HiOutlineChevronRight,
  HiOutlineXMark,
  HiOutlineCheckCircle
} from 'react-icons/hi2';

const DesktopSidebar = ({ 
  editors = [], 
  isLoading = false, 
  onEditorClick,
  onApplyFilters,
  filters,
  setFilters 
}) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredEditors = editors.filter(editor =>
    editor.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditorClick = (editor) => {
    if (onEditorClick) onEditorClick(editor);
    navigate(`/editor/${editor._id}`);
  };

  const resetFilters = () => {
    setFilters?.({
      radius: 25,
      minRating: 0,
      availability: false,
      skills: '',
      sortBy: 'distance'
    });
  };

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Search and Filters */}
      <div className={`p-4 border-b ${isDark ? 'border-green-900/30' : 'border-gray-200'}`}>
        {/* Search Input */}
        <div className="relative">
          <HiOutlineMagnifyingGlass className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg ${isDark ? 'text-green-500' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Search editors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm focus:outline-none transition-colors ${
              isDark 
                ? 'bg-green-950/50 border border-green-800/50 text-white placeholder-green-600 focus:border-green-500' 
                : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500'
            }`}
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`w-full mt-3 px-4 py-2.5 rounded-xl flex items-center justify-between text-sm transition-colors ${
            isDark 
              ? 'bg-green-950/50 border border-green-800/50 text-green-300 hover:bg-green-900/50' 
              : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center gap-2">
            <HiOutlineAdjustmentsHorizontal className={isDark ? 'text-green-400' : 'text-green-600'} />
            Advanced Filters
          </span>
          <HiOutlineChevronRight className={`text-sm transition-transform ${showFilters ? 'rotate-90' : ''}`} />
        </button>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`mt-3 p-4 rounded-xl space-y-4 ${
              isDark ? 'bg-green-950/30 border border-green-800/30' : 'bg-gray-50 border border-gray-200'
            }`}
          >
            {/* Distance */}
            <div>
              <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-green-300' : 'text-gray-600'}`}>
                Distance: <span className={isDark ? 'text-green-400' : 'text-green-600'}>{filters?.radius || 25}km</span>
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={filters?.radius || 25}
                onChange={(e) => setFilters?.({ ...filters, radius: parseInt(e.target.value) })}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-green-500"
                style={{ background: isDark ? '#064e3b' : '#d1fae5' }}
              />
              <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-green-600' : 'text-gray-400'}`}>
                <span>5km</span>
                <span>100km</span>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-green-300' : 'text-gray-600'}`}>
                Min Rating: <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>{filters?.minRating || 0}★</span>
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={filters?.minRating || 0}
                onChange={(e) => setFilters?.({ ...filters, minRating: parseFloat(e.target.value) })}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-500"
                style={{ background: isDark ? '#451a03' : '#fef3c7' }}
              />
            </div>

            {/* Skills Filter */}
            <div>
              <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-green-300' : 'text-gray-600'}`}>
                Skills
              </label>
              <select
                value={filters?.skills || ''}
                onChange={(e) => setFilters?.({ ...filters, skills: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none ${
                  isDark 
                    ? 'bg-black border border-green-800/50 text-white' 
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <option value="">All Skills</option>
                <option value="reels">Reels</option>
                <option value="youtube">YouTube</option>
                <option value="shorts">Shorts</option>
                <option value="wedding">Wedding</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-green-300' : 'text-gray-600'}`}>
                Sort By
              </label>
              <select
                value={filters?.sortBy || 'distance'}
                onChange={(e) => setFilters?.({ ...filters, sortBy: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none ${
                  isDark 
                    ? 'bg-black border border-green-800/50 text-white' 
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <option value="distance">Nearest First</option>
                <option value="rating">Highest Rated</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${isDark ? 'text-green-300' : 'text-gray-600'}`}>Available Now Only</span>
              <button
                onClick={() => setFilters?.({ ...filters, availability: !filters?.availability })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  filters?.availability 
                    ? 'bg-green-500' 
                    : isDark ? 'bg-green-900/50' : 'bg-gray-300'
                }`}
              >
                <motion.div
                  animate={{ x: filters?.availability ? 22 : 2 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                />
              </button>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={resetFilters}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark 
                    ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Reset
              </button>
              <button
                onClick={onApplyFilters}
                className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Editors List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-5 text-center">
            <div className="w-8 h-8 border-3 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto" />
            <p className={`text-sm mt-3 ${isDark ? 'text-green-500' : 'text-gray-500'}`}>Finding editors...</p>
          </div>
        ) : filteredEditors.length === 0 ? (
          <div className="p-5 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${isDark ? 'bg-green-950/50' : 'bg-gray-100'}`}>
              <HiOutlineMapPin className={`text-2xl ${isDark ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <p className={`text-sm ${isDark ? 'text-green-500' : 'text-gray-500'}`}>No editors found nearby</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {filteredEditors.map((editor) => (
              <motion.button
                key={editor._id}
                onClick={() => handleEditorClick(editor)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`w-full p-4 rounded-xl flex items-center gap-4 transition-colors group ${
                  isDark 
                    ? 'bg-green-950/30 hover:bg-green-900/40 border border-green-800/30' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={editor.profilePicture && editor.profilePicture.trim() !== '' 
                      ? editor.profilePicture 
                      : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                    alt={editor.name}
                    className={`w-12 h-12 rounded-full object-cover border-2 ${isDark ? 'border-green-500/50' : 'border-green-500/30'}`}
                    onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; }}
                  />
                  {editor.availability === 'available' && (
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 rounded-full ${isDark ? 'border-black' : 'border-white'}`} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-left min-w-0">
                  <p className={`font-semibold text-sm truncate transition-colors ${
                    isDark 
                      ? 'text-white group-hover:text-green-400' 
                      : 'text-gray-900 group-hover:text-green-600'
                  }`}>
                    {editor.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <HiOutlineStar className="text-amber-400 text-sm" />
                      <span className={`text-xs ${isDark ? 'text-green-400/70' : 'text-gray-500'}`}>{editor.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <HiOutlineMapPin className={`text-sm ${isDark ? 'text-green-500' : 'text-green-600'}`} />
                      <span className={`text-xs ${isDark ? 'text-green-400/70' : 'text-gray-500'}`}>{editor.approxLocation?.distance || '?'}km</span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <HiOutlineChevronRight className={`text-lg transition-colors ${isDark ? 'text-green-700 group-hover:text-green-500' : 'text-gray-400 group-hover:text-green-500'}`} />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DesktopSidebar;
