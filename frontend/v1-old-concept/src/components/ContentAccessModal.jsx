import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineShieldCheck, HiOutlineLockClosed, HiOutlineExclamationTriangle, HiOutlineCheckCircle, HiOutlineScale, HiOutlineEye } from 'react-icons/hi2';

const ContentAccessModal = ({ isOpen, onClose, onAccept, isLoading }) => {
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  const sections = [
    {
      title: "Content Ownership",
      icon: HiOutlineShieldCheck,
      iconColor: "text-blue-500",
      items: [
        "All raw footage, audio, and images fully belong to the client.",
        "You are granted temporary, limited access for this order only."
      ]
    },
    {
      title: "Prohibited Actions",
      icon: HiOutlineExclamationTriangle,
      iconColor: "text-red-500",
      items: [
        "Reuse, repost, resell, or distribute the content",
        "Share the link or files with any third party",
        "Store the content after project completion",
        "Use any portion for portfolio or social media"
      ]
    },
    {
      title: "Monitoring",
      icon: HiOutlineEye,
      iconColor: "text-amber-500",
      items: [
        "All access is logged with IP, device, and timestamp.",
        "Suspicious activity triggers automatic account review."
      ]
    },
    {
      title: "Violations",
      icon: HiOutlineScale,
      iconColor: "text-purple-500",
      items: [
        "Immediate account suspension and wallet freeze",
        "Permanent ban and legal action under applicable laws"
      ]
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <HiOutlineLockClosed className="text-red-500 text-lg" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Confidential Content Access</h2>
                <p className="text-[11px] text-zinc-500">Review terms before accessing files</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {/* Warning Banner */}
            <div className="flex items-start gap-2.5 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <HiOutlineExclamationTriangle className="text-amber-500 text-base flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                You are accessing <strong>private, legally protected</strong> client content. By proceeding, you agree to the terms below.
              </p>
            </div>

            {/* Sections Grid */}
            <div className="grid grid-cols-1 gap-2.5">
              {sections.map((section, idx) => (
                <div key={idx} className="p-3 bg-zinc-800/40 border border-zinc-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <section.icon className={`text-sm ${section.iconColor}`} />
                    <h3 className="text-xs font-medium text-zinc-200">{section.title}</h3>
                  </div>
                  <ul className="space-y-1">
                    {section.items.map((item, i) => (
                      <li key={i} className="text-[11px] text-zinc-400 flex items-start gap-1.5">
                        <span className="text-zinc-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-900/90 space-y-3">
            {/* Checkbox */}
            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 cursor-pointer hover:bg-zinc-800 transition-colors group">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 group-hover:border-zinc-500'}`}>
                {isChecked && <HiOutlineCheckCircle className="text-white text-xs" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={isChecked} 
                onChange={(e) => setIsChecked(e.target.checked)} 
              />
              <span className="text-[11px] text-zinc-300">
                I have read, understood, and accept these terms.
              </span>
            </label>

            {/* Buttons */}
            <div className="flex gap-2.5">
              <button 
                onClick={onClose}
                className="flex-1 py-2 px-4 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={onAccept}
                disabled={!isChecked || isLoading}
                className="flex-1 py-2 px-4 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all"
              >
                {isLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <HiOutlineLockClosed className="text-xs" />
                    Accept & Access
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-[10px] text-zinc-600">
              This is a legally binding digital agreement.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ContentAccessModal;
