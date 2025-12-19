import { motion } from "framer-motion";
import { FaShieldAlt, FaExclamationTriangle, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const KYCPendingBanner = () => {
  const { user } = useAppContext();
  const navigate = useNavigate();

  // If no user or verified, don't show
  // Explicitly check for client role and non-verified status
  if (!user || user.role !== "client" || user.clientKycStatus === "verified") {
    return null;
  }

  const getStatusContent = () => {
    switch (user.clientKycStatus) {
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
          message: "Verify your identity to unlock refunds, wallet withdrawals, and order placement. It only takes a minute.",
          bgColor: "from-amber-600 to-orange-600",
          icon: FaShieldAlt,
          action: "Verify Now"
        };
    }
  };

  const content = getStatusContent();
  const Icon = content.icon;

  return (
    <div className="w-full px-4 mt-6 mb-2">
       <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full rounded-2xl p-4 md:p-6 bg-gradient-to-r ${content.bgColor} shadow-xl relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Icon className="text-2xl text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">{content.title}</h3>
                    <p className="text-white/90 text-sm max-w-xl leading-relaxed">
                        {content.message}
                    </p>
                </div>
            </div>

            <button 
                onClick={() => navigate("/client-kyc")}
                className="group flex items-center gap-2 px-6 py-2.5 bg-white text-gray-900 font-bold rounded-xl hover:bg-white/90 transition-all shadow-lg whitespace-nowrap"
            >
                {content.action}
                <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </motion.div>
    </div>
  );
};

export default KYCPendingBanner;
