// SuvixScoreBadge.jsx - Display editor's Suvix Score
import React from 'react';
import './SuvixScoreBadge.css';

const TIER_CONFIG = {
  elite: { label: 'Elite Editor', color: '#FFD700', icon: '🏆', bgGradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' },
  expert: { label: 'Expert', color: '#9B59B6', icon: '⭐', bgGradient: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)' },
  professional: { label: 'Professional', color: '#3498DB', icon: '💎', bgGradient: 'linear-gradient(135deg, #3498DB 0%, #2980B9 100%)' },
  established: { label: 'Established', color: '#27AE60', icon: '✓', bgGradient: 'linear-gradient(135deg, #27AE60 0%, #1E8449 100%)' },
  rising: { label: 'Rising Star', color: '#1ABC9C', icon: '🌟', bgGradient: 'linear-gradient(135deg, #1ABC9C 0%, #16A085 100%)' },
  newcomer: { label: 'Newcomer', color: '#95A5A6', icon: '🆕', bgGradient: 'linear-gradient(135deg, #95A5A6 0%, #7F8C8D 100%)' },
};

const SuvixScoreBadge = ({ 
  score = 0, 
  tier = 'newcomer', 
  isEligible = false,
  isSelfView = false, // When true, show score even if not eligible (for editor viewing own profile)
  size = 'medium', // small, medium, large
  showLabel = true,
  showScore = true,
  animated = true,
  onClick = null,
}) => {
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.newcomer;
  
  // Size configurations
  const sizeConfig = {
    small: { width: 40, height: 40, fontSize: 12, strokeWidth: 3 },
    medium: { width: 60, height: 60, fontSize: 16, strokeWidth: 4 },
    large: { width: 80, height: 80, fontSize: 22, strokeWidth: 5 },
  };
  
  const config = sizeConfig[size] || sizeConfig.medium;
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Show progress for eligible users OR for self-viewing editors
  const shouldShowProgress = isEligible || isSelfView;
  const progress = shouldShowProgress ? (score / 100) * circumference : 0;
  const dashOffset = circumference - progress;

  // Only hide score if NOT eligible AND NOT self-viewing
  if (!isEligible && !isSelfView) {
    return (
      <div className={`suvix-badge suvix-badge--${size} suvix-badge--ineligible`}>
        <div className="suvix-badge__circle">
          <span className="suvix-badge__icon">🆕</span>
        </div>
        {showLabel && <span className="suvix-badge__label">New Editor</span>}
      </div>
    );
  }


  return (
    <div 
      className={`suvix-badge suvix-badge--${size} ${animated ? 'suvix-badge--animated' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="suvix-badge__circle-container">
        <svg 
          width={config.width} 
          height={config.width} 
          viewBox={`0 0 ${config.width} ${config.width}`}
        >
          {/* Background circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={config.strokeWidth}
          />
          {/* Progress circle */}
          <circle
            className="suvix-badge__progress"
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={tierConfig.color}
            strokeWidth={config.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
              filter: `drop-shadow(0 0 8px ${tierConfig.color}50)`,
            }}
          />
        </svg>
        {showScore && (
          <div 
            className="suvix-badge__score"
            style={{ fontSize: config.fontSize, color: tierConfig.color }}
          >
            {score}
          </div>
        )}
        {!showScore && (
          <div className="suvix-badge__icon-center">
            {tierConfig.icon}
          </div>
        )}
      </div>
      {showLabel && (
        <div 
          className="suvix-badge__label"
          style={{ color: tierConfig.color }}
        >
          {tierConfig.label}
        </div>
      )}
    </div>
  );
};

export default SuvixScoreBadge;
