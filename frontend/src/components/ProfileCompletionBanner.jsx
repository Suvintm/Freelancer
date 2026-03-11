/**
 * ProfileCompletionBanner Component
 * Uses Tailwind CSS - Dark Corporate Style with light: overrides
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
import kycBannerImg from '../assets/kycbanner.png';

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
      className="m-0 rounded-xl overflow-hidden bg-[#0a0a0c] light:bg-white border border-white/5 light:border-slate-200"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Glass Container */}
      <div className="flex items-center justify-between p-3 md:p-4 gap-4 bg-gradient-to-b from-white/[0.02] light:from-slate-50/50 to-transparent flex-wrap">
        {/* Left: Progress Circle + Info */}
        <div className="flex items-center gap-5">
          {/* Circular Progress */}
          <div className="relative w-[56px] h-[56px] flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle 
                className="fill-none stroke-white/[0.06] light:stroke-slate-200" 
                cx="50" cy="50" r="42" 
                strokeWidth="5" 
              />
              <circle 
                className="fill-none stroke-gray-500 light:stroke-emerald-500 transition-all duration-500"
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
              <span className="text-xl font-bold text-gray-200 light:text-slate-900 tabular-nums">{percent}</span>
              <span className="text-[0.6rem] font-semibold text-gray-500 light:text-slate-500">%</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-semibold text-gray-100 light:text-slate-900 tracking-tight">Profile Completion</h3>
            <p className="text-[11px] leading-tight text-gray-400 light:text-slate-500 max-w-[280px]">
              Complete all <span className="text-gray-200 light:text-slate-700 font-bold">required</span> fields to be recognized as a <span className="text-emerald-400 light:text-emerald-600 font-bold">SuviX Editor</span>. Optional fields are bonus!
            </p>
            <p className="text-[0.7rem] text-gray-500 light:text-slate-500 font-medium mt-1">
              {requiredComplete} of {requiredCount} required
            </p>
          </div>
        </div>

        {/* Right: Actions + KYC */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* KYC Section */}
          <div className="flex flex-col items-center gap-1">
            <AnimatePresence mode="wait">
              {completionData?.breakdown.find(i => i.id === 'kycVerified')?.complete ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="px-2 py-0.5 bg-emerald-500/10 rounded flex items-center gap-1"
                >
                  <FaCheckCircle className="text-[10px] text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">KYC Done</span>
                </motion.div>
              ) : (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    transition: { duration: 0.3 }
                  }}
                  className="flex flex-col items-center"
                >
                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest animate-pulse">Required</span>
                  <div className="text-[8px] text-gray-500 font-medium -mt-1 uppercase">Not Completed</div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.img 
              src={kycBannerImg} 
              alt="KYC status" 
              className="w-12 h-12 object-contain cursor-pointer transition-transform hover:scale-110"
              animate={{ 
                y: [0, -4, 0],
                rotate: [0, 1, -1, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              onClick={() => navigate('/kyc-details')}
            />
          </div>

          <div className="h-10 w-[1px] bg-white/10 hidden md:block" />

          <div className="flex gap-2">
            <button 
              className="flex items-center gap-1 px-3 py-1.5 bg-transparent border border-white/10 light:border-slate-200 rounded-lg text-gray-400 light:text-slate-600 text-[0.7rem] font-medium cursor-pointer transition-all hover:bg-white/[0.03] light:hover:bg-slate-50"
              onClick={() => setShowChecklist(!showChecklist)}
            >
              <span>Checklist</span>
              <FaChevronDown 
                className={`text-[0.6rem] transition-transform duration-200 ${showChecklist ? 'rotate-180' : ''}`}
              />
            </button>
            <button 
              className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-green-400/20 to-green-500 light:from-emerald-500 light:to-emerald-600 border border-white/[0.08] light:border-transparent rounded-lg text-gray-200 light:text-white text-[0.75rem] font-semibold cursor-pointer transition-all hover:bg-[#222225]"
              onClick={() => navigate('/editor-profile-update')}
            >
              <span>Complete</span>
              <FaArrowRight className="text-[0.65rem]" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-[2px] bg-white/[0.04] light:bg-slate-100">
        <motion.div 
          className="h-full bg-gray-600 light:bg-emerald-500 rounded-sm"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        {[20, 40, 60, 80].map(mark => (
          <div 
            key={mark}
            className={`absolute -top-[2px] w-1.5 h-1.5 rounded-full -translate-x-1/2 border ${
              percent >= mark 
                ? 'bg-gray-600 light:bg-emerald-500 border-gray-600 light:border-emerald-500' 
                : 'bg-gray-800 light:bg-slate-200 border-white/10 light:border-slate-300'
            }`}
            style={{ left: `${mark}%` }}
          />
        ))}
      </div>

      {/* Expandable Checklist */}
      <AnimatePresence>
        {showChecklist && (
          <motion.div
            className="overflow-hidden border-t border-white/[0.04] light:border-slate-100"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Required Section */}
            <div className="p-4 px-6">
              <h4 className="flex items-center gap-2 text-[0.7rem] font-semibold text-gray-500 light:text-slate-500 uppercase tracking-wider mb-3">
                <FaExclamationCircle className="text-gray-500 light:text-amber-500 text-xs" />
                <span>Required</span>
                <span className="ml-auto px-2 py-0.5 bg-white/[0.04] light:bg-slate-100 rounded text-[0.65rem] font-semibold text-gray-400 light:text-slate-600">
                  {requiredComplete}/{requiredCount}
                </span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {requiredItems.map((item) => {
                  const Icon = iconMap[item.id] || FaCheckCircle;
                  return (
                    <div 
                      key={item.id}
                      className={`flex items-center gap-3 p-3 px-4 bg-white/[0.02] light:bg-slate-50 border rounded-xl cursor-pointer transition-all hover:bg-white/[0.04] light:hover:bg-slate-100 ${
                        item.complete 
                          ? 'opacity-40 border-white/[0.04] light:border-slate-200' 
                          : 'border-l-2 border-l-gray-500 light:border-l-emerald-500 border-white/[0.04] light:border-slate-200'
                      }`}
                      onClick={() => handleItemClick(item.section, item.id)}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                        item.complete 
                          ? 'bg-green-500/10 light:bg-emerald-100 text-green-500 light:text-emerald-600' 
                          : 'bg-white/[0.04] light:bg-white text-gray-500 light:text-slate-500'
                      }`}>
                        <Icon />
                      </div>
                      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                        <span className={`text-[0.8rem] font-medium truncate ${
                          item.complete ? 'line-through text-gray-500 light:text-slate-400' : 'text-gray-200 light:text-slate-900'
                        }`}>{item.label}</span>
                        <span className="text-[0.7rem] text-gray-500 light:text-emerald-600 font-medium">+{item.weight}%</span>
                      </div>
                      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0">
                        {item.complete ? (
                          <FaCheck className="text-green-500 light:text-emerald-500 text-xs" />
                        ) : (
                          <FaArrowRight className="text-gray-600 light:text-slate-400 text-[0.65rem]" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optional Section */}
            {optionalItems.length > 0 && (
              <div className="p-4 px-6 bg-black/20 light:bg-slate-50 border-t border-white/[0.03] light:border-slate-100">
                <h4 className="flex items-center gap-2 text-[0.7rem] font-semibold text-gray-500 light:text-slate-500 uppercase tracking-wider mb-3">
                  <FaCheckCircle className="text-green-500 light:text-blue-500 text-xs" />
                  <span>Optional</span>
                  <span className="ml-auto px-2 py-0.5 bg-white/[0.04] light:bg-slate-100 rounded text-[0.65rem] font-semibold text-gray-400 light:text-slate-600">
                    {optionalItems.filter(i => i.complete).length}/{optionalItems.length}
                  </span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {optionalItems.map((item) => {
                    const Icon = iconMap[item.id] || FaCheckCircle;
                    return (
                      <div 
                        key={item.id}
                        className={`flex items-center gap-3 p-3 px-4 bg-white/[0.02] light:bg-white border rounded-xl cursor-pointer transition-all hover:bg-white/[0.04] light:hover:bg-slate-50 ${
                          item.complete 
                            ? 'opacity-40 border-white/[0.04] light:border-slate-200' 
                            : 'border-l-2 border-l-gray-500 light:border-l-blue-400 border-white/[0.04] light:border-slate-200'
                        }`}
                        onClick={() => handleItemClick(item.section, item.id)}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                          item.complete 
                            ? 'bg-green-500/10 light:bg-blue-100 text-green-500 light:text-blue-600' 
                            : 'bg-white/[0.04] light:bg-slate-50 text-gray-500 light:text-slate-500'
                        }`}>
                          <Icon />
                        </div>
                        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                          <span className={`text-[0.8rem] font-medium truncate ${
                            item.complete ? 'line-through text-gray-500 light:text-slate-400' : 'text-gray-200 light:text-slate-900'
                          }`}>{item.label}</span>
                          <span className="text-[0.65rem] text-gray-500 light:text-blue-500 font-medium uppercase tracking-wide">Bonus</span>
                        </div>
                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0">
                          {item.complete ? (
                            <FaCheck className="text-green-500 light:text-blue-500 text-xs" />
                          ) : (
                            <FaArrowRight className="text-gray-600 light:text-slate-400 text-[0.65rem]" />
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
