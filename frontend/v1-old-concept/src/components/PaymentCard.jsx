// PaymentCard.jsx - Individual payment list item
import React from "react";
import { motion } from "framer-motion";
import {
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaChevronRight,
} from "react-icons/fa";

const PaymentCard = ({ payment, isEditor, onClick }) => {
  const isReceived = isEditor; // Editors receive, clients pay
  
  // Status colors and icons
  const statusConfig = {
    completed: { color: "text-emerald-400", bg: "bg-emerald-500/20", icon: FaCheckCircle },
    pending: { color: "text-orange-400", bg: "bg-orange-500/20", icon: FaClock },
    failed: { color: "text-red-400", bg: "bg-red-500/20", icon: FaTimesCircle },
    processing: { color: "text-blue-400", bg: "bg-blue-500/20", icon: FaClock },
  };

  const status = statusConfig[payment.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Get display amount
  const displayAmount = isEditor ? payment.editorEarning : payment.amount;
  const otherParty = isEditor ? payment.client?.name : payment.editor?.name;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="bg-[#1a1a1a] light:bg-white border border-white/5 light:border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-white/20 light:hover:border-slate-300 transition-all light:shadow-sm"
    >
      <div className="flex items-center gap-4">
        {/* Direction Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isReceived ? "bg-emerald-500/20" : "bg-red-500/20"
        }`}>
          {isReceived ? (
            <FaArrowDown className="text-emerald-400 light:text-emerald-500 text-lg" />
          ) : (
            <FaArrowUp className="text-red-400 light:text-red-500 text-lg" />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white light:text-slate-900 font-semibold truncate">
              {payment.order?.title || payment.orderSnapshot?.title || "Order"}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
              <StatusIcon className="inline mr-1 text-[10px]" />
              {payment.status}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-400 light:text-slate-500">
            <span>{isReceived ? "From" : "To"}: {otherParty}</span>
            <span>•</span>
            <span>{formatDate(payment.completedAt || payment.createdAt)}</span>
          </div>
          
          <p className="text-xs text-gray-500 light:text-slate-400 mt-0.5">
            {payment.order?.orderNumber || payment.orderSnapshot?.orderNumber}
          </p>
        </div>

        {/* Amount */}
        <div className="text-right">
          <p className={`text-lg font-bold ${isReceived ? "text-emerald-400 light:text-emerald-600" : "text-white light:text-slate-900"}`}>
            {isReceived ? "+" : "-"}₹{displayAmount?.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 light:text-slate-400">{payment.receiptNumber}</p>
        </div>

        {/* Chevron */}
        <FaChevronRight className="text-gray-600 light:text-slate-400 ml-2" />
      </div>
    </motion.div>
  );
};

export default PaymentCard;
