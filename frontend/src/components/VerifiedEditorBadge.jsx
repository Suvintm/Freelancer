/**
 * VerifiedEditorBadge Component
 * Dark base with light: variant overrides for theme toggle
 * Now includes achievement badge icons in the third section
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCheckCircle, 
  FaCrown, 
  FaShieldAlt,
  FaStar,
  FaUserCheck,
  FaChartLine
} from 'react-icons/fa';
import {
  HiSparkles,
  HiOutlineStar,
  HiOutlineTrophy,
  HiOutlineBolt,
  HiOutlineFilm,
  HiOutlinePlayCircle,
  HiOutlineCheckBadge,
  HiOutlineCurrencyRupee,
  HiOutlineUserGroup,
} from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';

// Badge icon mapping
const BADGE_ICONS = {
  rising_star: HiOutlineStar,
  order_master: HiOutlineTrophy,
  elite_editor: FaCrown,
  top_rated: HiOutlineStar,
  fast_deliverer: HiOutlineBolt,
  portfolio_pro: HiOutlineFilm,
  reel_creator: HiOutlinePlayCircle,
  verified_pro: HiOutlineCheckBadge,
  high_earner: HiOutlineCurrencyRupee,
  community_star: HiOutlineUserGroup,
};

// Badge colors
const BADGE_COLORS = {
  rising_star: '#F59E0B',
  order_master: '#8B5CF6',
  elite_editor: '#F97316',
  top_rated: '#EAB308',
  fast_deliverer: '#3B82F6',
  portfolio_pro: '#EC4899',
  reel_creator: '#14B8A6',
  verified_pro: '#10B981',
  high_earner: '#22C55E',
  community_star: '#6366F1',
};

const VerifiedEditorBadge = ({ user: userProp, profile, kycStatus, completionPercent }) => {
  const navigate = useNavigate();
  const { user, backendURL } = useAppContext();
  const [badgeProgress, setBadgeProgress] = useState([]);
  
  const isFullyVerified = userProp?.isVerified && kycStatus === 'verified' && completionPercent >= 80;
  
  // Fetch badge progress on mount
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const token = user?.token;
        if (!token) return;
        
        const res = await axios.get(`${backendURL}/api/badges/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.success) {
          setBadgeProgress(res.data.progress || []);
        }
      } catch (err) {
        console.error('Failed to fetch badges:', err);
      }
    };
    
    fetchBadges();
  }, [user?.token, backendURL]);
  
  const earnedCount = badgeProgress.filter(b => b.earned).length;
  
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-[#0a0a0c] light:bg-white border border-white/[0.06] light:border-slate-200 mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Status Icon */}
          <div className={`relative p-3 rounded-xl ${isFullyVerified ? 'bg-emerald-500/10 light:bg-emerald-50' : 'bg-blue-500/10 light:bg-blue-50'}`}>
            {isFullyVerified ? (
              <FaShieldAlt className="text-2xl text-emerald-500" />
            ) : (
              <FaUserCheck className="text-2xl text-blue-500" />
            )}
            <motion.div 
              className="absolute -top-1 -right-1"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <HiSparkles className="text-amber-400 text-sm" />
            </motion.div>
          </div>
          
          {/* Text */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-100 light:text-slate-900">
                {isFullyVerified ? 'Verified Editor' : 'Profile Status'}
              </h3>
              {isFullyVerified && (
                <span className="px-2 py-0.5 bg-emerald-500/20 light:bg-emerald-100 text-emerald-400 light:text-emerald-600 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <FaCheckCircle className="text-[8px]" /> VERIFIED
                </span>
              )}
            </div>
            <p className="text-gray-500 light:text-slate-500 text-sm">
              {isFullyVerified 
                ? 'Your profile is live and discoverable by clients'
                : 'Complete your profile to get listed'
              }
            </p>
          </div>
        </div>
        
        {/* Stats/Badges - Custom widths: 20% + 20% + 60% */}
        <div className="flex gap-3">
          {/* Profile Score - 20% */}
          <div className="w-[20%] min-w-[70px] bg-white/[0.03] light:bg-slate-50 rounded-xl p-3 text-center">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle className="fill-none stroke-white/[0.06] light:stroke-slate-200" cx="50" cy="50" r="40" strokeWidth="8" />
                <circle 
                  className="fill-none stroke-emerald-500" 
                  cx="50" cy="50" r="40" 
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="251"
                  strokeDashoffset={251 - (251 * (completionPercent || 0) / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs sm:text-sm font-bold text-emerald-400 light:text-emerald-600">{completionPercent || 0}%</span>
              </div>
            </div>
            <p className="text-[9px] sm:text-[10px] text-gray-500 light:text-slate-500 font-medium">Profile Score</p>
          </div>
          
          {/* KYC Status - 20% */}
          <div className="w-[20%] min-w-[70px] bg-white/[0.03] light:bg-slate-50 rounded-xl p-3 text-center">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
              kycStatus === 'verified' ? 'bg-emerald-500/10 light:bg-emerald-100' :
              kycStatus === 'pending' || kycStatus === 'submitted' ? 'bg-blue-500/10 light:bg-blue-100' :
              'bg-amber-500/10 light:bg-amber-100'
            }`}>
              {kycStatus === 'verified' ? (
                <FaCheckCircle className="text-base sm:text-lg text-emerald-500" />
              ) : kycStatus === 'pending' || kycStatus === 'submitted' ? (
                <FaChartLine className="text-base sm:text-lg text-blue-500" />
              ) : (
                <FaShieldAlt className="text-base sm:text-lg text-amber-500" />
              )}
            </div>
            <p className="text-[9px] sm:text-[10px] text-gray-500 light:text-slate-500 font-medium">
              KYC {kycStatus === 'verified' ? 'Verified' : kycStatus === 'pending' || kycStatus === 'submitted' ? 'Pending' : 'Required'}
            </p>
          </div>
          
          {/* Achievements - 60% - All 10 badge icons */}
          <div 
            className="flex-1 bg-white/[0.03] light:bg-slate-50 rounded-xl p-3 cursor-pointer hover:bg-white/[0.06] light:hover:bg-slate-100 transition-colors"
            onClick={() => navigate('/achievements')}
          >
            {/* Badge Icons Grid - 4 per row (2.5 rows for 10 badges) */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 mb-2 justify-items-center">
              {Object.entries(BADGE_ICONS).map(([badgeId, IconComponent]) => {
                const badge = badgeProgress.find(b => b.id === badgeId);
                const isEarned = badge?.earned || false;
                const color = BADGE_COLORS[badgeId];
                
                return (
                  <div
                    key={badgeId}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
                      isEarned 
                        ? 'opacity-100' 
                        : 'opacity-30 grayscale'
                    }`}
                    style={{
                      backgroundColor: isEarned ? `${color}20` : 'rgba(255,255,255,0.05)',
                      border: isEarned ? `1.5px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
                    }}
                    title={badge?.name || badgeId}
                  >
                    <IconComponent 
                      className="text-xs sm:text-sm" 
                      style={{ color: isEarned ? color : '#666' }}
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-500 light:text-slate-500 font-medium text-center">
              {earnedCount}/10 Badges
            </p>
          </div>
        </div>
        
        {/* Action Button */}
        {!isFullyVerified && (
          <button
            onClick={() => navigate('/editor-profile-update')}
            className="w-full mt-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            Complete Your Profile
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default VerifiedEditorBadge;

