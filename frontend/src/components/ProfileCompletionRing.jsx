/**
 * ProfileCompletionRing Component
 * Circular SVG progress ring around profile avatar + dropdown with completion breakdown
 * Fetches real data from /api/profile/completion-status endpoint
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
import './ProfileCompletionRing.css';

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

  // Fetch completion status from API
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
        // Fall back to user data if API fails
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
          {loading ? '...' : `${percent}%`}
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
              {items.map((item) => {
                const IconComponent = iconMap[item.id] || FaUser;
                return (
                  <div
                    key={item.id}
                    className={`pcr-item ${item.complete ? 'pcr-item-done' : 'pcr-item-pending'}`}
                    onClick={() => {
                      navigate('/editor-profile-update');
                      setIsOpen(false);
                    }}
                  >
                    <div className="pcr-item-left">
                      <IconComponent className="pcr-item-icon" />
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
                );
              })}
            </div>

            {/* Footer */}
            <div className="pcr-footer">
              <button
                className="pcr-footer-btn"
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
