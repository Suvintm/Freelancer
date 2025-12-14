/**
 * PaymentRequestCard - Special message card for payment requests
 * Shows when editor accepts a request order and client needs to pay
 * Includes Razorpay integration for in-chat payments
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaCreditCard,
  FaLock,
  FaRupeeSign,
  FaCheckCircle,
  FaClock,
  FaShieldAlt,
  FaSpinner,
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";

const PaymentRequestCard = ({ message, order, onPaymentSuccess }) => {
  const { user, backendURL } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const isClient = user?.role === "client";
  const amount = order?.amount || 0;
  const deadline = order?.deadline ? new Date(order.deadline).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }) : "Not set";

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle payment initiation
  const handlePayNow = async () => {
    if (!isClient || loading) return;

    setLoading(true);
    try {
      // Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Failed to load payment gateway. Please try again.");
        setLoading(false);
        return;
      }

      // Create Razorpay order via backend
      const token = user?.token;
      const res = await axios.post(
        `${backendURL}/api/payments/create-order`,
        { orderId: order._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.data.success) {
        toast.error(res.data.message || "Failed to create payment order");
        setLoading(false);
        return;
      }

      const { order: razorpayOrder, keyId, prefill } = res.data;

      // Configure Razorpay options
      const options = {
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Suvix",
        description: `Payment for: ${order.title}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: prefill?.name || user?.name,
          email: prefill?.email || user?.email,
        },
        theme: {
          color: "#10B981", // Emerald green
        },
        handler: async function (response) {
          // Verify payment with backend
          try {
            const verifyRes = await axios.post(
              `${backendURL}/api/payments/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: order._id,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              setPaymentCompleted(true);
              toast.success("🎉 Payment successful! Chat is now enabled.");
              onPaymentSuccess?.();
            } else {
              toast.error("Payment verification failed. Please contact support.");
            }
          } catch (err) {
            toast.error("Payment verification error. Please contact support.");
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (err) {
      console.error("Payment error:", err);
      toast.error(err.response?.data?.message || "Payment failed. Please try again.");
      setLoading(false);
    }
  };

  // Already paid state
  if (order?.paymentStatus === "escrow" || paymentCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-500/30 rounded-2xl p-5 max-w-sm mx-auto my-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <FaCheckCircle className="text-emerald-400 text-xl" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Payment Confirmed</h3>
            <p className="text-emerald-400 text-xs">₹{amount.toLocaleString()} paid to escrow</p>
          </div>
        </div>
        <p className="text-zinc-400 text-xs">
          Funds are securely held and will be released to the editor upon project completion.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-orange-900/20 via-zinc-900 to-zinc-950 border border-orange-500/30 rounded-2xl p-5 max-w-sm mx-auto my-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
          <FaCreditCard className="text-orange-400 text-xl" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">Payment Required</h3>
          <p className="text-orange-400 text-xs">Editor accepted your request</p>
        </div>
      </div>

      {/* Amount */}
      <div className="bg-black/40 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 text-xs">Project Amount</span>
          <span className="text-white font-bold text-lg flex items-center gap-1">
            <FaRupeeSign className="text-sm" />
            {amount.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800">
          <span className="text-zinc-500 text-xs">Deadline</span>
          <span className="text-zinc-300 text-xs flex items-center gap-1">
            <FaClock className="text-[10px]" />
            {deadline}
          </span>
        </div>
      </div>

      {/* Security Note */}
      <div className="flex items-start gap-2 mb-4 text-[11px] text-zinc-500">
        <FaShieldAlt className="text-emerald-500 mt-0.5" />
        <span>
          Payment is held in escrow. Editor receives funds only after you accept the completed work.
        </span>
      </div>

      {/* Pay Button - Only for client */}
      {isClient ? (
        <button
          onClick={handlePayNow}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FaLock className="text-xs" />
              Pay ₹{amount.toLocaleString()} Securely
            </>
          )}
        </button>
      ) : (
        <div className="text-center text-zinc-500 text-xs py-2 bg-zinc-900/50 rounded-lg">
          Waiting for client to complete payment...
        </div>
      )}

      {/* Payment methods */}
      <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-zinc-600">
        <span>Powered by</span>
        <span className="font-semibold text-zinc-500">Razorpay</span>
      </div>
    </motion.div>
  );
};

export default PaymentRequestCard;
