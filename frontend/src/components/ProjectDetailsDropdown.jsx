// ProjectDetailsDropdown.jsx - Collapsible project details with progress bars and receipt
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChevronDown,
  FaCheckCircle,
  FaRupeeSign,
} from "react-icons/fa";
import { 
  HiOutlineClipboardDocumentList,
  HiOutlineCreditCard,
  HiOutlineClipboardDocumentCheck,
  HiOutlineReceiptPercent,
  HiOutlineCheckCircle
} from "react-icons/hi2";

const PAYMENT_STAGES = [
  { key: "pending", label: "Payment Pending" },
  { key: "escrow", label: "In Escrow" },
  { key: "released", label: "Payment Released" },
];

const WORK_STAGES = [
  { key: "accepted", label: "Order Accepted" },
  { key: "in_progress", label: "In Progress" },
  { key: "submitted", label: "Work Submitted" },
  { key: "completed", label: "Completed" },
];

const ProjectDetailsDropdown = ({ order }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!order) return null;

  // Calculate payment stage
  const getPaymentStageIndex = () => {
    if (order.paymentStatus === "released") return 2;
    if (order.paymentStatus === "escrow" || order.paymentStatus === "paid") return 1;
    return 0;
  };

  // Calculate work stage
  const getWorkStageIndex = () => {
    const statusMap = {
      accepted: 0,
      in_progress: 1,
      submitted: 2,
      completed: 3,
    };
    return statusMap[order.status] || 0;
  };

  const paymentStage = getPaymentStageIndex();
  const workStage = getWorkStageIndex();
  
  // Calculate amounts
  const orderAmount = order.amount || 0;
  const platformFee = order.platformFee || 0;
  const editorEarning = order.editorEarning || orderAmount - platformFee;
  const feePercent = order.platformFeePercentage || (orderAmount > 0 ? Math.round((platformFee / orderAmount) * 100) : 10);

  return (
    <div className="border-b border-zinc-800/50 light:border-zinc-200">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-transparent hover:bg-zinc-800/30 light:hover:bg-zinc-100 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/15 light:bg-blue-100">
            <HiOutlineClipboardDocumentList className="text-blue-500 w-4 h-4" />
          </div>
          <span className="text-white light:text-zinc-900 font-semibold text-sm">Project Details</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FaChevronDown className="text-zinc-400 light:text-zinc-500 w-3 h-3" />
        </motion.div>
      </button>

      {/* Dropdown Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-zinc-900/50 light:bg-zinc-50 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-800/50 light:border-zinc-200">
              {/* LEFT: Progress Bars */}
              <div className="space-y-5">
                {/* Payment Progress */}
                <div className="bg-zinc-800/50 light:bg-white rounded-xl p-4 border border-zinc-700/50 light:border-zinc-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-amber-500/15 light:bg-amber-100">
                      <HiOutlineCreditCard className="text-amber-500 w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-white light:text-zinc-900">Payment Status</h4>
                  </div>
                  <div className="space-y-3 pl-1">
                    {PAYMENT_STAGES.map((stage, index) => {
                      const isActive = index <= paymentStage;
                      const isCurrent = index === paymentStage;
                      return (
                        <div key={stage.key} className="flex items-center gap-3 relative">
                          {/* Vertical Line */}
                          {index < PAYMENT_STAGES.length - 1 && (
                            <div
                              className={`absolute left-[9px] top-5 w-0.5 h-5 ${
                                index < paymentStage ? "bg-emerald-500" : "bg-zinc-600 light:bg-zinc-300"
                              }`}
                            />
                          )}
                          {/* Circle */}
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center z-10 shrink-0 ${
                              isActive ? "bg-emerald-500" : "bg-zinc-600 light:bg-zinc-300"
                            }`}
                          >
                            {isActive && (
                              <HiOutlineCheckCircle className="text-white text-xs" />
                            )}
                          </div>
                          {/* Label */}
                          <span
                            className={`text-xs font-medium ${
                              isCurrent
                                ? "text-emerald-400 light:text-emerald-600"
                                : isActive
                                ? "text-zinc-300 light:text-zinc-600"
                                : "text-zinc-500 light:text-zinc-400"
                            }`}
                          >
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Work Progress */}
                <div className="bg-zinc-800/50 light:bg-white rounded-xl p-4 border border-zinc-700/50 light:border-zinc-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-blue-500/15 light:bg-blue-100">
                      <HiOutlineClipboardDocumentCheck className="text-blue-500 w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-white light:text-zinc-900">Work Status</h4>
                  </div>
                  <div className="space-y-3 pl-1">
                    {WORK_STAGES.map((stage, index) => {
                      const isActive = index <= workStage;
                      const isCurrent = index === workStage;
                      return (
                        <div key={stage.key} className="flex items-center gap-3 relative">
                          {/* Vertical Line */}
                          {index < WORK_STAGES.length - 1 && (
                            <div
                              className={`absolute left-[9px] top-5 w-0.5 h-5 ${
                                index < workStage ? "bg-blue-500" : "bg-zinc-600 light:bg-zinc-300"
                              }`}
                            />
                          )}
                          {/* Circle */}
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center z-10 shrink-0 ${
                              isActive ? "bg-blue-500" : "bg-zinc-600 light:bg-zinc-300"
                            }`}
                          >
                            {isActive && (
                              <HiOutlineCheckCircle className="text-white text-xs" />
                            )}
                          </div>
                          {/* Label */}
                          <span
                            className={`text-xs font-medium ${
                              isCurrent
                                ? "text-blue-400 light:text-blue-600"
                                : isActive
                                ? "text-zinc-300 light:text-zinc-600"
                                : "text-zinc-500 light:text-zinc-400"
                            }`}
                          >
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT: Receipt */}
              <div className="bg-zinc-800/50 light:bg-white rounded-xl p-4 border border-zinc-700/50 light:border-zinc-200 h-fit">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 light:bg-emerald-100">
                    <HiOutlineReceiptPercent className="text-emerald-500 w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-white light:text-zinc-900">Order Receipt</h4>
                </div>

                <div className="space-y-3">
                  {/* Order Amount */}
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 light:text-zinc-500 text-sm">Order Amount</span>
                    <span className="text-white light:text-zinc-900 font-semibold flex items-center gap-1">
                      <FaRupeeSign className="text-xs" />
                      {orderAmount.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Platform Fee */}
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 light:text-zinc-500 text-sm">Platform Fee ({feePercent}%)</span>
                    <span className="text-red-400 font-medium flex items-center gap-1">
                      - <FaRupeeSign className="text-xs" />
                      {platformFee.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-zinc-700/50 light:border-zinc-200 my-2" />

                  {/* You Receive */}
                  <div className="flex items-center justify-between bg-emerald-500/10 light:bg-emerald-50 rounded-lg p-3 -mx-1">
                    <span className="text-white light:text-zinc-900 font-semibold text-sm">
                      {order.editor?._id === order.currentUserId ? "You Receive" : "Editor Receives"}
                    </span>
                    <span className="text-emerald-400 light:text-emerald-600 font-bold text-lg flex items-center gap-1">
                      <FaRupeeSign className="text-sm" />
                      {editorEarning.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Order Details */}
                <div className="mt-4 pt-4 border-t border-zinc-700/50 light:border-zinc-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 light:text-zinc-400">Order ID</span>
                    <span className="text-zinc-300 light:text-zinc-600 font-mono">{order.orderNumber || order._id?.slice(-8)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 light:text-zinc-400">Created</span>
                    <span className="text-zinc-300 light:text-zinc-600">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {order.deadline && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 light:text-zinc-400">Deadline</span>
                      <span className="text-amber-400 light:text-amber-600 font-medium">
                        {new Date(order.deadline).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectDetailsDropdown;
