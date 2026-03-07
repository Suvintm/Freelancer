/**
 * PaymentSuccess Page
 * Compact, professional receipt-style confirmation
 */

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaArrowRight, FaShieldAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [countdown, setCountdown] = useState(5);
  
  // Get payment details from navigation state
  const paymentData = location.state || {};
  const {
    orderNumber = 'ORD-XXXX',
    amount = 0,
    title = 'Order',
    transactionId = '',
    targetPath = '/client-orders' // Default redirect path
  } = paymentData;

  useEffect(() => {
    // Delay content reveal
    const revealTimer = setTimeout(() => setShowContent(true), 100);
    
    // Auto-redirect timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate(targetPath);
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

  // Format currency
  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amt);
  };

  // Get current date
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="payment-success-page">
      <div className="ps-background">
        <div className="ps-bg-circle ps-bg-1"></div>
      </div>

      <div className="ps-container">
        {/* Success Icon */}
        <motion.div
          className="ps-icon-wrapper"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        >
          <div className="ps-icon-bg">
            <FaCheckCircle className="ps-check-icon" />
          </div>
          <motion.div 
            className="ps-ripple"
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
        </motion.div>

        {/* Main Content */}
        <motion.div
          className="ps-content"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 15 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="ps-title">Payment Successful</h1>
          <p className="ps-subtitle">Your request has been sent to the editor</p>

          <div className="ps-amount">
            {formatCurrency(amount)}
          </div>

          <div className="ps-receipt-label">Payment Receipt</div>
          
          <div className="ps-details-card">
            <div className="ps-detail-row">
              <span className="ps-label">Order</span>
              <span className="ps-value">{title}</span>
            </div>
            <div className="ps-divider"></div>
            <div className="ps-detail-row">
              <span className="ps-label">Order ID</span>
              <span className="ps-value ps-mono">{orderNumber}</span>
            </div>
            <div className="ps-divider"></div>
            <div className="ps-detail-row">
              <span className="ps-label">Date</span>
              <span className="ps-value">{currentDate}</span>
            </div>
            {transactionId && (
              <>
                <div className="ps-divider"></div>
                <div className="ps-detail-row">
                  <span className="ps-label">Transaction ID</span>
                  <span className="ps-value ps-mono ps-small">{transactionId}</span>
                </div>
              </>
            )}
          </div>

          <div className="ps-redirect-status">
            Returning to orders in {countdown}s...
          </div>

          <div className="ps-security">
            <FaShieldAlt />
            <span>Payment secured by Razorpay</span>
          </div>

          <div className="ps-actions">
            <button 
              onClick={() => navigate('/client-orders')}
              className="ps-btn-primary"
            >
              View My Orders
              <FaArrowRight />
            </button>
            <button 
              onClick={() => navigate('/explore')}
              className="ps-btn-secondary"
            >
              Continue Browsing
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
