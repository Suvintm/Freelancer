/**
 * ProfileCompletionRing Component
 * Uses Tailwind CSS - Circular SVG progress ring with dropdown
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCheck, 
  FaChevronDown, 
  FaUser, 
  FaCamera, 
  FaFileAlt, 
  FaTags, 
  FaImages, 
  FaLink, 
  FaUniversity,
  FaExclamationCircle,
  FaBriefcase,
  FaGlobe,
  FaDollarSign
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import axios from 'axios';

// Icon mapping for breakdown items
const iconMap = {
  profilePicture: FaCamera,
  about: FaFileAlt,
  skills: FaTags,
  portfolio: FaImages,
  experience: FaBriefcase,
  languages: FaGlobe,
  socialLinks: FaLink,
  kycVerified: FaUniversity,
  hourlyRate: FaDollarSign,
};

const ProfileCompletionRing = ({ 
  user, 
  size = 56, 
  strokeWidth = 3,
  showDropdown = true,
  showPercentText = false,
  children 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { backendURL } = useAppContext();

  useEffect(() => {
    const fetchCompletionStatus = async () => {
      if (!user?.token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${backendURL}/api/profile/completion-status`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setCompletionData(res.data);
      } catch (error) {
        console.error('Failed to fetch completion status:', error);
        setCompletionData({ 
          percent: user?.profileCompletionPercent || 0, 
          breakdown: [],
          message: 'Complete your profile to get noticed.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompletionStatus();
  }, [user?.token, backendURL]);

  const percent = completionData?.percent || 0;
  const items = completionData?.breakdown || [];

  const getColor = (pct) => {
    if (pct >= 80) return '#10b981';
    if (pct >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor(percent);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-flex flex-col items-center" ref={dropdownRef}>
      {/* Main Ring + Avatar */}
      <div
        className="relative cursor-pointer flex items-center justify-center"
        style={{ width: size, height: size }}
        onClick={() => showDropdown && setIsOpen(!isOpen)}
      >
        {/* SVG Ring */}
        <svg
          className="absolute top-0 left-0 -rotate-90"
          width={size}
          height={size}
        >
          <circle
            className="fill-none stroke-white/[0.08]"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <circle
            className="fill-none transition-all duration-500"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>

        {/* Avatar (children) */}
        <div className="relative z-10 rounded-full overflow-hidden">
          {children}
        </div>

        {/* Dropdown Arrow */}
        {showDropdown && (
          <div 
            className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center z-20 border-2 border-[#0D0D0D]"
            style={{ backgroundColor: color }}
          >
            <FaChevronDown 
              className={`text-[8px] text-white transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        )}
      </div>

      {/* Percentage Text */}
      {showPercentText && (
        <div className="text-xs font-bold mt-1" style={{ color }}>
          {loading ? '...' : `${percent}%`}
        </div>
      )}

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full mt-3 right-0 w-80 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-[1000]"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="p-5 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-green-200">Profile Completion</span>
                <span className="text-xl font-bold" style={{ color }}>
                  {percent}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Status Message */}
              <p className="text-xs text-gray-400">
                {percent >= 100 ? (
                  <span className="text-emerald-400">✨ Profile Complete! Maximum engagement unlocked</span>
                ) : percent >= 80 ? (
                  <span className="text-emerald-400">Great! Complete 100% for maximum engagement</span>
                ) : (
                  <span className="flex items-center gap-2 text-amber-400">
                    <FaExclamationCircle /> Complete at least <span className="text-green-500 font-bold">80%</span> to get noticed
                  </span>
                )}
              </p>
            </div>

            {/* Checklist */}
            <div className="p-2 max-h-[280px] overflow-y-auto">
              {items.map((item) => {
                const IconComponent = iconMap[item.id] || FaUser;
                return (
                  <div
                    key={item.id}
                    className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all hover:bg-white/[0.05] ${
                      item.complete ? 'opacity-70' : ''
                    }`}
                    onClick={() => {
                      navigate('/editor-profile-update');
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`text-sm ${item.complete ? 'text-emerald-400' : 'text-gray-500'}`} />
                      <span className={`text-sm ${item.complete ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[0.7rem] text-gray-500 font-semibold">+{item.weight}%</span>
                      {item.complete ? (
                        <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                          <FaCheck className="text-[10px] text-white" />
                        </div>
                      ) : (
                        <div className="w-[22px] h-[22px] rounded-full bg-white/[0.08] flex items-center justify-center">
                          <FaChevronDown className="text-[8px] text-gray-500 -rotate-90" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/[0.06]">
              <button
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/40"
                onClick={() => {
                  navigate('/editor-profile-update');
                  setIsOpen(false);
                }}
              >
                Complete Profile
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileCompletionRing;
