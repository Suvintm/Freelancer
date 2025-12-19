/**
 * SystemMessageCard.jsx - Professional platform message card for system events
 * Features:
 * - Clean, professional design
 * - Responsive (smaller on mobile)
 * - Centered layout
 * - No delete option
 */

import { motion } from "framer-motion";
import { 
  HiCheckCircle, 
  HiRocketLaunch, 
  HiFilm, 
  HiShieldCheck,
  HiCreditCard,
  HiExclamationTriangle,
  HiTrophy,
  HiSparkles,
  HiBanknotes
} from "react-icons/hi2";

// Action configurations with professional themes
const ACTION_CONFIG = {
  order_created: {
    gradient: "from-blue-600 to-cyan-600",
    bgLight: "bg-blue-500/5",
    borderColor: "border-blue-500/20",
    icon: HiRocketLaunch,
    iconBg: "bg-blue-500",
    title: "New Project Request",
    getDescription: (isEditor) => isEditor 
      ? "A client has sent you a project request. Review and accept to begin."
      : "Your request has been sent successfully.",
  },
  order_accepted: {
    gradient: "from-emerald-600 to-green-600",
    bgLight: "bg-emerald-500/5",
    borderColor: "border-emerald-500/20",
    icon: HiCheckCircle,
    iconBg: "bg-emerald-500",
    title: "Order Accepted",
    getDescription: (isEditor) => isEditor
      ? "You've accepted this project. Start working and keep the client updated."
      : "Great news! The editor accepted your order. Start collaborating now.",
  },
  order_rejected: {
    gradient: "from-red-600 to-rose-600",
    bgLight: "bg-red-500/5",
    borderColor: "border-red-500/20",
    icon: HiExclamationTriangle,
    iconBg: "bg-red-500",
    title: "Order Declined",
    getDescription: () => "This order has been declined.",
  },
  payment_required: {
    gradient: "from-indigo-600 to-blue-600",
    bgLight: "bg-indigo-500/5",
    borderColor: "border-indigo-500/20",
    icon: HiCreditCard,
    iconBg: "bg-indigo-500",
    title: "Payment Required",
    getDescription: (isEditor) => isEditor
      ? "Waiting for client payment."
      : "Complete payment to confirm your order.",
  },
  payment_confirmed: {
    gradient: "from-green-600 to-emerald-600",
    bgLight: "bg-green-500/5",
    borderColor: "border-green-500/20",
    icon: HiShieldCheck,
    iconBg: "bg-green-500",
    title: "Payment Confirmed",
    getDescription: () => "Payment received and secured. Project is ready to begin.",
  },
  work_submitted: {
    gradient: "from-purple-600 to-violet-600",
    bgLight: "bg-purple-500/5",
    borderColor: "border-purple-500/20",
    icon: HiFilm,
    iconBg: "bg-purple-500",
    title: "Work Submitted",
    getDescription: (isEditor) => isEditor
      ? "Your work has been submitted. Awaiting client review."
      : "The editor has delivered the final work. Please review.",
  },
  work_completed: {
    gradient: "from-amber-600 to-yellow-600",
    bgLight: "bg-amber-500/5",
    borderColor: "border-amber-500/20",
    icon: HiTrophy,
    iconBg: "bg-amber-500",
    title: "Order Completed",
    getDescription: (isEditor) => isEditor
      ? "Congratulations! Payment has been released to your account."
      : "Order complete. Thank you for using our platform!",
  },
  payment_released: {
    gradient: "from-teal-600 to-emerald-600",
    bgLight: "bg-teal-500/5",
    borderColor: "border-teal-500/20",
    icon: HiBanknotes,
    iconBg: "bg-teal-500",
    title: "Payment Released",
    getDescription: () => "Payment has been released to the editor.",
  },
};

const SystemMessageCard = ({ message, userRole }) => {
  const systemAction = message.systemAction || "order_created";
  const config = ACTION_CONFIG[systemAction] || ACTION_CONFIG.order_created;
  const Icon = config.icon;
  const isEditor = userRole === "editor";

  const formatTime = (date) => {
    return new Date(date).toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-center my-3 md:my-4 px-3"
    >
      <div className={`relative w-full max-w-[320px] md:max-w-md rounded-xl border ${config.borderColor} ${config.bgLight} backdrop-blur-sm overflow-hidden`}>
        {/* Subtle gradient line at top */}
        <div className={`h-0.5 w-full bg-gradient-to-r ${config.gradient}`} />
        
        <div className="p-3 md:p-4">
          {/* Header */}
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${config.iconBg} flex items-center justify-center shadow-sm`}>
              <Icon className="text-white text-sm md:text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <HiSparkles className="text-gray-400 text-xs" />
                <span className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-wide">
                  Platform
                </span>
              </div>
              <h3 className="text-sm md:text-base font-semibold text-white truncate">
                {config.title}
              </h3>
            </div>
          </div>

          {/* Description */}
          <p className="mt-2 md:mt-3 text-xs md:text-sm text-gray-300 leading-relaxed">
            {config.getDescription(isEditor)}
          </p>

          {/* Timestamp */}
          <div className="mt-2 md:mt-3 pt-2 border-t border-white/5 flex justify-end">
            <span className="text-[10px] md:text-xs text-gray-500">
              {formatTime(message.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SystemMessageCard;
