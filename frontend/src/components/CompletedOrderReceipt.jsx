// CompletedOrderReceipt.jsx - Premium glass-style receipt for completed orders
import React from "react";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaReceipt,
  FaCalendarAlt,
  FaCalendarCheck,
  FaClock,
  FaRupeeSign,
  FaUser,
  FaUserTie,
  FaFileAlt,
  FaStar,
  FaTrophy,
} from "react-icons/fa";

const CompletedOrderReceipt = ({ order }) => {
  if (!order || order.status !== "completed") return null;

  // Calculate days info
  const createdDate = new Date(order.createdAt);
  const completedDate = new Date(order.completedAt);
  const deadlineDate = new Date(order.deadline);
  
  const totalDays = Math.ceil((completedDate - createdDate) / (1000 * 60 * 60 * 24));
  const daysBeforeDeadline = Math.ceil((deadlineDate - completedDate) / (1000 * 60 * 60 * 24));
  const wasOnTime = daysBeforeDeadline >= 0;

  // Calculate platform fee percentage
  const orderAmount = order.amount || 0;
  const platformFee = order.platformFee || 0;
  const feePercent = orderAmount > 0 ? Math.round((platformFee / orderAmount) * 100) : 10;

  // Format dates
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="w-full max-w-md mx-auto my-6"
    >
      {/* Premium Receipt Card */}
      <div className="relative overflow-hidden rounded-3xl">
        {/* Gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-purple-500 to-pink-500 p-[2px] rounded-3xl" />
        
        {/* Glass card */}
        <div className="relative bg-black/90 backdrop-blur-xl rounded-3xl overflow-hidden m-[2px]">
          {/* Header with success animation */}
          <div className="relative bg-gradient-to-r from-emerald-900/50 to-green-900/50 px-6 py-8 text-center">
            {/* Animated circles background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-4 left-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl animate-pulse" />
              <div className="absolute bottom-4 right-4 w-32 h-32 bg-green-500/10 rounded-full blur-2xl animate-pulse delay-300" />
            </div>
            
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative z-10"
            >
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <FaCheckCircle className="text-white text-4xl" />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative z-10 mt-4"
            >
              <h2 className="text-2xl font-bold text-white">Order Completed!</h2>
              <p className="text-emerald-300 text-sm mt-1">Transaction Successful</p>
            </motion.div>
          </div>

          {/* Receipt content */}
          <div className="px-6 py-6 space-y-5">
            {/* Order Number */}
            <div className="text-center pb-4 border-b border-white/10">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Order Number</p>
              <p className="text-white font-mono text-lg font-bold mt-1">{order.orderNumber}</p>
            </div>

            {/* Project Title */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <FaFileAlt className="text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 text-xs">Project</p>
                  <p className="text-white font-semibold truncate">{order.title}</p>
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FaUser className="text-blue-400 text-xs" />
                  <span className="text-gray-400 text-xs">Client</span>
                </div>
                <p className="text-white text-sm font-medium truncate">{order.client?.name}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FaUserTie className="text-orange-400 text-xs" />
                  <span className="text-gray-400 text-xs">Editor</span>
                </div>
                <p className="text-white text-sm font-medium truncate">{order.editor?.name}</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="text-gray-400 text-xs uppercase tracking-wider flex items-center gap-2">
                <FaClock className="text-gray-500" /> Timeline
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FaCalendarAlt className="text-cyan-400 text-xs" />
                    <span className="text-gray-400 text-xs">Created</span>
                  </div>
                  <p className="text-white text-sm">{formatDate(order.createdAt)}</p>
                  <p className="text-gray-500 text-xs">{formatTime(order.createdAt)}</p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FaCalendarCheck className="text-emerald-400 text-xs" />
                    <span className="text-gray-400 text-xs">Completed</span>
                  </div>
                  <p className="text-white text-sm">{formatDate(order.completedAt)}</p>
                  <p className="text-gray-500 text-xs">{formatTime(order.completedAt)}</p>
                </div>
              </div>

              {/* Delivery Status */}
              <div className={`rounded-xl p-3 ${wasOnTime ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-orange-500/10 border border-orange-500/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaTrophy className={wasOnTime ? 'text-emerald-400' : 'text-orange-400'} />
                    <span className="text-white text-sm font-medium">
                      {wasOnTime ? 'Delivered On Time!' : 'Delivered Late'}
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${wasOnTime ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {wasOnTime ? `${daysBeforeDeadline} day${daysBeforeDeadline !== 1 ? 's' : ''} early` : `${Math.abs(daysBeforeDeadline)} day${Math.abs(daysBeforeDeadline) !== 1 ? 's' : ''} late`}
                  </span>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  Completed in {totalDays} day{totalDays !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-3">
              <h4 className="text-gray-400 text-xs uppercase tracking-wider flex items-center gap-2">
                <FaRupeeSign className="text-gray-500" /> Payment Details
              </h4>
              
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Order Amount</span>
                  <span className="text-white font-medium">₹{order.amount?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Platform Fee ({feePercent}%)</span>
                  <span className="text-red-400">-₹{order.platformFee?.toLocaleString()}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                  <span className="text-white font-medium">Editor Earnings</span>
                  <span className="text-emerald-400 font-bold text-lg">₹{order.editorEarning?.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Status Badge */}
              <div className="flex items-center justify-center gap-2 py-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-emerald-400 text-sm font-medium">Payment Released</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 text-center border border-purple-500/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FaStar className="text-yellow-400" />
                <span className="text-white font-medium">Thank you for using Suvix!</span>
                <FaStar className="text-yellow-400" />
              </div>
              <p className="text-gray-400 text-xs">
                This chat is now closed. Visit your dashboard to start new projects.
              </p>
            </div>
          </div>

          {/* Decorative receipt edge */}
          <div className="flex justify-center">
            <div className="flex gap-1.5 py-3">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-gray-800 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CompletedOrderReceipt;
