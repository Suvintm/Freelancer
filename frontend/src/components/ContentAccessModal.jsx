import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaLock, FaExclamationTriangle, FaCheck } from 'react-icons/fa';

const ContentAccessModal = ({ isOpen, onClose, onAccept, isLoading }) => {
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#111319] border border-[#262A3B] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-red-500/10 to-transparent">
                <div className="flex items-center gap-3 text-red-400 mb-1">
                    <FaShieldAlt className="text-2xl" />
                    <h2 className="text-xl font-bold">Confidential Content Access Agreement</h2>
                </div>
                <p className="text-gray-400 text-sm">Please review carefully before accessing client files.</p>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-gray-300">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3 items-start">
                    <FaExclamationTriangle className="text-amber-500 text-xl flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-amber-400 font-bold mb-1">IMPORTANT: CONFIDENTIAL CONTENT NOTICE</h4>
                        <p className="text-sm text-amber-200/80">You are about to access <strong>private, unpublished, and legally protected content</strong> uploaded by a client on Suvix.</p>
                    </div>
                </div>

                <p className="font-medium text-white">By proceeding, you <strong>legally agree</strong> to the following:</p>

                <div className="space-y-4">
                    <section>
                        <h3 className="text-white font-bold mb-2">1. Content Ownership</h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm bg-white/5 p-3 rounded-lg border border-white/5">
                            <li>All raw footage, audio, images, and related materials <strong>fully belong to the client</strong>.</li>
                            <li>You are granted <strong>temporary, limited access</strong> strictly for completing the assigned order.</li>
                        </ul>
                    </section>
                    
                    <section>
                        <h3 className="text-red-400 font-bold mb-2">2. Prohibited Actions (STRICT)</h3>
                        <p className="text-sm mb-2">You MUST NOT:</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm bg-red-500/5 p-3 rounded-lg border border-red-500/10 text-red-200/80">
                            <li>Reuse, repost, resell, or distribute the content</li>
                            <li>Share the Drive link or files with any third party</li>
                            <li>Store the content after project completion</li>
                            <li>Use any portion for portfolio, showreel, or social media</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">3. Monitoring & Tracking</h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm bg-white/5 p-3 rounded-lg border border-white/5">
                            <li>Suvix <strong>logs and monitors</strong> content access, including timestamps, IP address, device details, and access frequency.</li>
                            <li>Any suspicious activity may trigger <strong>automatic account review</strong>.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2">4. Violations & Consequences</h3>
                        <p className="text-sm mb-2">If misuse is detected or reported:</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm bg-white/5 p-3 rounded-lg border border-white/5">
                            <li>Immediate <strong>account suspension</strong></li>
                            <li><strong>Wallet balance freeze</strong></li>
                            <li>Permanent ban from Suvix</li>
                            <li>Legal action under applicable laws</li>
                        </ul>
                    </section>
                    
                    <section>
                        <h3 className="text-white font-bold mb-2">5. Legal Jurisdiction</h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm bg-white/5 p-3 rounded-lg border border-white/5">
                            <li>This agreement is governed by <strong>Indian law</strong></li>
                            <li>Disputes fall under the jurisdiction of <strong>India</strong></li>
                        </ul>
                    </section>
                </div>
            </div>

            {/* Footer / Actions */}
            <div className="p-6 border-t border-white/10 bg-[#0a0a0c]">
                <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors mb-6 group">
                    <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-500 group-hover:border-gray-400'}`}>
                        {isChecked && <FaCheck className="text-white text-xs" />}
                    </div>
                    <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={isChecked} 
                        onChange={(e) => setIsChecked(e.target.checked)} 
                    />
                    <span className="text-sm font-medium text-gray-300">
                        I have read, understood, and agree to the above terms.
                    </span>
                </label>

                <div className="flex gap-4">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 px-6 rounded-xl font-semibold text-gray-400 hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onAccept}
                        disabled={!isChecked || isLoading}
                        className="flex-1 py-3 px-6 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <FaLock className="text-sm" />
                                I Agree & Access Content
                            </>
                        )}
                    </button>
                </div>
                
                <p className="text-center text-xs text-gray-600 mt-4 flex items-center justify-center gap-1">
                    <FaLock className="text-[10px]" />
                    By clicking above, you confirm this is a <strong>legally binding digital agreement</strong>.
                </p>
            </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ContentAccessModal;
