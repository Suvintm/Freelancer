/**
 * SystemMessageCard.jsx - Special platform message card for system events
 * Features:
 * - Centered layout (not sender aligned)
 * - Platform logo
 * - Different themes per action type
 * - Helpful guidance text
 * - Delete disabled
 */

import { motion } from "framer-motion";
import { 
  FaCheckCircle, 
  FaRocket, 
  FaFilm, 
  FaHandshake, 
  FaCreditCard,
  FaExclamationTriangle,
  FaTrophy
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";

// Platform logo - you can replace this with actual logo URL
const PLATFORM_LOGO = "/logo.png";

// Action configurations with themes, icons, and guidance
const ACTION_CONFIG = {
  order_created: {
    theme: "from-blue-500 to-cyan-500",
    bgClass: "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30",
    icon: FaRocket,
    title: "🚀 New Project Request",
    getDescription: (isEditor) => isEditor 
      ? "A client has sent you a project request. Review the details and accept to start working!"
      : "Your project request has been sent. Wait for the editor to accept.",
  },
  order_accepted: {
    theme: "from-emerald-500 to-green-500",
    bgClass: "bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30",
    icon: FaHandshake,
    title: "🎉 Order Accepted!",
    getDescription: (isEditor) => isEditor
      ? "You've accepted this project! Start working and communicate regularly with the client."
      : "Great news! The editor accepted your order. You can now discuss project details together.",
    tips: [
      "💬 Use chat to share requirements and updates",
      "📁 Share files via Google Drive or direct upload",
      "⏰ Keep track of the deadline",
    ],
  },
  order_rejected: {
    theme: "from-red-500 to-orange-500",
    bgClass: "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30",
    icon: FaExclamationTriangle,
    title: "Order Declined",
    getDescription: () => "This order has been declined by the editor.",
  },
  payment_required: {
    theme: "from-blue-500 to-indigo-500",
    bgClass: "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/30",
    icon: FaCreditCard,
    title: "💳 Payment Required",
    getDescription: (isEditor) => isEditor
      ? "Waiting for client to complete payment to start working."
      : "Please complete the payment to confirm your order and start the project.",
  },
  payment_confirmed: {
    theme: "from-green-500 to-emerald-500",
    bgClass: "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30",
    icon: FaCheckCircle,
    title: "✅ Payment Confirmed",
    getDescription: () => "Payment has been received and held in escrow. The project can now begin!",
  },
  work_submitted: {
    theme: "from-purple-500 to-pink-500",
    bgClass: "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30",
    icon: FaFilm,
    title: "🎬 Final Delivery Submitted!",
    getDescription: (isEditor) => isEditor
      ? "You've submitted the final work! Wait for the client to review and approve."
      : "The editor has submitted the final work. Review carefully before accepting.",
    tips: [
      "👀 Preview the work thoroughly",
      "📝 Request changes if needed",
      "✅ Accept to release payment",
    ],
  },
  work_completed: {
    theme: "from-yellow-500 to-orange-500",
    bgClass: "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30",
    icon: FaTrophy,
    title: "🏆 Order Completed!",
    getDescription: (isEditor) => isEditor
      ? "Congratulations! The order is complete and payment has been released to your account."
      : "Thank you for using our platform! The project is complete.",
    tips: [
      "⭐ Don't forget to rate your experience",
      "💬 You can still access chat history",
    ],
  },
  payment_released: {
    theme: "from-emerald-500 to-teal-500",
    bgClass: "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30",
    icon: FaCheckCircle,
    title: "💰 Payment Released",
    getDescription: () => "Payment has been released to the editor successfully.",
  },
};

const SystemMessageCard = ({ message, userRole }) => {
  const systemAction = message.systemAction || "order_created";
  const config = ACTION_CONFIG[systemAction] || ACTION_CONFIG.order_created;
  const Icon = config.icon;
  const isEditor = userRole === "editor";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex justify-center my-4"
    >
      <div className={`relative max-w-md w-full mx-4 p-4 rounded-2xl border ${config.bgClass} backdrop-blur-sm overflow-hidden`}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        
        {/* Platform badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-1.5 rounded-lg bg-gradient-to-r ${config.theme}`}>
            <HiSparkles className="text-white text-sm" />
          </div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Platform Message
          </span>
        </div>

        {/* Header with icon and title */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${config.theme} flex items-center justify-center shadow-lg`}>
            <Icon className="text-white text-lg" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {config.title}
          </h3>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm leading-relaxed mb-3">
          {config.getDescription(isEditor)}
        </p>

        {/* Tips section */}
        {config.tips && config.tips.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-gray-400 font-medium mb-2">Quick Tips:</p>
            <div className="space-y-1">
              {config.tips.map((tip, index) => (
                <p key={index} className="text-xs text-gray-400">
                  {tip}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-3 text-right">
          <span className="text-[10px] text-gray-500">
            {new Date(message.createdAt).toLocaleString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default SystemMessageCard;
