/**
 * VerifiedEditorBadge Component
 * Shows when profile >= 80% complete with professional verified badge
 * Also shows KYC/Earnings status
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

const VerifiedEditorBadge = ({ user, profile, kycStatus }) => {
  const isKycVerified = kycStatus === 'verified' || user?.kycStatus === 'verified';
  
  // Get profile picture
  const profilePicture = profile?.user?.profilePicture || 
                          user?.profilePicture || 
                          'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
  
  // Get name
  const name = profile?.user?.name || user?.name || 'Editor';
  const firstName = name.split(' ')[0];

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a0a0c] via-[#0d0d10] to-[#0a0a0c] border border-white/[0.06] mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.03] via-transparent to-blue-500/[0.03]" />
      
      <div className="relative p-5 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
          
          {/* Profile Image with Verified Ring */}
          <div className="relative flex-shrink-0">
            {/* Outer glow ring */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 to-blue-500/30 rounded-full blur-sm" />
            
            {/* Profile image container */}
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full p-[2px] bg-gradient-to-r from-emerald-500 to-blue-500">
              <img
                src={profilePicture}
                alt={name}
                className="w-full h-full rounded-full object-cover bg-[#1a1a1a]"
              />
            </div>
            
            {/* Verified badge on image */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full flex items-center justify-center border-2 border-[#0a0a0c] shadow-lg shadow-emerald-500/30">
              <FaCheckCircle className="text-white text-xs" />
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 min-w-0">
            {/* Name with verified badge */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg md:text-xl font-bold text-white truncate">
                Welcome back, {firstName}
              </h3>
              <HiCheckBadge className="text-emerald-400 text-xl flex-shrink-0" />
            </div>
            
            {/* Verified Status */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold">
                <FaShieldAlt className="text-[10px]" />
                Verified Editor
              </span>
              
              {isKycVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-semibold">
                  <FaMoneyBillWave className="text-[10px]" />
                  Earnings Enabled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-semibold">
                  <FaMoneyBillWave className="text-[10px]" />
                  Complete KYC to Earn
                </span>
              )}
            </div>
          </div>

          {/* Right side - Stats/Crown */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            {/* Premium Editor Badge */}
            <div className="flex flex-col items-center gap-1 px-5 py-3 bg-gradient-to-b from-white/[0.03] to-transparent rounded-xl border border-white/[0.05]">
              <FaCrown className="text-amber-400 text-lg" />
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Pro Editor</span>
            </div>
            
            {/* Rating */}
            <div className="flex flex-col items-center gap-1 px-5 py-3 bg-gradient-to-b from-white/[0.03] to-transparent rounded-xl border border-white/[0.05]">
              <div className="flex items-center gap-1">
                <FaStar className="text-amber-400 text-sm" />
                <span className="text-white font-bold text-lg">{profile?.rating || user?.rating || '5.0'}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Rating</span>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      </div>
    </motion.div>
  );
};

export default VerifiedEditorBadge;
