import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheck, FaArrowRight, FaRegCalendarAlt, FaFingerprint, FaClipboardList } from "react-icons/fa";
import "./PaymentSuccess.css";

const RequestPaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [countdown, setCountdown] = useState(10);

  const {
    orderNumber = "SVX-XXXXXX",
    title = "Project Request",
    amount = 0,
    deadline,
    editorName = "antigravity",
    editorPicture = "https://api.dicebear.com/7.x/avataaars/svg?seed=antigravity",
    transactionId = "txn_xxxxxxxxxxxx",
  } = location.state || {};

  // Redirect if no data
  useEffect(() => {
    if (!orderNumber) {
      navigate("/");
      return;
    }
    
    setShowContent(true);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // navigate("/client-orders"); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orderNumber, navigate]);

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amt);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (!orderNumber) return null;

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
          <h1 className="ps-title">Payment Successful!</h1>
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
              <img src={editorPicture} alt={editorName} className="ps-avatar" />
              <span className="ps-editor-name">{editorName}</span>
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
                <span className="ps-info-value">{formatDate(deadline)}</span>
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
            <button className="ps-btn-view-order" onClick={() => navigate("/client-orders")}>
              View Order <FaArrowRight />
            </button>
            <p className="ps-step-text">1. Editor receives your request with payment confirmation.</p>
            <p className="ps-step-text">2. They will Accept or Reject within 48 hours.</p>
            <p className="ps-step-text">3. If rejected, you'll receive a full refund.</p>
            
            <button className="ps-btn-browse" onClick={() => navigate("/")}>
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

export default RequestPaymentSuccess;
