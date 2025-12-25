/**
 * VerifiedEditorBadge Component
 * Professional corporate styling with indigo/purple palette
 * Compact design with achievement badges
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
  verified_pro: '#6366F1',
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
      className="relative overflow-hidden rounded-2xl bg-[#111118] light:bg-white border border-white/[0.06] light:border-slate-200 h-full"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Gradient accent line - indigo/purple */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500" />
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {/* Status Icon */}
          <div className={`relative p-2.5 rounded-xl ${isFullyVerified ? 'bg-indigo-500/10 light:bg-indigo-50' : 'bg-blue-500/10 light:bg-blue-50'}`}>
            {isFullyVerified ? (
              <FaShieldAlt className="text-xl text-indigo-400 light:text-indigo-500" />
            ) : (
              <FaUserCheck className="text-xl text-blue-400 light:text-blue-500" />
            )}
          </div>
          
          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-zinc-100 light:text-slate-900 text-sm">
                {isFullyVerified ? 'Verified Editor' : 'Profile Status'}
              </h3>
              {isFullyVerified && (
                <span className="px-1.5 py-0.5 bg-indigo-500/20 light:bg-indigo-100 text-indigo-400 light:text-indigo-600 text-[9px] font-bold rounded-full flex items-center gap-0.5">
                  <FaCheckCircle className="text-[7px]" /> VERIFIED
                </span>
              )}
            </div>
            <p className="text-zinc-500 light:text-slate-500 text-xs truncate">
              {isFullyVerified 
                ? 'Your profile is live and discoverable by clients'
                : 'Complete your profile to get listed'
              }
            </p>
          </div>
        </div>
        
        {/* Stats Row - Compact */}
        <div className="flex gap-2">
          {/* Profile Score */}
          <div className="flex-shrink-0 bg-white/[0.03] light:bg-slate-50 rounded-xl p-2.5 text-center min-w-[70px]">
            <div className="relative w-9 h-9 mx-auto mb-1.5">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle className="fill-none stroke-white/[0.06] light:stroke-slate-200" cx="50" cy="50" r="40" strokeWidth="10" />
                <circle 
                  className="fill-none stroke-indigo-500" 
                  cx="50" cy="50" r="40" 
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="251"
                  strokeDashoffset={251 - (251 * (completionPercent || 0) / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-indigo-400 light:text-indigo-600">{completionPercent || 0}%</span>
              </div>
            </div>
            <p className="text-[9px] text-zinc-500 light:text-slate-500 font-medium">Profile Score</p>
          </div>
          
          {/* KYC Status */}
          <div className="flex-shrink-0 bg-white/[0.03] light:bg-slate-50 rounded-xl p-2.5 text-center min-w-[70px]">
            <div className={`w-9 h-9 mx-auto mb-1.5 rounded-full flex items-center justify-center ${
              kycStatus === 'verified' ? 'bg-indigo-500/10 light:bg-indigo-100' :
              kycStatus === 'pending' || kycStatus === 'submitted' ? 'bg-blue-500/10 light:bg-blue-100' :
              'bg-amber-500/10 light:bg-amber-100'
            }`}>
              {kycStatus === 'verified' ? (
                <FaCheckCircle className="text-sm text-indigo-400 light:text-indigo-500" />
              ) : kycStatus === 'pending' || kycStatus === 'submitted' ? (
                <FaChartLine className="text-sm text-blue-400 light:text-blue-500" />
              ) : (
                <FaShieldAlt className="text-sm text-amber-400 light:text-amber-500" />
              )}
            </div>
            <p className="text-[9px] text-zinc-500 light:text-slate-500 font-medium">
              KYC {kycStatus === 'verified' ? 'Verified' : kycStatus === 'pending' || kycStatus === 'submitted' ? 'Pending' : 'Required'}
            </p>
          </div>
          
          {/* Achievements - Flexible */}
          <div 
            className="flex-1 bg-white/[0.03] light:bg-slate-50 rounded-xl p-2.5 cursor-pointer hover:bg-white/[0.05] light:hover:bg-slate-100 transition-colors min-w-0"
            onClick={() => navigate('/achievements')}
          >
            {/* Badge Icons Grid */}
            <div className="grid grid-cols-5 gap-1 mb-1.5 justify-items-center">
              {Object.entries(BADGE_ICONS).map(([badgeId, IconComponent]) => {
                const badge = badgeProgress.find(b => b.id === badgeId);
                const isEarned = badge?.earned || false;
                const color = BADGE_COLORS[badgeId];
                
                return (
                  <div
                    key={badgeId}
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isEarned ? 'opacity-100' : 'opacity-20 grayscale'
                    }`}
                    style={{
                      backgroundColor: isEarned ? `${color}15` : 'rgba(255,255,255,0.03)',
                      border: isEarned ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.06)',
                    }}
                    title={badge?.name || badgeId}
                  >
                    <IconComponent 
                      className="text-[9px]" 
                      style={{ color: isEarned ? color : '#555' }}
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-zinc-500 light:text-slate-500 font-medium text-center">
              {earnedCount}/10 Badges
            </p>
          </div>
        </div>
        
        {/* Action Button - Only if not verified */}
        {!isFullyVerified && (
          <button
            onClick={() => navigate('/editor-profile-update')}
            className="w-full mt-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            Complete Your Profile
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default VerifiedEditorBadge;
