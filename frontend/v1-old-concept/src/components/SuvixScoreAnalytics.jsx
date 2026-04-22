// SuvixScoreAnalytics.jsx - Full analytics dashboard for editor's Suvix Score
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import SuvixScoreBadge from './SuvixScoreBadge';
import SuvixScoreTierBar from './SuvixScoreTierBar';
import './SuvixScoreAnalytics.css';
import { useAppContext } from '../context/AppContext';

const SuvixScoreAnalytics = () => {
  const { backendURL, user } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [scoreData, setScoreData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.token) {
      fetchScoreBreakdown();
    }
  }, [user?.token]);

  const fetchScoreBreakdown = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendURL}/api/suvix-score/my/breakdown`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      console.log('Suvix Score API response:', res.data);
      
      // Validate response structure
      if (res.data && res.data.success && res.data.score) {
        setScoreData(res.data);
        setError(null);
      } else {
        console.error('Invalid API response structure:', res.data);
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Failed to fetch Suvix Score:', err);
      setError(err.response?.data?.message || 'Failed to load score');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="suvix-analytics suvix-analytics--loading">
        <div className="suvix-analytics__loader">
          <div className="spinner" />
          <span>Calculating your Suvix Score...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="suvix-analytics suvix-analytics--error">
        <span>❌ {error}</span>
        <button onClick={fetchScoreBreakdown}>Retry</button>
      </div>
    );
  }

  if (!scoreData) return null;

  const { score, components, tips } = scoreData;

  // Safety check - if API returned data but score is missing
  if (!score) {
    return (
      <div className="suvix-analytics suvix-analytics--error">
        <span>❌ Score data unavailable. Please try again.</span>
        <button onClick={fetchScoreBreakdown}>Retry</button>
      </div>
    );
  }


  return (
    <div className="suvix-analytics">
      <div className="suvix-analytics__header">
        <h2 className="suvix-analytics__title">
          <span className="suvix-analytics__logo">📊</span>
          Suvix Score
        </h2>
        <span className="suvix-analytics__subtitle">
          Your performance at a glance
        </span>
      </div>

      <div className="suvix-analytics__main">
        {/* Left: Tier Progress Bar */}
        <div className="suvix-analytics__tier-section">
          <SuvixScoreTierBar
            score={score.total}
            currentTier={score.tier}
            isEligible={score.isEligible}
            isSelfView={true}
            height={350}
          />
        </div>

        {/* Right: Score breakdown and badge */}
        <div className="suvix-analytics__details">
          {/* Large badge */}
          <div className="suvix-analytics__badge-section">
            <SuvixScoreBadge
              score={score.total}
              tier={score.tier}
              isEligible={score.isEligible}
              isSelfView={true}
              size="large"
              animated
            />
            <div className="suvix-analytics__completed">
              <span className="suvix-analytics__completed-count">
                {score.completedOrders}
              </span>
              <span className="suvix-analytics__completed-label">
                Orders Completed
              </span>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="suvix-analytics__breakdown">
            <h3>Score Breakdown</h3>
            <div className="suvix-analytics__components">
              {Object.entries(components).map(([key, comp]) => (
                <div key={key} className="suvix-analytics__component">
                  <div className="component__header">
                    <span className="component__icon">{comp.icon}</span>
                    <span className="component__label">{comp.label}</span>
                    <span className="component__score">
                      {comp.score}/{comp.maxScore}
                    </span>
                  </div>
                  <div className="component__bar-track">
                    <div 
                      className="component__bar-fill"
                      style={{ 
                        width: `${(comp.score / comp.maxScore) * 100}%`,
                        background: getComponentColor(comp.score, comp.maxScore),
                      }}
                    />
                  </div>
                  <div className="component__description">
                    {comp.description}
                    {comp.avgRating && (
                      <span className="component__extra">
                        (Avg: {comp.avgRating}⭐)
                      </span>
                    )}
                    {comp.rate !== undefined && (
                      <span className="component__extra">
                        ({comp.rate}%)
                      </span>
                    )}
                    {comp.totalOrders !== undefined && (
                      <span className="component__extra">
                        ({comp.totalOrders} orders)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tips section */}
      {tips && tips.length > 0 && (
        <div className="suvix-analytics__tips">
          <h3>💡 Tips to Improve</h3>
          <div className="suvix-analytics__tips-list">
            {tips.map((tip, index) => (
              <div key={index} className="suvix-analytics__tip">
                <span className="tip__icon">{tip.icon}</span>
                <div className="tip__content">
                  <span className="tip__title">{tip.title}</span>
                  <span className="tip__message">{tip.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Eligibility notice */}
      {!score.isEligible && (
        <div className="suvix-analytics__eligibility">
          <span className="eligibility__icon">ℹ️</span>
          <span className="eligibility__text">
            Complete {2 - score.completedOrders} more order(s) to unlock your public Suvix Score!
          </span>
        </div>
      )}
    </div>
  );
};

// Helper function to get color based on score percentage
const getComponentColor = (score, maxScore) => {
  const percent = (score / maxScore) * 100;
  if (percent >= 80) return 'linear-gradient(90deg, #27AE60, #2ECC71)';
  if (percent >= 60) return 'linear-gradient(90deg, #3498DB, #5DADE2)';
  if (percent >= 40) return 'linear-gradient(90deg, #F39C12, #F1C40F)';
  return 'linear-gradient(90deg, #E74C3C, #EC7063)';
};

export default SuvixScoreAnalytics;
