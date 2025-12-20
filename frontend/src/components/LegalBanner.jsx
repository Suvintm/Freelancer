import { FaShieldAlt, FaLock } from "react-icons/fa";
import { useAppContext } from "../context/AppContext";

const LegalBanner = () => {
  const { user } = useAppContext();

  // Show ONLY if accepted
  if (!user?.legalAcceptance?.contentPolicyAccepted) return null;

  return (
    <div className="bg-[#0f1115] border border-emerald-900/40 rounded-xl p-4 md:p-5 mb-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10">
            <FaShieldAlt className="text-6xl text-emerald-500" />
        </div>
        
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <FaLock className="text-emerald-500 text-xs" />
                </div>
                <h3 className="font-bold text-emerald-400 text-sm md:text-base">Content Protection Agreement Accepted</h3>
            </div>
            
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed mb-3">
                ✅ You have accepted Suvix’s <strong>Content Protection & Confidentiality Agreement</strong>.
                <br /><br />
                This confirms that you understand:
                <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-500">
                    <li>All client content is confidential</li>
                    <li>Any misuse, sharing, or unauthorized use is strictly prohibited</li>
                    <li>You are <strong>fully responsible</strong> for all actions taken after accessing client content</li>
                </ul>
            </p>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-emerald-500/10">
                <span className="text-[10px] text-red-400/80 font-medium">
                    ⚠️ Any violation may result in account suspension or legal action.
                </span>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => window.open('mailto:legal@suvix.com?subject=Content Misuse Report', '_blank')}
                        className="text-[10px] text-gray-500 hover:text-red-400 font-medium transition-colors underline"
                    >
                        Report Content Misuse
                    </button>
                    
                    {user.legalAcceptance.acceptedAt && (
                        <div className="text-[10px] text-gray-600 font-mono">
                            Accepted on: {new Date(user.legalAcceptance.acceptedAt).toLocaleDateString()} • {user.legalAcceptance.agreementVersion}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default LegalBanner;
