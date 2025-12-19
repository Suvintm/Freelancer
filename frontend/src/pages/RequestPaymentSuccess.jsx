/**
 * RequestPaymentSuccess - Professional success page after request payment
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaClock, FaRupeeSign, FaUser, FaCalendarAlt, FaReceipt } from "react-icons/fa";
import { HiSparkles, HiOutlineArrowRight } from "react-icons/hi";

const RequestPaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  const {
    orderNumber,
    title,
    amount,
    deadline,
    editorName,
    editorPicture,
    transactionId,
  } = location.state || {};

  // Redirect if no data
  useEffect(() => {
    if (!orderNumber) {
      navigate("/");
    }
  }, [orderNumber, navigate]);

  // Show content with delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Format date
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
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-lg w-full"
      >
        {/* Success Card */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-3xl border border-emerald-500/30 overflow-hidden shadow-2xl shadow-emerald-500/10">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-green-500 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)]" />
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="relative"
            >
              <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                <FaCheckCircle className="text-emerald-500 text-4xl" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
              transition={{ delay: 0.5 }}
            >
              <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
              <p className="text-emerald-100">Your request has been sent to the editor</p>
            </motion.div>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
            transition={{ delay: 0.7 }}
            className="p-6 space-y-6"
          >
            {/* Amount */}
            <div className="text-center py-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
              <p className="text-zinc-400 text-sm mb-1">Amount Paid</p>
              <div className="flex items-center justify-center gap-1">
                <FaRupeeSign className="text-emerald-400 text-2xl" />
                <span className="text-4xl font-bold text-white">{amount?.toLocaleString()}</span>
              </div>
              <p className="text-emerald-400 text-xs mt-1">Held in escrow until project completion</p>
            </div>

            {/* Editor Info */}
            <div className="flex items-center gap-4 p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 p-0.5">
                {editorPicture ? (
                  <img src={editorPicture} alt={editorName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center">
                    <FaUser className="text-zinc-400 text-xl" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-zinc-400 text-xs">Sent to</p>
                <p className="text-white font-semibold text-lg">{editorName || "Editor"}</p>
              </div>
              <div className="bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1">
                <FaClock className="text-xs" />
                Pending
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <FaReceipt className="text-blue-400" />
                  </div>
                  <span className="text-zinc-400">Order Number</span>
                </div>
                <span className="text-white font-mono">{orderNumber}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <FaCalendarAlt className="text-purple-400" />
                  </div>
                  <span className="text-zinc-400">Deadline</span>
                </div>
                <span className="text-white">{formatDate(deadline)}</span>
              </div>

              {transactionId && (
                <div className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <HiSparkles className="text-green-400" />
                    </div>
                    <span className="text-zinc-400">Transaction ID</span>
                  </div>
                  <span className="text-white font-mono text-sm">{transactionId.slice(0, 12)}...</span>
                </div>
              )}
            </div>

            {/* What happens next */}
            <div className="p-4 bg-gradient-to-r from-emerald-900/20 to-green-900/20 rounded-xl border border-emerald-500/20">
              <h3 className="text-emerald-400 font-semibold text-sm mb-3 flex items-center gap-2">
                <FaClock />
                What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">1.</span>
                  <span>Editor receives your request with payment confirmation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">2.</span>
                  <span>They will <strong>Accept</strong> or <strong>Reject</strong> within 48 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">3.</span>
                  <span>If accepted, work begins immediately</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-500 mt-0.5">•</span>
                  <span className="text-zinc-400">If rejected, you'll receive a <strong className="text-emerald-400">full refund</strong></span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/my-orders")}
                className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-colors"
              >
                View Orders
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Continue <HiOutlineArrowRight />
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default RequestPaymentSuccess;
