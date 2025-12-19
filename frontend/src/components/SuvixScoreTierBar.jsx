// SuvixScoreTierBar.jsx - Vertical progress bar showing tier progression
import React from 'react';
import './SuvixScoreTierBar.css';

const TIERS = [
  { name: 'elite', min: 90, max: 100, label: 'Elite Editor', color: '#FFD700', icon: '🏆' },
  { name: 'expert', min: 80, max: 89, label: 'Expert', color: '#9B59B6', icon: '⭐' },
  { name: 'professional', min: 70, max: 79, label: 'Professional', color: '#3498DB', icon: '💎' },
  { name: 'established', min: 60, max: 69, label: 'Established', color: '#27AE60', icon: '✓' },
  { name: 'rising', min: 50, max: 59, label: 'Rising Star', color: '#1ABC9C', icon: '🌟' },
  { name: 'newcomer', min: 0, max: 49, label: 'Newcomer', color: '#95A5A6', icon: '🆕' },
];

const SuvixScoreTierBar = ({ 
  score = 0, 
  currentTier = 'newcomer',
  isEligible = false,
  isSelfView = false, // When true, show progress even if not publicly eligible
  showLabels = true,
  height = 400,
}) => {
  // Calculate fill percentage - show for eligible users OR self-viewing editors
  const shouldShowProgress = isEligible || isSelfView;
  const fillPercent = shouldShowProgress ? score : 0;
  
  // Find current tier index (reversed because display is bottom-to-top)
  const currentTierIndex = TIERS.findIndex(t => t.name === currentTier);
  const currentTierConfig = TIERS[currentTierIndex] || TIERS[5];

  // Calculate points to next tier
  const nextTier = currentTierIndex > 0 ? TIERS[currentTierIndex - 1] : null;
  const pointsToNext = nextTier ? nextTier.min - score : 0;

  return (
    <div className="tier-bar" style={{ height }}>
      <div className="tier-bar__container">
        {/* Tier labels on the left */}
        <div className="tier-bar__labels">
          {TIERS.map((tier, index) => (
            <div 
              key={tier.name}
              className={`tier-bar__label ${tier.name === currentTier ? 'tier-bar__label--active' : ''}`}
              style={{ 
                color: tier.name === currentTier ? tier.color : 'rgba(255,255,255,0.5)',
                top: `${(index / (TIERS.length - 1)) * 100}%`,
              }}
            >
              <span className="tier-bar__label-icon">{tier.icon}</span>
              {showLabels && (
                <span className="tier-bar__label-text">{tier.label}</span>
              )}
              <span className="tier-bar__label-range">{tier.min}</span>
            </div>
          ))}
        </div>

        {/* The actual bar */}
        <div className="tier-bar__track">
          {/* Tier sections */}
          <div className="tier-bar__sections">
            {TIERS.slice().reverse().map((tier, index) => (
              <div 
                key={tier.name}
                className="tier-bar__section"
                style={{ 
                  height: `${100 / TIERS.length}%`,
                  background: `linear-gradient(to top, ${tier.color}20, ${tier.color}40)`,
                  borderLeft: `3px solid ${tier.color}40`,
                }}
              />
            ))}
          </div>

          {/* Fill bar */}
          <div 
            className="tier-bar__fill"
            style={{ 
              height: `${fillPercent}%`,
              background: `linear-gradient(to top, ${currentTierConfig.color}80, ${currentTierConfig.color})`,
              boxShadow: `0 0 20px ${currentTierConfig.color}60`,
            }}
          />

          {/* Current position marker */}
          {shouldShowProgress && (
            <div 
              className="tier-bar__marker"
              style={{ 
                bottom: `${fillPercent}%`,
                borderColor: currentTierConfig.color,
              }}
            >
              <div 
                className="tier-bar__marker-score"
                style={{ 
                  background: currentTierConfig.color,
                  boxShadow: `0 0 10px ${currentTierConfig.color}`,
                }}
              >
                {score}
              </div>
            </div>
          )}
        </div>

        {/* Right side - next tier info */}
        {nextTier && pointsToNext > 0 && (
          <div className="tier-bar__next">
            <div className="tier-bar__next-label">
              <span className="tier-bar__next-icon">{nextTier.icon}</span>
              <span className="tier-bar__next-points">
                {pointsToNext} pts to {nextTier.label}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom - current tier card */}
      <div 
        className="tier-bar__current"
        style={{ 
          borderColor: currentTierConfig.color,
          background: `linear-gradient(135deg, ${currentTierConfig.color}20, transparent)`,
        }}
      >
        <span className="tier-bar__current-icon">{currentTierConfig.icon}</span>
        <div className="tier-bar__current-info">
          <span className="tier-bar__current-label" style={{ color: currentTierConfig.color }}>
            {currentTierConfig.label}
          </span>
          <span className="tier-bar__current-score">
            Score: {score}/100
          </span>
        </div>
      </div>
    </div>
  );
};

export default SuvixScoreTierBar;
