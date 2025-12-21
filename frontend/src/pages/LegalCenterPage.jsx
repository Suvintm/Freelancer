import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaShieldAlt,
  FaLock,
  FaUserShield,
  FaGavel,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUserTie,
  FaFileContract,
  FaBalanceScale,
  FaEnvelope,
  FaBell,
  FaScroll,
} from "react-icons/fa";
import { HiDocumentText } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

const LegalCenterPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("terms");

  const tabs = [
    { id: "terms", label: "Terms & Conditions", icon: FaGavel },
    { id: "privacy", label: "Privacy Policy", icon: FaUserShield },
    { id: "content", label: "Content Protection", icon: FaLock },
    { id: "conduct", label: "Code of Conduct", icon: FaUserTie },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050509] via-[#0a0a0f] to-[#050509] text-gray-300">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-emerald-500/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
            >
              <FaArrowLeft /> Back
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-emerald-500/20">
                <HiDocumentText className="text-xl text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Legal Center</h1>
                <p className="text-xs text-gray-500">Suvix Platform Policies</p>
              </div>
            </div>
            <span className="text-xs text-gray-600">Updated: Dec 2024</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[73px] z-20 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="text-base" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "terms" && <TermsContent />}
            {activeTab === "privacy" && <PrivacyContent />}
            {activeTab === "content" && <ContentProtectionContent />}
            {activeTab === "conduct" && <ConductContent />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} <strong className="text-emerald-400">Suvix</strong>. All rights protected under Indian Law.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
            <a href="mailto:legal@suvix.com" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
              <FaEnvelope /> legal@suvix.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Section Component
const Section = ({ title, children, icon: Icon, variant = "default" }) => {
  const variants = {
    default: "border-gray-700/30 bg-[#0f1115]",
    warning: "border-amber-500/20 bg-amber-500/5",
    danger: "border-red-500/20 bg-red-500/5",
    success: "border-emerald-500/20 bg-emerald-500/5",
  };

  return (
    <div className={`border ${variants[variant]} rounded-xl p-6 mb-6`}>
      {title && (
        <h2 className="flex items-center gap-3 text-xl font-bold text-white mb-4">
          {Icon && <Icon className="text-emerald-400" />}
          {title}
        </h2>
      )}
      <div className="text-gray-400 leading-relaxed space-y-3">{children}</div>
    </div>
  );
};

// TERMS CONTENT
const TermsContent = () => (
  <div>
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-2">Terms & Conditions</h1>
      <p className="text-gray-500">Please read these terms carefully before using Suvix.</p>
    </div>

    <Section title="1. About Suvix" icon={FaShieldAlt}>
      <p>
        Suvix is a digital freelance marketplace designed specifically for{" "}
        <strong className="text-white">Instagram Reel creators, YouTube video creators, and professional video editors</strong>.
      </p>
      <p>
        Suvix acts solely as a <strong className="text-emerald-400">technology platform and facilitator</strong> and does not directly provide editing services.
      </p>
    </Section>

    <Section title="2. User Eligibility" icon={FaUserTie}>
      <p>To use Suvix, you must:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li>Be at least <strong className="text-white">18 years of age</strong></li>
        <li>Provide <strong className="text-white">accurate and truthful information</strong></li>
        <li>Maintain the <strong className="text-white">confidentiality of your account credentials</strong></li>
      </ul>
      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <p className="text-amber-400 text-sm mb-0">⚠️ Suvix reserves the right to suspend or terminate accounts that provide false information.</p>
      </div>
    </Section>

    <Section title="3. User Roles" icon={FaUserShield}>
      <p>Suvix supports multiple user roles:</p>
      <div className="space-y-3 mt-4">
        <div className="flex items-start gap-3 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
          <span className="text-emerald-400 text-lg mt-0.5">•</span>
          <div>
            <strong className="text-white">Client (Creator)</strong>
            <p className="text-sm text-gray-500 mt-1">Uploads content and hires editors</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
          <span className="text-blue-400 text-lg mt-0.5">•</span>
          <div>
            <strong className="text-white">Editor</strong>
            <p className="text-sm text-gray-500 mt-1">Provides video editing services</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
          <span className="text-purple-400 text-lg mt-0.5">•</span>
          <div>
            <strong className="text-white">Admin</strong>
            <p className="text-sm text-gray-500 mt-1">Manages platform operations</p>
          </div>
        </div>
      </div>
    </Section>

    <Section title="4. Platform Usage Rules" icon={FaExclamationTriangle} variant="warning">
      <p className="font-semibold text-white">Users must not:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li>Violate any applicable law</li>
        <li>Upload illegal, copyrighted, or harmful content</li>
        <li>Attempt to bypass platform security</li>
        <li>Misuse content belonging to other users</li>
      </ul>
      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-red-400 font-semibold text-sm mb-0">🚫 Violations may result in suspension or permanent termination.</p>
      </div>
    </Section>

    <Section title="5. Payments & Transactions" icon={FaFileContract}>
      <ul className="list-disc pl-6 space-y-2">
        <li>Payments are processed securely through <strong className="text-white">third-party payment gateways</strong></li>
        <li>
          Funds are released to editors only after <strong className="text-emerald-400">client approval</strong>
        </li>
        <li>Suvix may temporarily hold payouts in case of disputes or policy violations</li>
        <li>
          Platform fees are <strong className="text-white">non-refundable</strong> unless stated otherwise
        </li>
      </ul>
    </Section>

    <Section title="6. Account Suspension & Termination" icon={FaBalanceScale} variant="danger">
      <p>Suvix reserves the right to:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li>Suspend accounts</li>
        <li>Freeze wallet balances</li>
        <li>Terminate access without prior notice</li>
      </ul>
      <p className="mt-4">
        In cases of <strong className="text-red-400">fraud, content misuse, or repeated violations</strong>.
      </p>
    </Section>

    <Section title="7. Limitation of Liability" icon={FaShieldAlt}>
      <p>Suvix is not responsible for:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li>Disputes outside platform policies</li>
        <li>Loss caused by user negligence</li>
        <li>Third-party service failures</li>
      </ul>
    </Section>

    <Section title="8. Governing Law" icon={FaGavel} variant="success">
      <p>
        These Terms are governed by the laws of <strong className="text-white">India</strong>, and disputes shall be subject to{" "}
        <strong className="text-emerald-400">Indian jurisdiction</strong>.
      </p>
    </Section>

    <div className="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
      <p className="text-center text-emerald-300 font-semibold flex items-center justify-center gap-2">
        <FaCheckCircle /> By using Suvix, you agree to these Terms and Conditions.
      </p>
    </div>
  </div>
);

// PRIVACY CONTENT
const PrivacyContent = () => (
  <div>
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-gray-500">Your privacy is important to us.</p>
    </div>

    <Section title="1. Information We Collect" icon={FaUserShield}>
      <p>We may collect:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li>
          <strong className="text-white">Personal details</strong> (name, email, profile info)
        </li>
        <li>
          <strong className="text-white">Payment and KYC details</strong>
        </li>
        <li>
          <strong className="text-white">Usage data</strong> (IP address, device, access logs)
        </li>
        <li>
          <strong className="text-white">Uploaded content metadata</strong>
        </li>
      </ul>
    </Section>

    <Section title="2. How We Use Your Information" icon={FaCheckCircle}>
      <p>Your data is used to:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li>Provide platform services</li>
        <li>Process payments</li>
        <li>Improve security</li>
        <li>Prevent fraud</li>
        <li>Resolve disputes</li>
      </ul>
    </Section>

    <Section title="3. Data Protection" icon={FaLock} variant="success">
      <ul className="list-disc pl-6 space-y-2">
        <li>
          Sensitive information is <strong className="text-emerald-400">encrypted</strong>
        </li>
        <li>
          Access is <strong className="text-emerald-400">role-restricted</strong>
        </li>
        <li>Industry-standard security practices are followed</li>
      </ul>
    </Section>

    <Section title="4. Data Sharing" icon={FaShieldAlt} variant="warning">
      <p>
        <strong className="text-white">Suvix does NOT sell user data.</strong>
      </p>
      <p className="mt-3">Data may be shared only:</p>
      <ul className="list-disc pl-6 space-y-2 mt-2">
        <li>With payment processors</li>
        <li>When legally required</li>
        <li>To enforce platform policies</li>
      </ul>
    </Section>

    <Section title="5. User Rights" icon={FaFileContract}>
      <p>Users may request:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li>Data access</li>
        <li>Data correction</li>
        <li>Account deletion (subject to legal retention requirements)</li>
      </ul>
    </Section>
  </div>
);

// CONTENT PROTECTION CONTENT
const ContentProtectionContent = () => (
  <div>
    <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-6 mb-8">
      <p className="text-red-400 font-bold text-lg mb-2 flex items-center gap-3">
        <FaShieldAlt className="text-2xl" /> MOST IMPORTANT PAGE FOR CREATORS
      </p>
      <p className="text-red-300 text-sm mb-0">Suvix is committed to protecting creator content.</p>
    </div>

    <Section title="1. Content Ownership" icon={FaFileContract} variant="success">
      <ul className="list-disc pl-6 space-y-2">
        <li>
          All uploaded content belongs <strong className="text-emerald-400">exclusively to the client</strong>
        </li>
        <li>
          Editors receive <strong className="text-white">temporary, limited access</strong> for project completion only
        </li>
      </ul>
    </Section>

    <Section title="2. Confidentiality Obligations" icon={FaLock} variant="warning">
      <p className="font-semibold text-white">Editors must:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li>
          Keep all client content <strong className="text-amber-400">strictly confidential</strong>
        </li>
        <li>
          Use content <strong className="text-white">only for the assigned project</strong>
        </li>
        <li>
          Delete content <strong className="text-white">after project completion</strong>
        </li>
        <li>Never reuse content for portfolio or social media</li>
      </ul>
    </Section>

    <Section title="3. Prohibited Actions" icon={FaExclamationTriangle} variant="danger">
      <p className="font-bold text-red-400">Editors must NOT:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3 text-red-300">
        <li>Share content or links</li>
        <li>Store files beyond project scope</li>
        <li>Repost or resell any footage</li>
        <li>Use content without written permission</li>
      </ul>
    </Section>

    <Section title="4. Monitoring & Logging" icon={FaShieldAlt}>
      <p>Suvix logs:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3">
        <li>Content access timestamps</li>
        <li>IP addresses</li>
        <li>Device and session details</li>
      </ul>
      <p className="mt-4 text-emerald-400 font-semibold">These logs are used for security and legal enforcement.</p>
    </Section>

    <Section title="5. Violations & Enforcement" icon={FaBalanceScale} variant="danger">
      <p>Violations may result in:</p>
      <ul className="list-disc pl-6 space-y-2 mt-3 text-red-400 font-semibold">
        <li>Immediate account suspension</li>
        <li>Wallet balance freeze</li>
        <li>Permanent ban</li>
        <li>Legal action under Indian IT & Copyright laws</li>
      </ul>
    </Section>
  </div>
);

// CODE OF CONDUCT CONTENT
const ConductContent = () => (
  <div>
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-2">Editor Code of Conduct</h1>
      <p className="text-gray-500">Professional standards for editors on Suvix.</p>
    </div>

    <Section title="Editors Must:" icon={FaCheckCircle} variant="success">
      <ul className="list-disc pl-6 space-y-2">
        <li>Respect client confidentiality</li>
        <li>Deliver work honestly and on time</li>
        <li>Communicate professionally</li>
        <li>Follow platform policies strictly</li>
      </ul>
    </Section>

    <Section title="Zero-Tolerance Violations" icon={FaExclamationTriangle} variant="danger">
      <ul className="list-disc pl-6 space-y-2 text-red-400">
        <li>Content misuse</li>
        <li>Fraudulent behavior</li>
        <li>Repeated client complaints</li>
      </ul>
      <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-red-300 font-semibold mb-0">⛔ Violations may lead to permanent removal from the platform.</p>
      </div>
    </Section>
  </div>
);

export default LegalCenterPage;
