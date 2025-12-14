/**
 * RazorpayCheckout Component
 * Premium payment checkout with loading states and animations
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  FaCreditCard, 
  FaLock, 
  FaCheck, 
  FaExclamationTriangle,
  FaSpinner,
  FaShieldAlt,
  FaReceipt
} from 'react-icons/fa';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import './RazorpayCheckout.css';

/**
 * Load Razorpay script dynamically
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const RazorpayCheckout = ({ 
  orderId, 
  amount, 
  currency = 'INR',
  orderDetails = {},
  onSuccess, 
  onFailure,
  onClose 
}) => {
  const { backendURL, user } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, loading, processing, success, error
  const [error, setError] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [feeBreakdown, setFeeBreakdown] = useState(null);

  // Format currency
  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amt);
  };

  // Fetch payment config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = user?.token || localStorage.getItem('token');
        const res = await axios.get(`${backendURL}/api/payment-gateway/config`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPaymentConfig(res.data.config);
      } catch (err) {
        console.error('Failed to fetch payment config:', err);
      }
    };
    fetchConfig();
  }, [backendURL, user]);

  // Initialize payment
  const initiatePayment = useCallback(async () => {
    try {
      setLoading(true);
      setStatus('loading');
      setError(null);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Create order on backend
      const token = user?.token || localStorage.getItem('token');
      const res = await axios.post(
        `${backendURL}/api/payment-gateway/create-order`,
        { orderId },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      if (!res.data.success) {
        throw new Error(res.data.message || 'Failed to create payment order');
      }

      const { order, keyId, prefill, feeBreakdown: fees } = res.data;
      setFeeBreakdown(fees);

      // Configure Razorpay options
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'SuviX',
        description: `Order: ${orderDetails.title || orderDetails.orderNumber || orderId}`,
        order_id: order.id,
        prefill: {
          name: prefill?.name || user?.name || '',
          email: prefill?.email || user?.email || '',
        },
        theme: {
          color: '#10B981',
          backdrop_color: 'rgba(0, 0, 0, 0.7)',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setStatus('idle');
            onClose?.();
          },
        },
        handler: async (response) => {
          setProcessing(true);
          setStatus('processing');
          await verifyPayment(response);
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        setStatus('error');
        setError(response.error?.description || 'Payment failed');
        onFailure?.(response.error);
      });
      razorpay.open();
      setLoading(false);

    } catch (err) {
      console.error('Payment initiation error:', err);
      setStatus('error');
      setError(err.message || 'Failed to initiate payment');
      setLoading(false);
      onFailure?.(err);
    }
  }, [orderId, backendURL, user, orderDetails, onClose, onFailure]);

  // Verify payment on backend
  const verifyPayment = async (paymentData) => {
    try {
      const token = user?.token || localStorage.getItem('token');
      const res = await axios.post(
        `${backendURL}/api/payment-gateway/verify`,
        {
          razorpay_order_id: paymentData.razorpay_order_id,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_signature: paymentData.razorpay_signature,
          orderId,
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      if (res.data.success) {
        setStatus('success');
        setTimeout(() => {
          onSuccess?.(res.data);
        }, 1500);
      } else {
        throw new Error(res.data.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setStatus('error');
      setError(err.message || 'Payment verification failed');
      onFailure?.(err);
    } finally {
      setProcessing(false);
    }
  };

  // Check if payments are supported
  if (paymentConfig && !paymentConfig.supported) {
    return (
      <div className="rzp-checkout-container">
        <div className="rzp-unsupported">
          <div className="rzp-unsupported-icon">🌍</div>
          <h3>International Payments Coming Soon!</h3>
          <p>{paymentConfig.message || 'Payments are not available in your region yet.'}</p>
          <button onClick={onClose} className="rzp-btn-secondary">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rzp-checkout-container">
      <div className="rzp-checkout-modal">
        {/* Header */}
        <div className="rzp-header">
          <div className="rzp-logo">
            <span className="rzp-logo-text">SuviX</span>
            <span className="rzp-secure-badge">
              <FaShieldAlt /> Secure
            </span>
          </div>
          <button onClick={onClose} className="rzp-close-btn" disabled={processing}>
            ×
          </button>
        </div>

        {/* Order Summary */}
        <div className="rzp-summary">
          <h3 className="rzp-summary-title">Payment Summary</h3>
          {orderDetails.title && (
            <p className="rzp-order-title">{orderDetails.title}</p>
          )}
          
          <div className="rzp-breakdown">
            <div className="rzp-breakdown-row">
              <span>Service Amount</span>
              <span>{formatCurrency(feeBreakdown?.totalAmount || amount)}</span>
            </div>
            {feeBreakdown && (
              <>
                <div className="rzp-breakdown-row rzp-fee">
                  <span>Platform Fee ({feeBreakdown.platformFeePercent}%)</span>
                  <span>Included</span>
                </div>
                <div className="rzp-breakdown-row rzp-editor">
                  <span>Editor receives</span>
                  <span>{formatCurrency(feeBreakdown.editorAmount)}</span>
                </div>
              </>
            )}
            <div className="rzp-breakdown-total">
              <span>Total</span>
              <span className="rzp-total-amount">{formatCurrency(amount)}</span>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="rzp-status rzp-success">
            <div className="rzp-status-icon">
              <FaCheck />
            </div>
            <h3>Payment Successful!</h3>
            <p>Your payment has been processed securely.</p>
          </div>
        )}

        {status === 'error' && error && (
          <div className="rzp-status rzp-error">
            <div className="rzp-status-icon">
              <FaExclamationTriangle />
            </div>
            <h3>Payment Failed</h3>
            <p>{error}</p>
            <button onClick={() => setStatus('idle')} className="rzp-retry-btn">
              Try Again
            </button>
          </div>
        )}

        {status === 'processing' && (
          <div className="rzp-status rzp-processing">
            <div className="rzp-spinner">
              <FaSpinner className="rzp-spin" />
            </div>
            <h3>Verifying Payment...</h3>
            <p>Please wait while we confirm your payment.</p>
          </div>
        )}

        {/* Pay Button */}
        {(status === 'idle' || status === 'loading') && (
          <>
            <button
              onClick={initiatePayment}
              disabled={loading || !paymentConfig}
              className="rzp-pay-btn"
            >
              {loading ? (
                <>
                  <FaSpinner className="rzp-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <FaCreditCard />
                  <span>Pay {formatCurrency(amount)}</span>
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="rzp-security">
              <FaLock />
              <span>Secured by Razorpay. Your payment details are encrypted.</span>
            </div>

            {/* Payment Methods */}
            <div className="rzp-methods">
              <span>Accepted:</span>
              <div className="rzp-methods-icons">
                <span>💳 Cards</span>
                <span>📱 UPI</span>
                <span>🏦 NetBanking</span>
                <span>👛 Wallets</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RazorpayCheckout;
