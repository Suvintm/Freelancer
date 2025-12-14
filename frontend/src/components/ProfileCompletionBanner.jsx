/**
 * ProfileCompletionBanner Component
 * Dismissible banner prompting profile completion on all editor pages
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaExclamationTriangle, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import './ProfileCompletionBanner.css';

const ProfileCompletionBanner = ({ minPercent = 80 }) => {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [showKYC, setShowKYC] = useState(false);

  // Check localStorage for dismissed state
  useEffect(() => {
    const dismissedUntil = localStorage.getItem('profileBannerDismissed');
    if (dismissedUntil && new Date(dismissedUntil) > new Date()) {
      setDismissed(true);
    }
  }, []);

  // Don't show for clients
  if (user?.role !== 'editor') return null;

  // Don't show if dismissed
  if (dismissed) return null;

  const percent = user?.profileCompletionPercent || 0;
  const kycVerified = user?.kycStatus === 'verified';

  // Don't show if 100% complete and KYC verified
  if (percent >= 100 && kycVerified) return null;

  // Handle dismiss (hide for 24 hours)
  const handleDismiss = () => {
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    localStorage.setItem('profileBannerDismissed', tomorrow.toISOString());
    setDismissed(true);
  };

  // Determine which message to show
  const showProfileBanner = percent < minPercent;
  const showKYCBanner = !kycVerified && percent >= minPercent;
  const show100Banner = percent >= minPercent && percent < 100 && kycVerified;

  if (!showProfileBanner && !showKYCBanner && !show100Banner) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="pcb-banner"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <div className="pcb-content">
          {/* Icon */}
          <div className={`pcb-icon ${showProfileBanner ? 'pcb-icon-warning' : 'pcb-icon-info'}`}>
            {showProfileBanner ? <FaExclamationTriangle /> : <FaCheckCircle />}
          </div>

          {/* Message */}
          <div className="pcb-text">
            {showProfileBanner && (
              <>
                <span className="pcb-title">Complete your profile</span>
                <span className="pcb-desc">
                  You need at least <strong>{minPercent}%</strong> profile completion to get noticed. 
                  Currently at <strong>{percent}%</strong>.
                </span>
              </>
            )}
            {showKYCBanner && (
              <>
                <span className="pcb-title">Link your bank account</span>
                <span className="pcb-desc">
                  Complete KYC verification to receive payouts from completed orders.
                </span>
              </>
            )}
            {show100Banner && (
              <>
                <span className="pcb-title">Almost there!</span>
                <span className="pcb-desc">
                  Complete <strong>100%</strong> profile for maximum engagement. 
                  Currently at <strong>{percent}%</strong>.
                </span>
              </>
            )}
          </div>

          {/* Action */}
          <button
            className="pcb-action"
            onClick={() => navigate('/editor-profile')}
          >
            {showKYCBanner ? 'Complete KYC' : 'Complete Profile'}
            <FaArrowRight />
          </button>

          {/* Dismiss */}
          <button
            className="pcb-dismiss"
            onClick={handleDismiss}
            title="Dismiss for 24 hours"
          >
            <FaTimes />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="pcb-progress-bg">
          <motion.div
            className="pcb-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.8 }}
            style={{
              background: percent >= 80 
                ? 'linear-gradient(90deg, #10b981, #059669)' 
                : percent >= 50 
                  ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                  : 'linear-gradient(90deg, #ef4444, #dc2626)'
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileCompletionBanner;
