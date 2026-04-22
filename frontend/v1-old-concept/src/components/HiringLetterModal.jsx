import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiXMark, HiArrowDownTray, HiPrinter } from "react-icons/hi2";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";

const HiringLetterModal = ({ isOpen, onClose, job, application, clientName, editorName }) => {
  const letterRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!letterRef.current) return;
    
    try {
      setDownloading(true);
      const canvas = await html2canvas(letterRef.current, {
        scale: 2, // Higher quality
        useCORS: true, 
        backgroundColor: "#ffffff",
        windowWidth: 1200, // Force desktop width for capture
        onclone: (clonedDoc) => {
          // Force the cloned element to have fixed desktop width for A4 consistency
          const element = clonedDoc.querySelector("[data-print-target='true']");
          if (element) {
            element.style.width = "800px";
            element.style.padding = "48px"; // p-12 equivalent
          }
        }
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `SuviX_Hiring_Letter_${editorName.replace(/\s+/g, "_")}.png`;
      link.click();
      
      toast.success("Letter downloaded successfully!");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download letter");
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-zinc-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Actions */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
            <h3 className="text-lg font-bold text-white">Hiring Confirmation Letter</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs md:text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {downloading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <HiArrowDownTray className="w-4 h-4" />
                )}
                <span className="hidden md:inline">Download</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <HiXMark className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Letter Content Wrapper */}
          <div className="p-4 md:p-8 bg-zinc-800/50 flex justify-center">
            {/* The actual letter */}
            <div
              ref={letterRef}
              data-print-target="true"
              className="bg-white w-full max-w-[800px] shadow-2xl p-6 md:p-12"
              style={{
                minHeight: "auto", 
                fontFamily: "'Times New Roman', serif",
                backgroundColor: "#ffffff",
                color: "#1e293b",
                // Reset standard styles to ensure html2canvas captures explicit values
              }}
            >
              {/* Letter Header */}
              <div 
                className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-8 pb-6 gap-4 md:gap-0"
                style={{ borderBottom: "2px solid #1e293b" }}
              >
                <div className="flex items-center md:block">
                  <img src="/logo.png" alt="SuviX Logo" className="h-10 md:h-12 w-auto mb-2" />
                  <p 
                    className="text-[10px] md:text-xs font-sans tracking-widest pl-1 hidden md:block"
                    style={{ color: "#64748b" }}
                  >
                    PREMIUM FREELANCE PLATFORM
                  </p>
                </div>
                <div className="text-left md:text-right w-full md:w-auto">
                  <h1 
                    className="text-xl md:text-2xl font-bold uppercase tracking-wide"
                    style={{ color: "#0f172a" }}
                  >
                    Hiring Confirmation
                  </h1>
                  <div className="flex md:block justify-between mt-1">
                    <p className="text-xs md:text-sm" style={{ color: "#64748b" }}>Ref: {application._id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs md:text-sm" style={{ color: "#64748b" }}>Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Letter Body */}
              <div className="space-y-4 md:space-y-6 leading-relaxed text-sm md:text-base" style={{ color: "#1e293b" }}>
                <div>
                  <p><strong>To:</strong> {editorName}</p>
                  <p><strong>Subject:</strong> Official Confirmation of Hiring for Project "{job.title}"</p>
                </div>

                <p>Dear {editorName.split(" ")[0]},</p>

                <p>
                  We are pleased to confirm that <strong>{clientName}</strong> has successfully hired you for the project 
                  <strong> "{job.title}"</strong> through the SuviX platform. This letter serves as an official record of the connection establishment.
                </p>

                {/* Project Details Box */}
                <div 
                  className="p-4 md:p-6 rounded-lg my-4 md:my-6"
                  style={{ 
                    backgroundColor: "#f8fafc", 
                    border: "1px solid #e2e8f0" 
                  }}
                >
                  <h3 
                    className="text-base md:text-lg font-bold mb-4 uppercase text-xs tracking-wider"
                    style={{ 
                      color: "#334155", 
                      borderBottom: "1px solid #e2e8f0", 
                      paddingBottom: "8px" 
                    }}
                  >
                    Project Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 md:gap-y-4 gap-x-8 text-sm">
                    <div>
                      <span className="block text-xs uppercase font-bold" style={{ color: "#64748b" }}>Client Name</span>
                      <span className="font-semibold text-base md:text-lg">{clientName}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold" style={{ color: "#64748b" }}>Category</span>
                      <span className="font-semibold capitalize">{job.category?.replace("-", " ")}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold" style={{ color: "#64748b" }}>Hired On</span>
                      <span className="font-semibold">{new Date(application.hiredAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold" style={{ color: "#64748b" }}>Agreed Amount</span>
                      <span className="font-semibold text-base md:text-lg" style={{ color: "#059669" }}>
                        ₹{application.expectedRate?.toLocaleString() || job.budget?.min?.toLocaleString()} 
                        <span className="text-xs font-normal ml-1" style={{ color: "#94a3b8" }}>({job.budget?.type})</span>
                      </span>
                    </div>
                  </div>
                </div>

                <p>
                  <strong>Terms & Conditions:</strong><br/>
                  SuviX acts as the facilitator for this connection. All project deliverables, timelines, revisions, and payments are to be handled directly between the Client and the Editor as per their mutual agreement. SuviX is not liable for any disputes arising from this engagement.
                </p>

                <div 
                  className="flex gap-2 items-start mt-4 p-3 md:p-4 rounded text-xs md:text-sm"
                  style={{ 
                    backgroundColor: "#eff6ff", 
                    color: "#1e40af", 
                    borderLeft: "4px solid #3b82f6" 
                  }}
                >
                  <span>ℹ️</span>
                  <p>
                    Please save this document for your records. You can now contact the client directly using the contact details provided in your dashboard.
                  </p>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-12 md:mt-20 flex flex-col md:flex-row justify-between items-center md:items-end gap-8 pt-8">
                <div className="text-center w-48 md:w-64">
                  <div 
                    className="mb-2 pb-2 text-xl md:text-2xl" 
                    style={{ 
                      fontFamily: "cursive", 
                      color: "#475569", 
                      borderBottom: "1px solid #cbd5e1" 
                    }}
                  >
                    {clientName}
                  </div>
                  <p className="text-[10px] md:text-xs uppercase tracking-wider font-bold" style={{ color: "#64748b" }}>Client Signature</p>
                </div>
                <div className="text-center w-48 md:w-64">
                  <div 
                    className="mb-2 pb-2 text-xl md:text-2xl" 
                    style={{ 
                      fontFamily: "cursive", 
                      color: "#475569", 
                      borderBottom: "1px solid #cbd5e1" 
                    }}
                  >
                    SuviX Platform
                  </div>
                  <p className="text-[10px] md:text-xs uppercase tracking-wider font-bold" style={{ color: "#64748b" }}>Verified Facilitator</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-12 md:mt-20 pt-6 text-center" style={{ borderTop: "1px solid #f1f5f9" }}>
                <p className="text-[10px] md:text-xs" style={{ color: "#94a3b8" }}>Generated by SuviX Platform • {new Date().toLocaleString()}</p>
                <p className="text-[10px] md:text-xs mt-1" style={{ color: "#94a3b8" }}>www.suvix.com | support@suvix.com</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HiringLetterModal;
