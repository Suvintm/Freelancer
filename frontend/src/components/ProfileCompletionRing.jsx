/**
 * ProfileCompletionRing Component
 * Circular SVG progress ring around profile avatar + dropdown with completion breakdown
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
  FaExclamationCircle
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './ProfileCompletionRing.css';

const ProfileCompletionRing = ({ 
  user, 
  size = 56, 
  strokeWidth = 3,
  showDropdown = true,
  showPercentText = false,
  children 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Calculate completion status for each field
  const getCompletionStatus = () => {
    if (!user) return { items: [], percent: 0 };

    const items = [
      {
        id: 'name',
        label: 'Name',
        icon: FaUser,
        weight: 5,
        complete: !!user.name && user.name.length > 1,
        link: '/editor-profile',
      },
      {
        id: 'profilePicture',
        label: 'Profile Photo',
        icon: FaCamera,
        weight: 15,
        complete: !!user.profilePicture && !user.profilePicture.includes('flaticon'),
        link: '/editor-profile',
      },
      {
        id: 'bio',
        label: 'Bio (50+ chars)',
        icon: FaFileAlt,
        weight: 15,
        complete: !!user.bio && user.bio.length >= 50,
        link: '/editor-profile',
      },
      {
        id: 'skills',
        label: 'Skills (3+)',
        icon: FaTags,
        weight: 15,
        complete: Array.isArray(user.skills) && user.skills.length >= 3,
        link: '/editor-profile',
      },
      {
        id: 'portfolio',
        label: 'Portfolio (2+)',
        icon: FaImages,
        weight: 20,
        complete: (user.portfolioCount || 0) >= 2,
        link: '/editor-profile',
      },
      {
        id: 'socialLinks',
        label: 'Social Links (2+)',
        icon: FaLink,
        weight: 10,
        complete: user.socialLinksCount >= 2 || (
          (user.instagramUrl || user.youtubeUrl || user.twitterUrl || user.linkedinUrl ? 1 : 0) >= 2
        ),
        link: '/editor-profile',
      },
      {
        id: 'kyc',
        label: 'Bank Account (KYC)',
        icon: FaUniversity,
        weight: 15,
        complete: user.kycStatus === 'verified',
        link: '/editor-profile', // Will show KYC modal
      },
    ];

    // Calculate percentage
    let percent = items.reduce((acc, item) => acc + (item.complete ? item.weight : 0), 0);
    
    // Use server-provided value if available
    if (user.profileCompletionPercent !== undefined) {
      percent = user.profileCompletionPercent;
    }

    return { items, percent };
  };

  const { items, percent } = getCompletionStatus();

  // Color based on percentage
  const getColor = (pct) => {
    if (pct >= 80) return '#10b981'; // Green
    if (pct >= 50) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const color = getColor(percent);

  // SVG circle calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  // Close dropdown on outside click
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
    <div className="pcr-container" ref={dropdownRef}>
      {/* Main Ring + Avatar */}
      <div
        className="pcr-ring-wrapper"
        style={{ width: size, height: size }}
        onClick={() => showDropdown && setIsOpen(!isOpen)}
      >
        {/* SVG Ring */}
        <svg
          className="pcr-svg"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            className="pcr-bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            className="pcr-progress"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ 
              transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
            }}
          />
        </svg>

        {/* Avatar (children) */}
        <div className="pcr-avatar">
          {children}
        </div>

        {/* Dropdown Arrow (if enabled) */}
        {showDropdown && (
          <div className="pcr-arrow" style={{ backgroundColor: color }}>
            <FaChevronDown 
              className={`pcr-arrow-icon ${isOpen ? 'pcr-arrow-open' : ''}`}
            />
          </div>
        )}
      </div>

      {/* Percentage Text (optional) */}
      {showPercentText && (
        <div className="pcr-percent-text" style={{ color }}>
          {percent}%
        </div>
      )}

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="pcr-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="pcr-dropdown-header">
              <div className="pcr-dropdown-title">
                <span>Profile Completion</span>
                <span className="pcr-dropdown-percent" style={{ color }}>
                  {percent}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="pcr-progressbar-bg">
                <motion.div
                  className="pcr-progressbar-fill"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Status Message */}
              <p className="pcr-status-msg">
                {percent >= 100 ? (
                  <span className="pcr-msg-success">✨ Profile Complete! Maximum engagement unlocked</span>
                ) : percent >= 80 ? (
                  <span className="pcr-msg-good">Great! Complete 100% for maximum engagement</span>
                ) : (
                  <span className="pcr-msg-warning">
                    <FaExclamationCircle /> Complete at least 80% to get noticed
                  </span>
                )}
              </p>
            </div>

            {/* Checklist */}
            <div className="pcr-checklist">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`pcr-item ${item.complete ? 'pcr-item-done' : 'pcr-item-pending'}`}
                  onClick={() => {
                    navigate(item.link);
                    setIsOpen(false);
                  }}
                >
                  <div className="pcr-item-left">
                    <item.icon className="pcr-item-icon" />
                    <span className="pcr-item-label">{item.label}</span>
                  </div>
                  <div className="pcr-item-right">
                    <span className="pcr-item-weight">+{item.weight}%</span>
                    {item.complete ? (
                      <div className="pcr-tick">
                        <FaCheck />
                      </div>
                    ) : (
                      <div className="pcr-pending">
                        <FaChevronDown style={{ transform: 'rotate(-90deg)' }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="pcr-footer">
              <button
                className="pcr-footer-btn"
                onClick={() => {
                  navigate('/editor-profile');
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
