// ProjectDetailsDropdown.jsx - Collapsible project details with progress bars and receipt
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChevronDown,
  FaCheckCircle,
  FaCircle,
  FaRupeeSign,
  FaReceipt,
  FaClipboardList,
  FaCreditCard,
  FaTasks,
} from "react-icons/fa";

const PAYMENT_STAGES = [
  { key: "pending", label: "Payment Pending", icon: FaCircle },
  { key: "escrow", label: "In Escrow", icon: FaCreditCard },
  { key: "released", label: "Payment Released", icon: FaCheckCircle },
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
  const platformFee = order.platformFee || Math.round(orderAmount * 0.05);
  const editorEarning = order.editorEarning || orderAmount - platformFee;

  return (
    <div className="border-b border-[#262A3B]">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#0D1117] hover:bg-[#111319] transition-all"
      >
        <div className="flex items-center gap-3">
          <FaClipboardList className="text-blue-400" />
          <span className="text-white font-medium text-sm">Project Details</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FaChevronDown className="text-gray-400" />
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
            <div className="p-4 bg-[#0A0D12] grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT: Progress Bars */}
              <div className="space-y-6">
                {/* Payment Progress */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaCreditCard className="text-yellow-400 text-sm" />
                    <h4 className="text-sm font-semibold text-white">Payment Status</h4>
                  </div>
                  <div className="space-y-2 pl-2">
                    {PAYMENT_STAGES.map((stage, index) => {
                      const isActive = index <= paymentStage;
                      const isCurrent = index === paymentStage;
                      return (
                        <div key={stage.key} className="flex items-center gap-3">
                          {/* Vertical Line */}
                          {index < PAYMENT_STAGES.length - 1 && (
                            <div
                              className={`absolute ml-[7px] mt-8 w-0.5 h-6 ${
                                index < paymentStage ? "bg-green-500" : "bg-gray-600"
                              }`}
                            />
                          )}
                          {/* Circle */}
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              isActive ? "bg-green-500" : "bg-gray-600"
                            }`}
                          >
                            {isActive && (
                              <FaCheckCircle className="text-white text-[10px]" />
                            )}
                          </div>
                          {/* Label */}
                          <span
                            className={`text-xs ${
                              isCurrent
                                ? "text-green-400 font-semibold"
                                : isActive
                                ? "text-gray-300"
                                : "text-gray-500"
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
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaTasks className="text-blue-400 text-sm" />
                    <h4 className="text-sm font-semibold text-white">Work Status</h4>
                  </div>
                  <div className="space-y-2 pl-2">
                    {WORK_STAGES.map((stage, index) => {
                      const isActive = index <= workStage;
                      const isCurrent = index === workStage;
                      return (
                        <div key={stage.key} className="flex items-center gap-3 relative">
                          {/* Vertical Line */}
                          {index < WORK_STAGES.length - 1 && (
                            <div
                              className={`absolute left-[7px] top-4 w-0.5 h-4 ${
                                index < workStage ? "bg-blue-500" : "bg-gray-600"
                              }`}
                            />
                          )}
                          {/* Circle */}
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center z-10 ${
                              isActive ? "bg-blue-500" : "bg-gray-600"
                            }`}
                          >
                            {isActive && (
                              <FaCheckCircle className="text-white text-[10px]" />
                            )}
                          </div>
                          {/* Label */}
                          <span
                            className={`text-xs ${
                              isCurrent
                                ? "text-blue-400 font-semibold"
                                : isActive
                                ? "text-gray-300"
                                : "text-gray-500"
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
              <div className="bg-[#111319] rounded-xl p-4 border border-[#262A3B]">
                <div className="flex items-center gap-2 mb-4">
                  <FaReceipt className="text-emerald-400" />
                  <h4 className="text-sm font-semibold text-white">Order Receipt</h4>
                </div>

                <div className="space-y-3">
                  {/* Order Amount */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Order Amount</span>
                    <span className="text-white font-semibold flex items-center gap-1">
                      <FaRupeeSign className="text-xs" />
                      {orderAmount.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Platform Fee */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Platform Fee (5%)</span>
                    <span className="text-red-400 font-medium flex items-center gap-1">
                      - <FaRupeeSign className="text-xs" />
                      {platformFee.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#262A3B] my-2" />

                  {/* You Receive */}
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-sm">
                      {order.editor?._id === order.currentUserId ? "You Receive" : "Editor Receives"}
                    </span>
                    <span className="text-emerald-400 font-bold text-lg flex items-center gap-1">
                      <FaRupeeSign className="text-sm" />
                      {editorEarning.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Order Details */}
                <div className="mt-4 pt-4 border-t border-[#262A3B] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Order ID</span>
                    <span className="text-gray-300 font-mono">{order.orderNumber || order._id?.slice(-8)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-300">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {order.deadline && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Deadline</span>
                      <span className="text-yellow-400">
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
