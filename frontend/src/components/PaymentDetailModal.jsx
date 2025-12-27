// PaymentDetailModal.jsx - Full receipt view with download
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaDownload,
  FaFilePdf,
  FaImage,
  FaCheckCircle,
  FaCalendarAlt,
  FaClock,
  FaTrophy,
  FaRupeeSign,
  FaUser,
  FaUserTie,
  FaFileAlt,
  FaStar,
  FaSpinner,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "react-toastify";

const backendURL = import.meta.env.VITE_BACKEND_URL;

const PaymentDetailModal = ({ isOpen, onClose, paymentId, isEditor }) => {
  const { user } = useAppContext();
  const receiptRef = useRef(null);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(null);

  // Fetch receipt data
  useEffect(() => {
    if (isOpen && paymentId) {
      fetchReceipt();
    }
  }, [isOpen, paymentId]);

  const fetchReceipt = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${backendURL}/api/payments/${paymentId}/receipt`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setReceipt(data.receipt);
    } catch (err) {
      toast.error("Failed to load receipt");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Format date helpers
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Download as PNG
  const downloadAsPNG = async () => {
    if (!receiptRef.current) return;
    setDownloading("png");
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: "#000000",
        scale: 2,
      });
      
      const link = document.createElement("a");
      link.download = `receipt_${receipt.receiptNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("Receipt downloaded as PNG!");
    } catch (err) {
      toast.error("Failed to download receipt");
    } finally {
      setDownloading(null);
    }
  };

  // Download as PDF
  const downloadAsPDF = async () => {
    if (!receiptRef.current) return;
    setDownloading("pdf");
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: "#000000",
        scale: 2,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });
      
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`receipt_${receipt.receiptNumber}.pdf`);
      
      toast.success("Receipt downloaded as PDF!");
    } catch (err) {
      toast.error("Failed to download receipt");
    } finally {
      setDownloading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md my-8"
          >
            {/* Close Button */}
            <div className="flex justify-end mb-2">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition text-gray-400"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {loading ? (
              <div className="bg-[#1a1a1a] rounded-3xl p-8 text-center">
                <FaSpinner className="animate-spin text-4xl text-purple-500 mx-auto mb-4" />
                <p className="text-gray-400">Loading receipt...</p>
              </div>
            ) : receipt ? (
              <>
                {/* Receipt Card */}
                <div ref={receiptRef} className="relative overflow-hidden rounded-3xl">
                  {/* Gradient border */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-purple-500 to-pink-500 p-[2px] rounded-3xl" />
                  
                  {/* Receipt Content */}
                  <div className="relative bg-black rounded-3xl overflow-hidden m-[2px]">
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-emerald-900/50 to-green-900/50 px-6 py-8 text-center">
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-4 left-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl animate-pulse" />
                        <div className="absolute bottom-4 right-4 w-32 h-32 bg-green-500/10 rounded-full blur-2xl" />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3">
                          <FaCheckCircle className="text-white text-3xl" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Payment Receipt</h2>
                        <p className="text-emerald-300 text-sm mt-1">{receipt.receiptNumber}</p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 space-y-5">
                      {/* Transaction ID */}
                      <div className="text-center pb-4 border-b border-white/10">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Transaction ID</p>
                        <p className="text-white font-mono text-sm mt-1">{receipt.transactionId}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {formatDate(receipt.date)} at {formatTime(receipt.date)}
                        </p>
                      </div>

                      {/* Order Info */}
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
                            <FaFileAlt className="text-purple-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-gray-400 text-xs">Order</p>
                            <p className="text-white font-semibold truncate">{receipt.order.title}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{receipt.order.orderNumber}</p>
                          </div>
                        </div>
                      </div>

                      {/* Parties */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <FaUser className="text-blue-400 text-xs" />
                            <span className="text-gray-400 text-xs">Client</span>
                          </div>
                          <p className="text-white text-sm font-medium truncate">{receipt.client.name}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <FaUserTie className="text-orange-400 text-xs" />
                            <span className="text-gray-400 text-xs">Editor</span>
                          </div>
                          <p className="text-white text-sm font-medium truncate">{receipt.editor.name}</p>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="space-y-3">
                        <h4 className="text-gray-400 text-xs uppercase tracking-wider flex items-center gap-2">
                          <FaClock className="text-gray-500" /> Timeline
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/5 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <FaCalendarAlt className="text-cyan-400 text-xs" />
                              <span className="text-gray-400 text-xs">Created</span>
                            </div>
                            <p className="text-white text-sm">{formatDate(receipt.order.createdAt)}</p>
                          </div>
                          
                          <div className="bg-white/5 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <FaCheckCircle className="text-emerald-400 text-xs" />
                              <span className="text-gray-400 text-xs">Completed</span>
                            </div>
                            <p className="text-white text-sm">{formatDate(receipt.order.completedAt)}</p>
                          </div>
                        </div>

                        {/* On-time Badge */}
                        <div className={`rounded-xl p-3 ${
                          receipt.order.onTime 
                            ? 'bg-emerald-500/10 border border-emerald-500/20' 
                            : 'bg-orange-500/10 border border-orange-500/20'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FaTrophy className={receipt.order.onTime ? 'text-emerald-400' : 'text-orange-400'} />
                              <span className="text-white text-sm font-medium">
                                {receipt.order.onTime ? 'Delivered On Time!' : 'Delivered Late'}
                              </span>
                            </div>
                            <span className={`text-sm font-bold ${
                              receipt.order.onTime ? 'text-emerald-400' : 'text-orange-400'
                            }`}>
                              {receipt.order.onTime 
                                ? `${receipt.order.daysBeforeDeadline} days early` 
                                : `${Math.abs(receipt.order.daysBeforeDeadline)} days late`
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Breakdown */}
                      <div className="space-y-3">
                        <h4 className="text-gray-400 text-xs uppercase tracking-wider flex items-center gap-2">
                          <FaRupeeSign className="text-gray-500" /> Payment Details
                        </h4>
                        
                        <div className="bg-white/5 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Order Amount</span>
                            <span className="text-white font-medium">₹{receipt.payment.amount?.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Platform Fee ({
                              receipt.payment.platformFeePercentage || (receipt.payment.amount > 0 
                                ? Math.round((receipt.payment.platformFee / receipt.payment.amount) * 100) 
                                : 10)
                            }%)</span>
                            <span className="text-red-400">-₹{receipt.payment.platformFee?.toLocaleString()}</span>
                          </div>
                          <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                            <span className="text-white font-medium">Editor Earnings</span>
                            <span className="text-emerald-400 font-bold text-lg">₹{receipt.payment.editorEarning?.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-2 py-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-emerald-400 text-sm font-medium">Payment Released</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6">
                      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 text-center border border-purple-500/20">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <FaStar className="text-yellow-400 text-sm" />
                          <span className="text-white font-medium text-sm">{receipt.platform.name}</span>
                          <FaStar className="text-yellow-400 text-sm" />
                        </div>
                        <p className="text-gray-400 text-xs">{receipt.platform.supportEmail}</p>
                      </div>
                    </div>

                    {/* Receipt edge */}
                    <div className="flex justify-center">
                      <div className="flex gap-1.5 py-2">
                        {[...Array(20)].map((_, i) => (
                          <div key={i} className="w-2 h-2 bg-gray-800 rounded-full" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Download Buttons */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={downloadAsPNG}
                    disabled={downloading}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                  >
                    {downloading === "png" ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <>
                        <FaImage />
                        Download PNG
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={downloadAsPDF}
                    disabled={downloading}
                    className="flex-1 py-3 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                  >
                    {downloading === "pdf" ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <>
                        <FaFilePdf />
                        Download PDF
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentDetailModal;
