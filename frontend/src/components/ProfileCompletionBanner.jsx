/**
 * ProfileCompletionBanner Component
 * Uses Tailwind CSS - Pure Dark Corporate Style
 * 100% = Required fields only (5 items @ 20% each)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCamera,
  FaFileAlt,
  FaTags,
  FaImages,
  FaUniversity,
  FaBriefcase,
  FaGlobe,
  FaLink,
  FaDollarSign,
  FaCheck,
  FaChevronDown,
  FaArrowRight,
  FaExclamationCircle,
  FaCheckCircle
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import axios from 'axios';

// Icon mapping
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

// Section-specific redirect URLs
const getRedirectUrl = (section, itemId) => {
  switch (itemId) {
    case 'kycVerified':
      return '/kyc-details';
    case 'portfolio':
      return '/editor-profile?tab=portfolio';
    default:
      return `/editor-profile-update#${section}`;
  }
};

const ProfileCompletionBanner = () => {
  const { user, backendURL } = useAppContext();
  const navigate = useNavigate();
  const [completionData, setCompletionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChecklist, setShowChecklist] = useState(false);

  useEffect(() => {
    const fetchCompletionStatus = async () => {
      if (!user?.token || user?.role !== 'editor') {
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
        setCompletionData({ percent: 0, breakdown: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchCompletionStatus();
  }, [user?.token, user?.role, backendURL]);

  if (user?.role !== 'editor') return null;
  if (loading) return null;

  const percent = completionData?.percent || 0;
  const breakdown = completionData?.breakdown || [];
  const requiredCount = completionData?.requiredCount || 5;
  const requiredComplete = completionData?.requiredComplete || 0;
  
  if (percent >= 100) return null;

  const requiredItems = breakdown.filter(i => i.required);
  const optionalItems = breakdown.filter(i => !i.required);

  const handleItemClick = (section, itemId) => {
    const url = getRedirectUrl(section, itemId);
    navigate(url);
    setShowChecklist(false);
  };

  return (
    <motion.div
      className="m-4 rounded-2xl overflow-hidden bg-[#0a0a0c] border border-white/5"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Glass Container */}
      <div className="flex items-center justify-between p-5 gap-6 bg-gradient-to-b from-white/[0.02] to-transparent flex-wrap">
        {/* Left: Progress Circle + Info */}
        <div className="flex items-center gap-5">
          {/* Circular Progress */}
          <div className="relative w-[72px] h-[72px] flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle 
                className="fill-none stroke-white/[0.06]" 
                cx="50" cy="50" r="42" 
                strokeWidth="5" 
              />
              <circle 
                className="fill-none stroke-gray-500 transition-all duration-500"
                cx="50" cy="50" r="42"
                strokeWidth="5"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 264,
                  strokeDashoffset: 264 - (264 * percent / 100)
                }}
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-baseline gap-[1px]">
              <span className="text-2xl font-bold text-gray-200 tabular-nums">{percent}</span>
              <span className="text-[0.7rem] font-semibold text-gray-500">%</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-gray-100 tracking-tight">Profile Completion</h3>
            <p className="text-[0.8rem] text-gray-500 font-medium">
              {requiredComplete} of {requiredCount} required
            </p>
            <p className="text-xs text-gray-400">{completionData?.message}</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <button 
            className="flex items-center gap-1.5 px-4 py-2.5 bg-transparent border border-white/10 rounded-lg text-gray-400 text-[0.8rem] font-medium cursor-pointer transition-all hover:bg-white/[0.03] hover:text-gray-300"
            onClick={() => setShowChecklist(!showChecklist)}
          >
            <span>Checklist</span>
            <FaChevronDown 
              className={`text-[0.65rem] transition-transform duration-200 ${showChecklist ? 'rotate-180' : ''}`}
            />
          </button>
          <button 
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-green-400/20 to-green-500 border border-white/[0.08] rounded-lg text-gray-200 text-[0.8rem] font-semibold cursor-pointer transition-all hover:bg-[#222225]"
            onClick={() => navigate('/editor-profile-update')}
          >
            <span>Complete</span>
            <FaArrowRight className="text-[0.7rem]" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-[2px] bg-white/[0.04]">
        <motion.div 
          className="h-full bg-gray-600 rounded-sm"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        {[20, 40, 60, 80].map(mark => (
          <div 
            key={mark}
            className={`absolute -top-[2px] w-1.5 h-1.5 rounded-full -translate-x-1/2 border ${
              percent >= mark 
                ? 'bg-gray-600 border-gray-600' 
                : 'bg-gray-800 border-white/10'
            }`}
            style={{ left: `${mark}%` }}
          />
        ))}
      </div>

      {/* Expandable Checklist */}
      <AnimatePresence>
        {showChecklist && (
          <motion.div
            className="overflow-hidden border-t border-white/[0.04]"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Required Section */}
            <div className="p-4 px-6">
              <h4 className="flex items-center gap-2 text-[0.7rem] font-semibold text-gray-500 uppercase tracking-wider mb-3">
                <FaExclamationCircle className="text-gray-500 text-xs" />
                <span>Required</span>
                <span className="ml-auto px-2 py-0.5 bg-white/[0.04] rounded text-[0.65rem] font-semibold text-gray-400">
                  {requiredComplete}/{requiredCount}
                </span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {requiredItems.map((item) => {
                  const Icon = iconMap[item.id] || FaCheckCircle;
                  return (
                    <div 
                      key={item.id}
                      className={`flex items-center gap-3 p-3 px-4 bg-white/[0.02] border rounded-xl cursor-pointer transition-all hover:bg-white/[0.04] ${
                        item.complete 
                          ? 'opacity-40 border-white/[0.04]' 
                          : 'border-l-2 border-l-gray-500 border-white/[0.04]'
                      }`}
                      onClick={() => handleItemClick(item.section, item.id)}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                        item.complete 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-white/[0.04] text-gray-500'
                      }`}>
                        <Icon />
                      </div>
                      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                        <span className={`text-[0.8rem] font-medium truncate ${
                          item.complete ? 'line-through text-gray-500' : 'text-gray-200'
                        }`}>{item.label}</span>
                        <span className="text-[0.7rem] text-gray-500 font-medium">+{item.weight}%</span>
                      </div>
                      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0">
                        {item.complete ? (
                          <FaCheck className="text-green-500 text-xs" />
                        ) : (
                          <FaArrowRight className="text-gray-600 text-[0.65rem]" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optional Section */}
            {optionalItems.length > 0 && (
              <div className="p-4 px-6 bg-black/20 border-t border-white/[0.03]">
                <h4 className="flex items-center gap-2 text-[0.7rem] font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  <FaCheckCircle className="text-green-500 text-xs" />
                  <span>Optional</span>
                  <span className="ml-auto px-2 py-0.5 bg-white/[0.04] rounded text-[0.65rem] font-semibold text-gray-400">
                    {optionalItems.filter(i => i.complete).length}/{optionalItems.length}
                  </span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {optionalItems.map((item) => {
                    const Icon = iconMap[item.id] || FaCheckCircle;
                    return (
                      <div 
                        key={item.id}
                        className={`flex items-center gap-3 p-3 px-4 bg-white/[0.02] border rounded-xl cursor-pointer transition-all hover:bg-white/[0.04] ${
                          item.complete 
                            ? 'opacity-40 border-white/[0.04]' 
                            : 'border-l-2 border-l-gray-500 border-white/[0.04]'
                        }`}
                        onClick={() => handleItemClick(item.section, item.id)}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                          item.complete 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-white/[0.04] text-gray-500'
                        }`}>
                          <Icon />
                        </div>
                        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                          <span className={`text-[0.8rem] font-medium truncate ${
                            item.complete ? 'line-through text-gray-500' : 'text-gray-200'
                          }`}>{item.label}</span>
                          <span className="text-[0.65rem] text-gray-500 font-medium uppercase tracking-wide">Bonus</span>
                        </div>
                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0">
                          {item.complete ? (
                            <FaCheck className="text-green-500 text-xs" />
                          ) : (
                            <FaArrowRight className="text-gray-600 text-[0.65rem]" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfileCompletionBanner;
