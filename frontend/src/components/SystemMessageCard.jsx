/**
 * SystemMessageCard.jsx - Professional Suvix Platform Message Card
 * 
 * Design: Clean black card with Suvix logo + verified badge (like Instagram official)
 * - Platform logo at top
 * - "Suvix" name with blue verified badge
 * - Clean message content below
 */

import { motion } from "framer-motion";
import { HiCheckBadge } from "react-icons/hi2";
import logo from "/logo.png";

// Action configurations - Simple and clean
const ACTION_CONFIG = {
  order_created: {
    title: "New Project Request",
    getDescription: (isEditor) => isEditor 
      ? "A client has sent you a project request. Review and accept to begin."
      : "Your request has been sent successfully.",
  },
  order_accepted: {
    title: "Order Accepted",
    getDescription: (isEditor) => isEditor
      ? "You've accepted this project. Start working and keep the client updated."
      : "Great news! The editor accepted your order. Start collaborating now.",
  },
  order_rejected: {
    title: "Order Declined",
    getDescription: () => "This order has been declined.",
  },
  payment_required: {
    title: "Payment Required",
    getDescription: (isEditor) => isEditor
      ? "Waiting for client payment."
      : "Complete payment to confirm your order.",
  },
  payment_confirmed: {
    title: "Payment Confirmed",
    getDescription: () => "Payment received and secured. Project is ready to begin.",
  },
  work_submitted: {
    title: "Work Submitted",
    getDescription: (isEditor) => isEditor
      ? "Your work has been submitted. Awaiting client review."
      : "The editor has delivered the final work. Please review.",
  },
  work_completed: {
    title: "Order Completed",
    getDescription: (isEditor) => isEditor
      ? "Congratulations! Payment has been released to your account."
      : "Order complete. Thank you for using our platform!",
  },
  payment_released: {
    title: "Payment Released",
    getDescription: () => "Payment has been released to the editor.",
  },
  content_accessed: {
    title: "Drive Access Confirmed",
    getDescription: (isEditor) => isEditor
      ? "You have accepted the terms and opened the client's drive files."
      : "Editor has accepted the content protection agreement and opened your drive files.",
  },
  changes_requested: {
    title: "Revision Requested",
    getDescription: (isEditor) => isEditor
      ? "The client has requested revisions. Please check their feedback."
      : "Your revision request has been sent to the editor.",
  },
};

const SystemMessageCard = ({ message, userRole }) => {
  const systemAction = message.systemAction || "order_created";
  const config = ACTION_CONFIG[systemAction] || ACTION_CONFIG.order_created;
  const isEditor = userRole === "editor";

  const formatTime = (date) => {
    return new Date(date).toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-center my-3 px-3"
    >
      <div className="w-full max-w-[280px] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
        {/* Header - Logo + Suvix + Verified Badge */}
        <div className="px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            {/* Platform Logo */}
            <img 
              src={logo} 
              alt="Suvix" 
              className="w-7 h-7 rounded-lg object-contain"
            />
            
            {/* Suvix Name + Verified Badge */}
            <div className="flex items-center gap-1">
              <span className="text-white font-bold text-[13px]">Suvix</span>
              <HiCheckBadge className="text-[#3B82F6] text-base" />
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="px-4 py-3">
          {/* Title */}
          <h3 className="text-white font-semibold text-[14px] mb-1.5">
            {config.title}
          </h3>
          
          {/* Description */}
          <p className="text-zinc-400 text-[12px] leading-relaxed">
            {config.getDescription(isEditor)}
          </p>
        </div>

        {/* Timestamp */}
        <div className="px-4 pb-3">
          <span className="text-zinc-600 text-[10px]">
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default SystemMessageCard;
