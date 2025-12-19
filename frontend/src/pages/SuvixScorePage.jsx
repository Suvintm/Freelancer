// SuvixScorePage.jsx - Dedicated Suvix Score Analytics Page with Premium UI
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FaTrophy, FaStar, FaClock, FaCheckCircle, FaBolt, FaRedo, 
  FaMedal, FaChevronUp, FaArrowLeft, FaExclamationTriangle,
  FaFire, FaGem, FaAward, FaCrown
} from 'react-icons/fa';
import { HiSparkles, HiTrendingUp, HiLightningBolt } from 'react-icons/hi';
import { useAppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import EditorNavbar from '../components/EditorNavbar';
import './SuvixScorePage.css';

// Tier Configuration
const TIERS = [
  { name: 'elite', min: 90, max: 100, label: 'Elite Editor', color: '#FFD700', icon: FaCrown, gradient: 'linear-gradient(135deg, #FFD700, #FFA500)' },
  { name: 'expert', min: 80, max: 89, label: 'Expert', color: '#9B59B6', icon: FaGem, gradient: 'linear-gradient(135deg, #9B59B6, #8E44AD)' },
  { name: 'professional', min: 70, max: 79, label: 'Professional', color: '#3498DB', icon: FaMedal, gradient: 'linear-gradient(135deg, #3498DB, #2980B9)' },
  { name: 'established', min: 60, max: 69, label: 'Established', color: '#27AE60', icon: FaAward, gradient: 'linear-gradient(135deg, #27AE60, #1E8449)' },
  { name: 'rising', min: 50, max: 59, label: 'Rising Star', color: '#1ABC9C', icon: FaStar, gradient: 'linear-gradient(135deg, #1ABC9C, #16A085)' },
  { name: 'newcomer', min: 0, max: 49, label: 'Newcomer', color: '#95A5A6', icon: FaTrophy, gradient: 'linear-gradient(135deg, #95A5A6, #7F8C8D)' },
];

const SuvixScorePage = () => {
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scoreData, setScoreData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.token) {
      fetchScoreData();
    }
  }, [user?.token]);

  const fetchScoreData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendURL}/api/suvix-score/my/breakdown`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.data?.success) {
        setScoreData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch Suvix Score:', err);
      setError(err.response?.data?.message || 'Failed to load score');
    } finally {
      setLoading(false);
    }
  };

  const getTierConfig = (tierName) => {
    return TIERS.find(t => t.name === tierName) || TIERS[5];
  };

  const getNextTier = (currentTier) => {
    const idx = TIERS.findIndex(t => t.name === currentTier);
    return idx > 0 ? TIERS[idx - 1] : null;
  };

  if (loading) {
    return (
      <div className="suvix-page">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="suvix-page__main">
          <div className="suvix-page__loading">
            <motion.div 
              className="suvix-page__loading-spinner"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <FaTrophy />
            </motion.div>
            <span>Calculating your Suvix Score...</span>
          </div>
        </main>
      </div>
    );
  }

  if (error || !scoreData) {
    return (
      <div className="suvix-page">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="suvix-page__main">
          <div className="suvix-page__error">
            <FaExclamationTriangle />
            <span>{error || 'Unable to load score data'}</span>
            <button onClick={fetchScoreData}>Try Again</button>
          </div>
        </main>
      </div>
    );
  }

  const { score, components, tips } = scoreData;
  const tierConfig = getTierConfig(score.tier);
  const nextTier = getNextTier(score.tier);
  const pointsToNext = nextTier ? nextTier.min - score.total : 0;
  const TierIcon = tierConfig.icon;

  return (
    <div className="suvix-page">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />
      
      <main className="suvix-page__main">
        <div className="suvix-page__container">
          
          {/* Header Section */}
          <motion.div 
            className="suvix-page__header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button className="suvix-page__back" onClick={() => navigate('/editor-profile')}>
              <FaArrowLeft /> Back to Profile
            </button>
            <div className="suvix-page__header-content">
              <div className="suvix-page__title-section">
                <h1 className="suvix-page__title">
                  <HiSparkles className="suvix-page__title-icon" />
                  Suvix Score
                </h1>
                <p className="suvix-page__subtitle">Your performance analytics & reputation score</p>
              </div>
            </div>
          </motion.div>

          {/* Hero Score Section */}
          <motion.div 
            className="suvix-page__hero"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Left: Tier Progress */}
            <div className="suvix-page__tier-progress">
              <div className="tier-progress">
                <div className="tier-progress__track">
                  {TIERS.slice().reverse().map((tier, index) => {
                    const isActive = tier.name === score.tier;
                    const isPassed = TIERS.findIndex(t => t.name === tier.name) > TIERS.findIndex(t => t.name === score.tier);
                    const TIcon = tier.icon;
                    
                    return (
                      <div 
                        key={tier.name}
                        className={`tier-progress__tier ${isActive ? 'tier-progress__tier--active' : ''} ${isPassed ? 'tier-progress__tier--passed' : ''}`}
                      >
                        <div 
                          className="tier-progress__marker"
                          style={{ 
                            background: isActive || isPassed ? tier.gradient : 'rgba(255,255,255,0.1)',
                            boxShadow: isActive ? `0 0 20px ${tier.color}50` : 'none'
                          }}
                        >
                          <TIcon />
                        </div>
                        <div className="tier-progress__info">
                          <span className="tier-progress__label" style={{ color: isActive ? tier.color : '' }}>
                            {tier.label}
                          </span>
                          <span className="tier-progress__range">{tier.min}+</span>
                        </div>
                        {isActive && (
                          <motion.div 
                            className="tier-progress__current"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{ background: tier.gradient }}
                          >
                            YOU
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Score Display */}
            <div className="suvix-page__score-display">
              <motion.div 
                className="score-circle"
                style={{ 
                  '--tier-color': tierConfig.color,
                  '--tier-gradient': tierConfig.gradient 
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <svg className="score-circle__svg" viewBox="0 0 200 200">
                  <circle 
                    className="score-circle__bg" 
                    cx="100" cy="100" r="85" 
                    fill="none" 
                    strokeWidth="12"
                  />
                  <motion.circle 
                    className="score-circle__progress" 
                    cx="100" cy="100" r="85" 
                    fill="none" 
                    strokeWidth="12"
                    strokeLinecap="round"
                    style={{ 
                      stroke: tierConfig.color,
                      filter: `drop-shadow(0 0 10px ${tierConfig.color})`
                    }}
                    initial={{ strokeDashoffset: 534 }}
                    animate={{ strokeDashoffset: 534 - (score.total / 100) * 534 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="score-circle__content">
                  <motion.span 
                    className="score-circle__number"
                    style={{ color: tierConfig.color }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {score.total}
                  </motion.span>
                  <span className="score-circle__label">SCORE</span>
                </div>
              </motion.div>

              <div className="suvix-page__tier-info">
                <div className="tier-badge" style={{ background: tierConfig.gradient }}>
                  <TierIcon />
                  <span>{tierConfig.label}</span>
                </div>
                {nextTier && pointsToNext > 0 && (
                  <div className="tier-next">
                    <HiTrendingUp />
                    <span><strong>{pointsToNext}</strong> points to {nextTier.label}</span>
                  </div>
                )}
                <div className="tier-orders">
                  <FaCheckCircle />
                  <span><strong>{score.completedOrders}</strong> orders completed</span>
                </div>
              </div>

              {!score.isEligible && (
                <div className="suvix-page__eligibility-notice">
                  <FaExclamationTriangle />
                  <span>Complete {2 - score.completedOrders} more order(s) to make your score public</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Score Breakdown */}
          <motion.div 
            className="suvix-page__breakdown"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="suvix-page__section-title">
              <HiLightningBolt /> Score Breakdown
            </h2>
            
            <div className="breakdown-grid">
              {Object.entries(components).map(([key, comp], index) => {
                const percentage = (comp.score / comp.maxScore) * 100;
                const isLow = percentage < 50;
                
                return (
                  <motion.div 
                    key={key}
                    className={`breakdown-card ${isLow ? 'breakdown-card--low' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <div className="breakdown-card__header">
                      <span className="breakdown-card__icon">{comp.icon}</span>
                      <div className="breakdown-card__title">
                        <h3>{comp.label}</h3>
                        <p>{comp.description}</p>
                      </div>
                      <div className="breakdown-card__score">
                        <span className="breakdown-card__points">{comp.score}</span>
                        <span className="breakdown-card__max">/{comp.maxScore}</span>
                      </div>
                    </div>
                    
                    <div className="breakdown-card__bar">
                      <motion.div 
                        className="breakdown-card__fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.2 * index }}
                        style={{ 
                          background: percentage >= 70 
                            ? 'linear-gradient(90deg, #27AE60, #2ECC71)'
                            : percentage >= 40 
                            ? 'linear-gradient(90deg, #F39C12, #F1C40F)'
                            : 'linear-gradient(90deg, #E74C3C, #EC7063)'
                        }}
                      />
                    </div>

                    {comp.avgRating && (
                      <div className="breakdown-card__extra">
                        <FaStar /> Average: {comp.avgRating.toFixed(1)}
                      </div>
                    )}
                    {comp.rate !== undefined && (
                      <div className="breakdown-card__extra">
                        <FaCheckCircle /> Rate: {comp.rate}%
                      </div>
                    )}
                    {comp.totalOrders !== undefined && (
                      <div className="breakdown-card__extra">
                        <FaTrophy /> Total: {comp.totalOrders} orders
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Tips Section */}
          {tips && tips.length > 0 && (
            <motion.div 
              className="suvix-page__tips"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="suvix-page__section-title">
                <FaFire /> Tips to Improve
              </h2>
              
              <div className="tips-grid">
                {tips.map((tip, index) => (
                  <motion.div 
                    key={index}
                    className="tip-card"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <span className="tip-card__icon">{tip.icon}</span>
                    <div className="tip-card__content">
                      <h4>{tip.title}</h4>
                      <p>{tip.message}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
};

export default SuvixScorePage;
