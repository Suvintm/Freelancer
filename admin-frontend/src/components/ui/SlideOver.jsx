import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineXMark } from "react-icons/hi2";
import { useEffect } from "react";

const SlideOver = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  footer,
  width = "max-w-md"
}) => {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Slide Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed inset-y-0 right-0 w-full ${width} bg-surface border-l border-default z-[101] shadow-2xl flex flex-col`}
          >
            {/* Header */}
            <div className="p-6 border-b border-default flex items-center justify-between bg-surface/80 backdrop-blur-md sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text-primary">{title}</h3>
                {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-elevated text-muted hover:text-primary transition-all"
              >
                <HiOutlineXMark size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-6 border-t border-default bg-elevated/50">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SlideOver;
