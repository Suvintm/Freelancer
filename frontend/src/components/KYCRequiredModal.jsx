// KYCRequiredModal.jsx - Modal shown when client needs to complete KYC
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaTimes, FaArrowRight, FaCheckCircle, FaClock, FaLock } from 'react-icons/fa';
import './KYCRequiredModal.css';

const KYCRequiredModal = ({ isOpen, onClose, kycStatus }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleComplete = () => {
    onClose();
    navigate('/client-kyc');
  };

  const getStatusContent = () => {
    switch (kycStatus) {
      case 'pending':
      case 'under_review':
        return {
          icon: <FaClock />,
          iconClass: 'kyc-modal__icon--pending',
          title: 'Verification In Progress',
          message: 'Your KYC verification is being reviewed. You\'ll be notified once approved.',
          showButton: false,
        };
      case 'rejected':
        return {
          icon: <FaShieldAlt />,
          iconClass: 'kyc-modal__icon--rejected',
          title: 'Verification Required',
          message: 'Your previous KYC was rejected. Please update your details and resubmit.',
          showButton: true,
          buttonText: 'Update KYC',
        };
      default:
        return {
          icon: <FaShieldAlt />,
          iconClass: 'kyc-modal__icon--default',
          title: 'KYC Verification Required',
          message: 'Complete a quick verification to securely place orders and receive refunds.',
          showButton: true,
          buttonText: 'Complete KYC',
        };
    }
  };

  const content = getStatusContent();

  return (
    <AnimatePresence>
      <motion.div 
        className="kyc-modal__overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="kyc-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="kyc-modal__close" onClick={onClose}>
            <FaTimes />
          </button>

          <div className={`kyc-modal__icon ${content.iconClass}`}>
            {content.icon}
          </div>

          <h2 className="kyc-modal__title">{content.title}</h2>
          <p className="kyc-modal__message">{content.message}</p>

          <div className="kyc-modal__benefits">
            <div className="kyc-modal__benefit">
              <FaCheckCircle />
              <span>Secure refund processing</span>
            </div>
            <div className="kyc-modal__benefit">
              <FaCheckCircle />
              <span>Protected transactions</span>
            </div>
            <div className="kyc-modal__benefit">
              <FaLock />
              <span>Bank-grade encryption</span>
            </div>
          </div>

          <div className="kyc-modal__actions">
            <button className="kyc-modal__btn kyc-modal__btn--secondary" onClick={onClose}>
              Maybe Later
            </button>
            {content.showButton && (
              <button className="kyc-modal__btn kyc-modal__btn--primary" onClick={handleComplete}>
                {content.buttonText} <FaArrowRight />
              </button>
            )}
          </div>

          <p className="kyc-modal__note">
            Takes only 2 minutes • One-time verification
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default KYCRequiredModal;
