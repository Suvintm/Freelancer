import { motion } from "framer-motion";
import { FaShieldAlt, FaExclamationTriangle, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const KYCPendingBanner = () => {
  const { user } = useAppContext();
  const navigate = useNavigate();

  // If no user or verified, don't show
  // Explicitly check for client role and non-verified status
  if (!user || user.role !== "client" || user.kycStatus === "verified") {
    return null;
  }

  const getStatusContent = () => {
    switch (user.kycStatus) {
      case "pending":
      case "under_review":
        return {
          title: "KYC Verification in Progress",
          message: "Your documents are being reviewed. You will be notified once verified.",
          bgColor: "from-blue-600 to-blue-800",
          icon: FaShieldAlt,
          action: "Check Status"
        };
      case "rejected":
        return {
          title: "KYC Verification Rejected",
          message: user.kycRejectionReason 
            ? `Reason: ${user.kycRejectionReason}. Please update your details.`
            : "Please update your documents to proceed.",
          bgColor: "from-red-600 to-red-800",
          icon: FaExclamationTriangle,
          action: "Fix Issues"
        };
      default: // not_started
        return {
          title: "Complete Your KYC",
          message: "Verify your identity to unlock refunds and wallet withdrawals. It only takes a minute.",
          bgColor: "from-amber-600 to-orange-600",
          icon: FaShieldAlt,
          action: "Verify Now"
        };
    }
  };

  const content = getStatusContent();
  const Icon = content.icon;

  return (
    <div className="w-full">
       <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full rounded-xl p-3 md:p-4 bg-gradient-to-r ${content.bgColor} shadow-lg relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Icon className="text-xl text-white" />
                </div>
                <div>
                    <h3 className="text-[13px] md:text-sm font-bold text-white mb-0.5">{content.title}</h3>
                    <p className="text-white/90 text-[11px] max-w-xl leading-relaxed">
                        {content.message}
                    </p>
                </div>
            </div>

            <button 
                onClick={() => navigate("/client-kyc")}
                className="group flex items-center gap-2 px-4 py-1.5 bg-white text-gray-900 text-xs font-bold rounded-lg hover:bg-white/90 transition-all shadow-md whitespace-nowrap"
            >
                {content.action}
                <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </motion.div>
    </div>
  );
};

export default KYCPendingBanner;
