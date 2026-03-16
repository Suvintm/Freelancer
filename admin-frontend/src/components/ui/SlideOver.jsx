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
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
              zIndex: 100
            }}
          />

          {/* Slide Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{
              position: "fixed", top: 0, bottom: 0, right: 0,
              width: "100%", maxWidth: width === "max-w-md" ? 448 : width,
              background: "var(--bg-surface)",
              borderLeft: "1px solid var(--border-default)",
              zIndex: 101, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex", flexDirection: "column"
            }}
          >
            {/* Header */}
            <div style={{
              padding: 24, borderBottom: "1px solid var(--border-default)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "var(--bg-surface)", backdropFilter: "blur(12px)",
              position: "sticky", top: 0, zIndex: 10
            }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{title}</h3>
                {subtitle && <p style={{ fontSize: 14, color: "var(--text-muted)", margin: "4px 0 0" }}>{subtitle}</p>}
              </div>
              <button 
                onClick={onClose}
                style={{
                  padding: 8, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", transition: "all 0.2s"
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)" }}
                onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)" }}
              >
                <HiOutlineXMark size={24} />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div style={{ padding: 24, borderTop: "1px solid var(--border-default)", background: "var(--bg-elevated)" }}>
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
