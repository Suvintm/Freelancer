// ChangesRequestModal.jsx - Modal for client to request changes on final delivery
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaEdit, FaPaperPlane } from "react-icons/fa";

const ChangesRequestModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (message.trim().length >= 10) {
      onSubmit(message);
    }
  };

  const handleClose = () => {
    setMessage("");
    onClose();
  };

  const isValid = message.trim().length >= 10;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-[110] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1a1a1a] rounded-2xl border border-white/10 max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <FaEdit className="text-orange-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Request Changes</h3>
                  <p className="text-gray-400 text-xs">Tell the editor what needs to be changed</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <FaTimes className="text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe the changes you'd like in detail. Be specific about what needs to be modified, added, or removed..."
                rows={5}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-orange-500 transition"
              />
              <div className="flex justify-between mt-2 text-xs">
                <span className={message.length >= 10 ? "text-gray-400" : "text-orange-400"}>
                  {message.length < 10 ? `${10 - message.length} more characters needed` : "✓ Good to go"}
                </span>
                <span className="text-gray-500">{message.length} / 1000</span>
              </div>
            </div>

            {/* Tips */}
            <div className="px-4 pb-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-blue-400 text-xs font-medium mb-1">💡 Tips for good feedback:</p>
                <ul className="text-gray-400 text-xs space-y-0.5 list-disc list-inside">
                  <li>Be specific about timestamps (e.g., "at 0:45...")</li>
                  <li>Describe exactly what you want changed</li>
                  <li>Mention if you want something added or removed</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-white/10 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid || loading}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition ${
                  isValid
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FaPaperPlane />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChangesRequestModal;
