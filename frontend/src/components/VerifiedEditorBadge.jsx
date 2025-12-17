/**
 * VerifiedEditorBadge Component
 * Shows when profile >= 80% complete with profile completion ring
 * Professional light theme matching Homepage style
 */

import { motion } from 'framer-motion';
import { 
  FaCheckCircle, 
  FaMoneyBillWave, 
  FaShieldAlt,
  FaStar,
  FaCrown
} from 'react-icons/fa';
import { HiCheckBadge } from 'react-icons/hi2';

const VerifiedEditorBadge = ({ user, profile, kycStatus, completionPercent = 80 }) => {
  const isKycVerified = kycStatus === 'verified' || user?.kycStatus === 'verified';
  
  // Get profile picture
  const profilePicture = profile?.user?.profilePicture || 
                          user?.profilePicture || 
                          'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
  
  // Get name
  const name = profile?.user?.name || user?.name || 'Editor';
  const firstName = name.split(' ')[0];
  
  // Profile completion percentage for the ring
  const percent = completionPercent || user?.profileCompletionPercent || 80;
  
  // Calculate SVG circle values
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percent / 100);

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-white light:bg-white border border-slate-200 light:border-slate-200 shadow-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 light:from-emerald-50/50 via-transparent to-blue-50/50 light:to-blue-50/50" />
      
      <div className="relative p-5 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
          
          {/* Profile Image with Completion Ring */}
          <div className="relative flex-shrink-0">
            {/* SVG Completion Ring */}
            <div className="relative w-20 h-20 md:w-24 md:h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle 
                  className="fill-none stroke-slate-100 light:stroke-slate-100" 
                  cx="50" cy="50" r={radius} 
                  strokeWidth="4" 
                />
                {/* Progress circle */}
                <circle 
                  className="fill-none stroke-emerald-500 transition-all duration-700"
                  cx="50" cy="50" r={radius}
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: strokeDashoffset,
                  }}
                />
              </svg>
              
              {/* Profile image centered inside ring */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 md:w-16 md:h-16">
                <img
                  src={profilePicture}
                  alt={name}
                  className="w-full h-full rounded-full object-cover bg-slate-100 light:bg-slate-100 border-2 border-white light:border-white shadow-sm"
                />
              </div>
              
              {/* Percentage badge */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white light:border-white shadow-lg">
                <span className="text-white text-[10px] font-bold">{percent}%</span>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 min-w-0">
            {/* Name with verified badge */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg md:text-xl font-bold text-slate-900 light:text-slate-900 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Welcome back, {firstName}
              </h3>
              <HiCheckBadge className="text-emerald-500 text-xl flex-shrink-0" />
            </div>
            
            {/* Verified Status */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 light:bg-emerald-50 border border-emerald-200 light:border-emerald-200 rounded-full text-emerald-600 light:text-emerald-600 text-xs font-semibold">
                <FaShieldAlt className="text-[10px]" />
                Verified Editor
              </span>
              
              {isKycVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 light:bg-blue-50 border border-blue-200 light:border-blue-200 rounded-full text-blue-600 light:text-blue-600 text-xs font-semibold">
                  <FaMoneyBillWave className="text-[10px]" />
                  Earnings Enabled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 light:bg-amber-50 border border-amber-200 light:border-amber-200 rounded-full text-amber-600 light:text-amber-600 text-xs font-semibold">
                  <FaMoneyBillWave className="text-[10px]" />
                  Complete KYC to Earn
                </span>
              )}
            </div>
          </div>

          {/* Right side - Stats/Crown */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {/* Premium Editor Badge */}
            <div className="flex flex-col items-center gap-1 px-5 py-3 bg-gradient-to-b from-amber-50 light:from-amber-50 to-white light:to-white rounded-xl border border-amber-100 light:border-amber-100">
              <FaCrown className="text-amber-500 text-lg" />
              <span className="text-[10px] text-slate-500 light:text-slate-500 font-medium uppercase tracking-wider">Pro Editor</span>
            </div>
            
            {/* Rating */}
            <div className="flex flex-col items-center gap-1 px-5 py-3 bg-gradient-to-b from-slate-50 light:from-slate-50 to-white light:to-white rounded-xl border border-slate-100 light:border-slate-100">
              <div className="flex items-center gap-1">
                <FaStar className="text-amber-400 text-sm" />
                <span className="text-slate-900 light:text-slate-900 font-bold text-lg">{profile?.rating || user?.rating || '5.0'}</span>
              </div>
              <span className="text-[10px] text-slate-500 light:text-slate-500 font-medium uppercase tracking-wider">Rating</span>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />
      </div>
    </motion.div>
  );
};

export default VerifiedEditorBadge;
