import { motion } from "framer-motion";
import { useEffect } from "react";
import { FaShieldAlt, FaLock, FaUserShield, FaGavel, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const LegalLayout = ({ title, icon: Icon, children }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-gray-300 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors"
        >
            <FaArrowLeft /> Back
        </button>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111319] border border-[#262A3B] rounded-2xl p-8 md:p-12 shadow-2xl"
        >
            <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
                    <Icon className="text-3xl text-emerald-400" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">{title}</h1>
            </div>
            
            <div className="prose prose-invert prose-lg max-w-none text-gray-400">
                {children}
            </div>
        </motion.div>

        <div className="mt-8 text-center text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} Suvix. All rights protected under Indian Law.
        </div>
      </div>
    </div>
  );
};

export const TermsAndConditions = () => (
  <LegalLayout title="Terms & Conditions" icon={FaGavel}>
    <h3 className="text-white mt-0">Suvix – Terms & Conditions</h3>
    <p>
      Suvix is a digital platform that connects content creators with freelance video editors. Suvix acts as a <strong>facilitator</strong>, not an employer or agency.
    </p>

    <h3 className="text-white">User Responsibilities</h3>
    <ul className="list-disc pl-5 space-y-2">
      <li>Users must provide accurate information</li>
      <li>Users must comply with platform rules</li>
      <li>Any misuse, fraud, or abuse may result in suspension or termination</li>
    </ul>

    <h3 className="text-white">Payments & Payouts</h3>
    <ul className="list-disc pl-5 space-y-2">
      <li>Payments are processed securely</li>
      <li>Editor payouts are released only after client acceptance</li>
      <li>Suvix reserves the right to withhold payments in case of disputes or violations</li>
    </ul>

    <h3 className="text-white">Account Termination</h3>
    <p>Suvix may suspend or terminate accounts without prior notice for:</p>
    <ul className="list-disc pl-5 space-y-2">
      <li>Policy violations</li>
      <li>Fraudulent behavior</li>
      <li>Content misuse</li>
    </ul>

    <h3 className="text-white">Limitation of Liability</h3>
    <p>
      Suvix is not responsible for disputes arising outside platform rules.
    </p>
    <p className="mt-6 border-t border-white/10 pt-4">
      By using Suvix, you agree to these Terms.
    </p>
  </LegalLayout>
);

export const PrivacyPolicy = () => (
    <LegalLayout title="Privacy Policy" icon={FaUserShield}>
      <h3 className="text-white mt-0">Suvix Privacy Policy</h3>
      <p>
        Suvix collects minimal personal data required for platform operation.
      </p>
  
      <h3 className="text-white">Data Collected</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Name, email, profile data</li>
        <li>Payment & KYC information</li>
        <li>Access logs and activity records</li>
      </ul>
  
      <h3 className="text-white">Data Protection</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Sensitive data is encrypted</li>
        <li>Access is restricted</li>
        <li>Data is never sold to third parties</li>
      </ul>
  
      <h3 className="text-white">User Rights</h3>
      <p>
        Users may request data access or deletion as per applicable laws.
      </p>
    </LegalLayout>
);

export const ContentProtectionPolicy = () => (
    <LegalLayout title="Content Protection Policy" icon={FaLock}>
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8">
        <p className="text-red-400 font-semibold m-0 flex items-center gap-2">
            <FaShieldAlt /> MOST IMPORTANT PAGE
        </p>
      </div>

      <h3 className="text-white mt-0">Suvix Content Protection Policy</h3>
      <p>
        Suvix enforces strict protection of creator content.
      </p>
  
      <h3 className="text-white">Ownership</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>All uploaded content belongs exclusively to the client.</li>
        <li>Editors receive limited access for service delivery only.</li>
      </ul>
  
      <h3 className="text-white">Confidentiality</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Editors must treat all content as confidential.</li>
        <li>No reuse, redistribution, or storage after completion.</li>
      </ul>
  
      <h3 className="text-white">Enforcement</h3>
      <p>Violations may result in:</p>
      <ul className="list-disc pl-5 space-y-2 text-red-300">
        <li>Immediate account suspension</li>
        <li>Wallet balance freeze</li>
        <li>Permanent ban</li>
        <li>Legal action under Indian IT & Copyright laws</li>
      </ul>
  
      <p className="mt-6 font-semibold text-emerald-400">
        Suvix maintains access logs and cooperates with legal authorities when required.
      </p>
    </LegalLayout>
);

export const EditorCodeOfConduct = () => (
    <LegalLayout title="Editor Code of Conduct" icon={FaShieldAlt}>
      <h3 className="text-white mt-0">Editor Code of Conduct</h3>
      <p>
        Editors on Suvix are expected to:
      </p>
      <ul className="list-disc pl-5 space-y-2">
        <li>Respect client confidentiality</li>
        <li>Deliver work honestly</li>
        <li>Avoid misuse of any client assets</li>
      </ul>
      
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 mt-8">
        <p className="text-amber-200 m-0 font-medium">
            Any violation may lead to permanent removal from the platform.
        </p>
      </div>
    </LegalLayout>
);
