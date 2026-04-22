import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheck, FaArrowRight, FaShieldAlt, FaRegCalendarAlt, FaFingerprint, FaClipboardList } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [countdown, setCountdown] = useState(10); // Slightly longer for premium read
  
  // Get payment details from navigation state
  const paymentData = location.state || {};
  const {
    orderNumber = 'SVX-994210',
    amount = 450,
    title = 'Project Request',
    transactionId = 'txn_51Mv9L2eR8zV1',
    editor = {
      name: 'antigravity',
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=antigravity'
    },
    targetPath = '/client-orders'
  } = paymentData;

  useEffect(() => {
    const revealTimer = setTimeout(() => setShowContent(true), 100);
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // navigate(targetPath); // Comment out for user to see the UI first
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(revealTimer);
      clearInterval(interval);
    };
  }, [navigate, targetPath]);

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amt);
  };

  return (
    <div className="payment-success-page">
      <div className="ps-container">
        {/* Header Section */}
        <motion.div
          className="ps-header"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className="ps-check-circle">
            <FaCheck className="ps-check-icon" />
          </div>
          <h1 className="ps-title">Payment Successful</h1>
          <p className="ps-subtitle">Your request has been sent to the editor</p>
          
          <div className="ps-main-amount">
            {formatCurrency(amount)}
          </div>
          <div className="ps-escrow-label">
            HELD IN ESCROW UNTIL PROJECT COMPLETION
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div 
          className="ps-receipt-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="ps-editor-row">
            <div className="ps-editor-info">
              <img src={editor.profilePicture} alt={editor.name} className="ps-avatar" />
              <span className="ps-editor-name">{editor.name}</span>
            </div>
            <div className="ps-status-badge">PENDING</div>
          </div>

          <div className="ps-card-divider"></div>

          <div className="ps-info-rows">
            <div className="ps-info-item">
              <FaClipboardList className="ps-info-icon" />
              <div className="ps-info-content">
                <span className="ps-info-label">ORDER NUMBER</span>
                <span className="ps-info-value">#{orderNumber}</span>
              </div>
            </div>

            <div className="ps-info-item">
              <FaRegCalendarAlt className="ps-info-icon" />
              <div className="ps-info-content">
                <span className="ps-info-label">DEADLINE</span>
                <span className="ps-info-value">8 Mar 2026</span>
              </div>
            </div>

            <div className="ps-info-item">
              <FaFingerprint className="ps-info-icon" />
              <div className="ps-info-content">
                <span className="ps-info-label">TRANSACTION ID</span>
                <span className="ps-info-value ps-truncate">{transactionId}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Next Steps Area */}
        <motion.div 
          className="ps-next-steps"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="ps-section-title">NEXT STEPS</h3>
          <div className="ps-actions-container">
            <button className="ps-btn-view-order" onClick={() => navigate(targetPath)}>
              View Order <FaArrowRight />
            </button>
            <p className="ps-step-text">1. The editor will review your request within 24 hours.</p>
            <p className="ps-step-text">2. Work begins as soon as the request is accepted.</p>
            <p className="ps-step-text">3. Full refund to your source if the editor rejects.</p>
            
            <button className="ps-btn-browse" onClick={() => navigate('/explore')}>
              Continue Browsing
            </button>
          </div>
        </motion.div>

        <div className="ps-redirect-hint">
          Redirecting in {countdown}s...
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
