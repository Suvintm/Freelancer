/**
 * PaymentSuccess Page
 * Professional, elegant success page after payment completion
 * Clean design with subtle animations - not flashy
 */

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaReceipt, FaArrowRight, FaShieldAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  
  // Get payment details from navigation state
  const paymentData = location.state || {};
  const {
    orderNumber = 'ORD-XXXX',
    amount = 0,
    title = 'Order',
    transactionId = '',
  } = paymentData;

  useEffect(() => {
    // Delay content reveal for smooth animation
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

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
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="payment-success-page">
      {/* Background gradient */}
      <div className="ps-background">
        <div className="ps-bg-circle ps-bg-1"></div>
        <div className="ps-bg-circle ps-bg-2"></div>
      </div>

      <div className="ps-container">
        {/* Success Icon with Animation */}
        <motion.div
          className="ps-icon-wrapper"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay: 0.1 
          }}
        >
          <div className="ps-icon-bg">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              <FaCheckCircle className="ps-check-icon" />
            </motion.div>
          </div>
          
          {/* Ripple effect */}
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
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 30 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h1 className="ps-title">Payment Successful</h1>
          <p className="ps-subtitle">
            Your payment has been processed securely
          </p>

          {/* Amount Display */}
          <motion.div 
            className="ps-amount"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {formatCurrency(amount)}
          </motion.div>

          {/* Transaction Details Card */}
          <motion.div 
            className="ps-details-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
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
              <span className="ps-label">Date & Time</span>
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
          </motion.div>

          {/* Security Badge */}
          <motion.div 
            className="ps-security"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <FaShieldAlt />
            <span>Payment secured by Razorpay</span>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="ps-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
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
          </motion.div>
        </motion.div>

        {/* Footer Note */}
        <motion.p 
          className="ps-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          The editor has been notified and will begin work shortly
        </motion.p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
