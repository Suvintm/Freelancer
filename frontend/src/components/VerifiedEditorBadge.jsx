/**
 * VerifiedEditorBadge Component
 * Dark base with light: variant overrides for theme toggle
 */

import { motion } from 'framer-motion';
import { 
  FaCheckCircle, 
  FaCrown, 
  FaShieldAlt,
  FaStar,
  FaUserCheck,
  FaChartLine
} from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

const VerifiedEditorBadge = ({ user, profile, kycStatus, completionPercent }) => {
  const navigate = useNavigate();
  
  const isFullyVerified = user?.isVerified && kycStatus === 'verified' && completionPercent >= 80;
  
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
        
        {/* Stats/Badges */}
        <div className="grid grid-cols-3 gap-3">
          {/* Profile Score */}
          <div className="bg-white/[0.03] light:bg-slate-50 rounded-xl p-3 text-center">
            <div className="relative w-12 h-12 mx-auto mb-2">
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
                <span className="text-sm font-bold text-emerald-400 light:text-emerald-600">{completionPercent || 0}%</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 light:text-slate-500 font-medium">Profile Score</p>
          </div>
          
          {/* KYC Status */}
          <div className="bg-white/[0.03] light:bg-slate-50 rounded-xl p-3 text-center">
            <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
              kycStatus === 'verified' ? 'bg-emerald-500/10 light:bg-emerald-100' :
              kycStatus === 'pending' || kycStatus === 'submitted' ? 'bg-blue-500/10 light:bg-blue-100' :
              'bg-amber-500/10 light:bg-amber-100'
            }`}>
              {kycStatus === 'verified' ? (
                <FaCheckCircle className="text-lg text-emerald-500" />
              ) : kycStatus === 'pending' || kycStatus === 'submitted' ? (
                <FaChartLine className="text-lg text-blue-500" />
              ) : (
                <FaShieldAlt className="text-lg text-amber-500" />
              )}
            </div>
            <p className="text-[10px] text-gray-500 light:text-slate-500 font-medium">
              KYC {kycStatus === 'verified' ? 'Verified' : kycStatus === 'pending' || kycStatus === 'submitted' ? 'Pending' : 'Required'}
            </p>
          </div>
          
          {/* Rank */}
          <div className="bg-white/[0.03] light:bg-slate-50 rounded-xl p-3 text-center">
            <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
              isFullyVerified ? 'bg-amber-500/10 light:bg-amber-100' : 'bg-gray-500/10 light:bg-slate-100'
            }`}>
              {isFullyVerified ? (
                <FaCrown className="text-lg text-amber-500" />
              ) : (
                <FaStar className="text-lg text-gray-500 light:text-slate-400" />
              )}
            </div>
            <p className="text-[10px] text-gray-500 light:text-slate-500 font-medium">
              {isFullyVerified ? 'Top Editor' : 'New Editor'}
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
