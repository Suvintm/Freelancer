// SuvixScoreCard.jsx - Compact score card for profile page with "View Details" button
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTrophy, FaChevronRight, FaCrown, FaGem, FaMedal, FaAward, FaStar } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';
import { useAppContext } from '../context/AppContext';
import './SuvixScoreCard.css';

// Tier Configuration
const TIER_CONFIG = {
  elite: { label: 'Elite Editor', color: '#FFD700', icon: FaCrown, gradient: 'linear-gradient(135deg, #FFD700, #FFA500)' },
  expert: { label: 'Expert', color: '#9B59B6', icon: FaGem, gradient: 'linear-gradient(135deg, #9B59B6, #8E44AD)' },
  professional: { label: 'Professional', color: '#3498DB', icon: FaMedal, gradient: 'linear-gradient(135deg, #3498DB, #2980B9)' },
  established: { label: 'Established', color: '#27AE60', icon: FaAward, gradient: 'linear-gradient(135deg, #27AE60, #1E8449)' },
  rising: { label: 'Rising Star', color: '#1ABC9C', icon: FaStar, gradient: 'linear-gradient(135deg, #1ABC9C, #16A085)' },
  newcomer: { label: 'Newcomer', color: '#95A5A6', icon: FaTrophy, gradient: 'linear-gradient(135deg, #95A5A6, #7F8C8D)' },
};

const SuvixScoreCard = () => {
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scoreData, setScoreData] = useState(null);

  useEffect(() => {
    if (user?.token) {
      fetchScore();
    }
  }, [user?.token]);

  const fetchScore = async () => {
    try {
      const res = await axios.get(`${backendURL}/api/suvix-score/my/breakdown`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.data?.success) {
        setScoreData(res.data.score);
      }
    } catch (err) {
      console.error('Failed to fetch Suvix Score:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="score-card score-card--loading">
        <div className="score-card__loader" />
        <span>Loading score...</span>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <motion.div 
        className="score-card score-card--empty"
        whileHover={{ scale: 1.01 }}
        onClick={() => navigate('/suvix-score')}
      >
        <div className="score-card__empty-content">
          <HiSparkles className="score-card__empty-icon" />
          <span>View your Suvix Score</span>
          <FaChevronRight />
        </div>
      </motion.div>
    );
  }

  const tierConfig = TIER_CONFIG[scoreData.tier] || TIER_CONFIG.newcomer;
  const TierIcon = tierConfig.icon;
  const progressPercent = scoreData.total;

  return (
    <motion.div 
      className="score-card"
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="score-card__content">
        {/* Left: Score Circle */}
        <div className="score-card__circle-section">
          <div className="score-card__circle" style={{ '--tier-color': tierConfig.color }}>
            <svg className="score-card__svg" viewBox="0 0 100 100">
              <circle 
                className="score-card__bg-ring" 
                cx="50" cy="50" r="42" 
                fill="none" 
                strokeWidth="6"
              />
              <motion.circle 
                className="score-card__progress-ring" 
                cx="50" cy="50" r="42" 
                fill="none" 
                strokeWidth="6"
                strokeLinecap="round"
                style={{ stroke: tierConfig.color }}
                initial={{ strokeDashoffset: 264 }}
                animate={{ strokeDashoffset: 264 - (progressPercent / 100) * 264 }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="score-card__circle-content">
              <span className="score-card__score" style={{ color: tierConfig.color }}>
                {scoreData.total}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Info & Badge */}
        <div className="score-card__info">
          <div className="score-card__header">
            <HiSparkles className="score-card__sparkle" />
            <span className="score-card__title">Suvix Score</span>
          </div>
          
          <div className="score-card__tier-badge" style={{ background: tierConfig.gradient }}>
            <TierIcon />
            <span>{tierConfig.label}</span>
          </div>

          <div className="score-card__stats">
            <span>{scoreData.completedOrders} orders • </span>
            {!scoreData.isEligible && <span className="score-card__private">Score is private</span>}
            {scoreData.isEligible && <span className="score-card__public">Public profile</span>}
          </div>
        </div>
      </div>

      {/* View Details Button */}
      <button 
        className="score-card__button"
        onClick={() => navigate('/suvix-score')}
      >
        View Full Details
        <FaChevronRight />
      </button>
    </motion.div>
  );
};

export default SuvixScoreCard;
