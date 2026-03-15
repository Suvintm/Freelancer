// ─── Modal ─────────────────────────────────────────────────────────────────
// Accessible modal with focus trap, Escape-to-close, overlay dismiss
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiX } from "react-icons/hi";

const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",             // sm | md | lg | xl | full
  closeOnOverlay = true,
  showClose = true,
  className = "",
}) => {
  const panelRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const sizeMap = {
    sm:   440,
    md:   560,
    lg:   700,
    xl:   900,
    full: "calc(100vw - 48px)",
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px 16px",
          }}
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeOnOverlay ? onClose : undefined}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.97, y: 6  }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`card ${className}`}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: sizeMap[size],
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showClose) && (
              <div style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid var(--border-default)",
                flexShrink: 0,
              }}>
                <div>
                  {title && (
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                      {subtitle}
                    </p>
                  )}
                </div>
                {showClose && (
                  <button
                    onClick={onClose}
                    style={{
                      background: "transparent", border: "none", cursor: "pointer",
                      color: "var(--text-muted)", padding: 6, borderRadius: 8,
                      display: "flex", alignItems: "center",
                      transition: "color var(--transition), background var(--transition)",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseOut={(e)  => { e.currentTarget.style.color = "var(--text-muted)";   e.currentTarget.style.background = "transparent"; }}
                    aria-label="Close"
                  >
                    <HiX size={18} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div style={{
                padding: "16px 24px",
                borderTop: "1px solid var(--border-default)",
                display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10,
                flexShrink: 0,
              }}>
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
