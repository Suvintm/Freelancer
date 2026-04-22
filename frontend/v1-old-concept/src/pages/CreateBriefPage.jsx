/**
 * Create Brief Page - Professional Corporate Design
 * Includes KYC verification check before creating briefs
 */
import { useState, useEffect } from "react";
import axios from "axios";
import {
  HiArrowLeft,
  HiCurrencyRupee,
  HiClock,
  HiCalendar,
  HiLink,
  HiPlus,
  HiX,
  HiInformationCircle,
  HiCheck,
  HiClipboardList,
  HiShieldCheck,
  HiExclamation,
  HiVideoCamera,
  HiPhotograph,
  HiSparkles,
  HiDeviceMobile,
  HiFilm,
  HiFolder,
  HiCollection,
  HiFire,
  HiLightningBolt,
} from "react-icons/hi";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";

const CATEGORIES = [
  { value: "video", label: "Video Editing", icon: HiVideoCamera },
  { value: "image", label: "Image Editing", icon: HiPhotograph },
  { value: "thumbnail", label: "Thumbnails", icon: HiCollection },
  { value: "motion-graphics", label: "Motion Graphics", icon: HiSparkles },
  { value: "reel", label: "Reels", icon: HiDeviceMobile },
  { value: "short", label: "Shorts", icon: HiFilm },
  { value: "other", label: "Other", icon: HiFolder },
];

const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "expert", label: "Expert" },
  { value: "any", label: "Any Level" },
];

const CreateBriefPage = () => {
  const { backendURL, user } = useAppContext();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [kycStatus, setKycStatus] = useState(null);
  const [showKycModal, setShowKycModal] = useState(false);
  const [checkingKyc, setCheckingKyc] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget: { min: "", max: "", isNegotiable: true },
    expectedDeliveryDays: "",
    applicationDeadline: "",
    isUrgent: false,
    requirements: {
      outputFormat: "MP4 1080p",
      aspectRatio: "16:9",
      revisionsIncluded: 2,
      softwareNeeded: [],
      skillLevel: "any",
      references: [],
    },
    attachments: [],
  });

  const [errors, setErrors] = useState({});

  // Check KYC status on mount
  useEffect(() => {
    const checkKyc = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        const kyc = res.data.user?.kycStatus || "not_submitted";
        setKycStatus(kyc);
        if (kyc !== "approved") {
          setShowKycModal(true);
        }
      } catch (error) {
        console.error("KYC check failed:", error);
      } finally {
        setCheckingKyc(false);
      }
    };
    if (user?.token) checkKyc();
  }, [backendURL, user?.token]);

  // Handle form changes
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  // Handle nested field changes
  const handleNestedChange = (parent, field, value) => {
    setFormData({
      ...formData,
      [parent]: { ...formData[parent], [field]: value },
    });
  };

  // Validate step
  const validateStep = (stepNum) => {
    const newErrors = {};
    
    if (stepNum === 1) {
      if (!formData.title.trim()) newErrors.title = "Title is required";
      if (!formData.description.trim()) newErrors.description = "Description is required";
      if (formData.description.length < 50) newErrors.description = "Description must be at least 50 characters";
      if (!formData.category) newErrors.category = "Select a category";
    }
    
    if (stepNum === 2) {
      if (!formData.budget.min || formData.budget.min < 500) newErrors.budgetMin = "Minimum budget is ₹500";
      if (!formData.budget.max) newErrors.budgetMax = "Maximum budget is required";
      if (Number(formData.budget.max) < Number(formData.budget.min)) newErrors.budgetMax = "Max must be ≥ Min";
      if (!formData.expectedDeliveryDays || formData.expectedDeliveryDays < 1) newErrors.expectedDeliveryDays = "Minimum 1 day";
      if (!formData.applicationDeadline) newErrors.applicationDeadline = "Deadline is required";
      
      const deadline = new Date(formData.applicationDeadline);
      if (deadline <= new Date()) newErrors.applicationDeadline = "Must be in the future";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Next step
  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  // Submit brief
  const handleSubmit = async () => {
    if (kycStatus !== "approved") {
      setShowKycModal(true);
      return;
    }
    
    if (!validateStep(2)) return;

    try {
      setLoading(true);
      
      await axios.post(
        `${backendURL}/api/briefs`,
        {
          ...formData,
          budget: {
            min: Number(formData.budget.min),
            max: Number(formData.budget.max),
            isNegotiable: formData.budget.isNegotiable,
          },
          expectedDeliveryDays: Number(formData.expectedDeliveryDays),
        },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      toast.success("Brief posted successfully! Editors can now submit proposals.");
      navigate("/my-briefs");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create brief");
    } finally {
      setLoading(false);
    }
  };

  // Add reference URL
  const addReference = () => {
    const url = prompt("Enter reference URL (YouTube, Vimeo, etc.):");
    if (url?.trim()) {
      handleNestedChange("requirements", "references", [...formData.requirements.references, url.trim()]);
    }
  };

  // Remove reference
  const removeReference = (index) => {
    const newRefs = formData.requirements.references.filter((_, i) => i !== index);
    handleNestedChange("requirements", "references", newRefs);
  };

  // Get minimum date for deadline (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // Loading state
  if (checkingKyc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030303] light:bg-slate-50">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#030303] light:bg-slate-50 text-white light:text-slate-900 transition-colors duration-300" style={{ fontFamily: "'Inter', sans-serif" }}>
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />

      {/* KYC Modal */}
      <AnimatePresence>
        {showKycModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => kycStatus === "approved" && setShowKycModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/20">
                <HiShieldCheck className="text-3xl text-amber-400" />
              </div>
              
              <h3 className="text-xl font-semibold text-white light:text-slate-900 text-center mb-2">
                KYC Verification Required
              </h3>
              
              <p className="text-gray-400 light:text-slate-500 text-sm text-center mb-6">
                {kycStatus === "pending" 
                  ? "Your KYC is under review. You'll be notified once approved."
                  : kycStatus === "rejected"
                  ? "Your KYC was rejected. Please resubmit with valid documents."
                  : "Complete KYC verification to post briefs and hire editors."}
              </p>

              <div className="bg-[#0f0f12] light:bg-slate-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <HiInformationCircle className="text-blue-400 flex-shrink-0" />
                  <p className="text-gray-400 light:text-slate-600">
                    KYC protects both clients and editors by verifying identities.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 py-3 bg-[#0f0f12] light:bg-slate-100 border border-[#1a1a1f] light:border-slate-200 rounded-xl text-gray-400 light:text-slate-600 text-sm font-medium hover:bg-[#151518] transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={() => navigate("/client-kyc")}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <HiShieldCheck className="text-lg" />
                  {kycStatus === "pending" ? "View Status" : "Complete KYC"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 px-4 md:px-8 py-5 md:ml-64 md:mt-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-lg bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 hover:border-[#2a2a30] transition-colors"
          >
            <HiArrowLeft className="text-gray-400 light:text-slate-500" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-semibold text-white light:text-slate-900">Post a Brief</h1>
            <p className="text-gray-500 light:text-slate-500 text-xs">Describe your project and get proposals</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-6">
          {[{ num: 1, label: "Details" }, { num: 2, label: "Budget" }, { num: 3, label: "Review" }].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full text-xs font-medium transition-all ${
                step === s.num
                  ? "bg-emerald-500 text-white"
                  : step > s.num
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                  : "bg-[#0A0A0C] light:bg-slate-100 text-gray-500 light:text-slate-400 border border-[#1a1a1f] light:border-slate-200"
              }`}>
                {step > s.num ? <HiCheck className="text-sm" /> : s.num}
              </div>
              <span className={`hidden md:block ml-2 text-xs ${step >= s.num ? "text-gray-300 light:text-slate-600" : "text-gray-600 light:text-slate-400"}`}>
                {s.label}
              </span>
              {idx < 2 && (
                <div className={`w-8 md:w-12 h-0.5 mx-2 rounded ${step > s.num ? "bg-emerald-500" : "bg-[#1a1a1f] light:bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Container */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          {/* Step 1: Project Details */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Title */}
              <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 md:p-5">
                <label className="block text-xs font-medium text-gray-300 light:text-slate-700 mb-2 tracking-wide uppercase">
                  Project Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., Wedding Video Edit with Cinematic Feel"
                  maxLength={150}
                  className={`w-full bg-[#050506] light:bg-slate-50 border ${errors.title ? "border-red-500/50" : "border-[#1a1a1f] light:border-slate-200"} rounded-lg px-3 py-2.5 text-sm text-white light:text-slate-900 placeholder:text-gray-600 light:placeholder:text-slate-400 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all`}
                />
                {errors.title && <p className="text-red-400 text-xs mt-1.5">{errors.title}</p>}
                <p className="text-gray-600 text-[10px] mt-1.5">{formData.title.length}/150 characters</p>
              </div>

              {/* Description */}
              <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 md:p-5">
                <label className="block text-xs font-medium text-gray-300 light:text-slate-700 mb-2 tracking-wide uppercase">
                  Project Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe your project in detail. What style, format, and deliverables do you need?"
                  rows={5}
                  maxLength={3000}
                  className={`w-full bg-[#050506] light:bg-slate-50 border ${errors.description ? "border-red-500/50" : "border-[#1a1a1f] light:border-slate-200"} rounded-lg px-3 py-2.5 text-sm text-white light:text-slate-900 placeholder:text-gray-600 light:placeholder:text-slate-400 resize-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all`}
                />
                {errors.description && <p className="text-red-400 text-xs mt-1.5">{errors.description}</p>}
                <p className="text-gray-600 text-[10px] mt-1.5">{formData.description.length}/3000 (minimum 50)</p>
              </div>

              {/* Category */}
              <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 md:p-5">
                <label className="block text-xs font-medium text-gray-300 light:text-slate-700 mb-3 tracking-wide uppercase">
                  Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => handleChange("category", cat.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                          formData.category === cat.value
                            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                            : "bg-[#050506] light:bg-slate-50 border-[#1a1a1f] light:border-slate-200 text-gray-400 light:text-slate-600 hover:border-[#2a2a30]"
                        } border`}
                      >
                        <Icon className="text-base flex-shrink-0" />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.category && <p className="text-red-400 text-xs mt-2">{errors.category}</p>}
              </div>

              {/* References */}
              <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 md:p-5">
                <label className="block text-xs font-medium text-gray-300 light:text-slate-700 mb-1 tracking-wide uppercase">
                  Reference Links
                </label>
                <p className="text-gray-600 text-[10px] mb-3">Add YouTube or portfolio links as style reference</p>
                
                {formData.requirements.references.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {formData.requirements.references.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-[#050506] light:bg-slate-50 border border-[#1a1a1f] light:border-slate-200 rounded-lg px-3 py-2">
                        <HiLink className="text-gray-500 flex-shrink-0 text-sm" />
                        <span className="flex-1 text-xs text-gray-400 truncate">{url}</span>
                        <button onClick={() => removeReference(idx)} className="text-gray-500 hover:text-red-400 transition-colors">
                          <HiX className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={addReference}
                  className="flex items-center gap-2 px-3 py-2 bg-[#050506] light:bg-slate-50 border border-dashed border-[#2a2a30] light:border-slate-300 rounded-lg text-xs text-gray-500 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
                >
                  <HiPlus className="text-sm" /> Add Reference
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Budget & Timeline */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Budget */}
              <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 md:p-5">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-300 light:text-slate-700 mb-3 tracking-wide uppercase">
                  <HiCurrencyRupee className="text-emerald-400" />
                  Budget Range
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Minimum (₹)</label>
                    <input
                      type="number"
                      value={formData.budget.min}
                      onChange={(e) => handleNestedChange("budget", "min", e.target.value)}
                      placeholder="500"
                      min={500}
                      className={`w-full bg-[#050506] light:bg-slate-50 border ${errors.budgetMin ? "border-red-500/50" : "border-[#1a1a1f] light:border-slate-200"} rounded-lg px-3 py-2.5 text-sm text-white light:text-slate-900`}
                    />
                    {errors.budgetMin && <p className="text-red-400 text-[10px] mt-1">{errors.budgetMin}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Maximum (₹)</label>
                    <input
                      type="number"
                      value={formData.budget.max}
                      onChange={(e) => handleNestedChange("budget", "max", e.target.value)}
                      placeholder="5000"
                      className={`w-full bg-[#050506] light:bg-slate-50 border ${errors.budgetMax ? "border-red-500/50" : "border-[#1a1a1f] light:border-slate-200"} rounded-lg px-3 py-2.5 text-sm text-white light:text-slate-900`}
                    />
                    {errors.budgetMax && <p className="text-red-400 text-[10px] mt-1">{errors.budgetMax}</p>}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.budget.isNegotiable}
                    onChange={(e) => handleNestedChange("budget", "isNegotiable", e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500/30"
                  />
                  Price is negotiable
                </label>
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 md:p-5">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-300 light:text-slate-700 mb-3 tracking-wide uppercase">
                    <HiClock className="text-blue-400" />
                    Delivery Days
                  </label>
                  <input
                    type="number"
                    value={formData.expectedDeliveryDays}
                    onChange={(e) => handleChange("expectedDeliveryDays", e.target.value)}
                    placeholder="5"
                    min={1}
                    max={90}
                    className={`w-full bg-[#050506] light:bg-slate-50 border ${errors.expectedDeliveryDays ? "border-red-500/50" : "border-[#1a1a1f] light:border-slate-200"} rounded-lg px-3 py-2.5 text-sm text-white light:text-slate-900`}
                  />
                  {errors.expectedDeliveryDays && <p className="text-red-400 text-[10px] mt-1">{errors.expectedDeliveryDays}</p>}
                </div>

                <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 md:p-5">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-300 light:text-slate-700 mb-3 tracking-wide uppercase">
                    <HiCalendar className="text-purple-400" />
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) => handleChange("applicationDeadline", e.target.value)}
                    min={getMinDate()}
                    className={`w-full bg-[#050506] light:bg-slate-50 border ${errors.applicationDeadline ? "border-red-500/50" : "border-[#1a1a1f] light:border-slate-200"} rounded-lg px-3 py-2.5 text-sm text-white light:text-slate-900`}
                  />
                  {errors.applicationDeadline && <p className="text-red-400 text-[10px] mt-1">{errors.applicationDeadline}</p>}
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 md:p-5">
                <label className="block text-xs font-medium text-gray-300 light:text-slate-700 mb-3 tracking-wide uppercase">
                  Technical Requirements
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Format</label>
                    <input
                      type="text"
                      value={formData.requirements.outputFormat}
                      onChange={(e) => handleNestedChange("requirements", "outputFormat", e.target.value)}
                      placeholder="MP4 1080p"
                      className="w-full bg-[#050506] light:bg-slate-50 border border-[#1a1a1f] light:border-slate-200 rounded-lg px-3 py-2 text-xs text-white light:text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Aspect Ratio</label>
                    <select
                      value={formData.requirements.aspectRatio}
                      onChange={(e) => handleNestedChange("requirements", "aspectRatio", e.target.value)}
                      className="w-full bg-[#050506] light:bg-slate-50 border border-[#1a1a1f] light:border-slate-200 rounded-lg px-3 py-2 text-xs text-white light:text-slate-900"
                    >
                      <option value="16:9">16:9</option>
                      <option value="9:16">9:16</option>
                      <option value="1:1">1:1</option>
                      <option value="4:3">4:3</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Revisions</label>
                    <select
                      value={formData.requirements.revisionsIncluded}
                      onChange={(e) => handleNestedChange("requirements", "revisionsIncluded", Number(e.target.value))}
                      className="w-full bg-[#050506] light:bg-slate-50 border border-[#1a1a1f] light:border-slate-200 rounded-lg px-3 py-2 text-xs text-white light:text-slate-900"
                    >
                      {[0, 1, 2, 3, 5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Skill Level</label>
                    <select
                      value={formData.requirements.skillLevel}
                      onChange={(e) => handleNestedChange("requirements", "skillLevel", e.target.value)}
                      className="w-full bg-[#050506] light:bg-slate-50 border border-[#1a1a1f] light:border-slate-200 rounded-lg px-3 py-2 text-xs text-white light:text-slate-900"
                    >
                      {SKILL_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Urgent */}
              <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 md:p-5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isUrgent}
                    onChange={(e) => handleChange("isUrgent", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-orange-500 focus:ring-orange-500/30"
                  />
                  <div className="flex items-center gap-2">
                    <HiFire className="text-orange-400" />
                    <div>
                      <span className="text-sm text-white light:text-slate-900 font-medium">Mark as Urgent</span>
                      <p className="text-gray-500 text-[10px]">Appears at top of list</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-[#0A0A0C] light:bg-white border border-[#1a1a1f] light:border-slate-200 rounded-xl p-4 md:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <HiClipboardList className="text-emerald-400" />
                  <h3 className="text-sm font-medium text-white light:text-slate-900">Brief Summary</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-[#050506] light:bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 uppercase mb-1">Title</p>
                    <p className="text-sm text-white light:text-slate-900">{formData.title}</p>
                  </div>
                  
                  <div className="bg-[#050506] light:bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 uppercase mb-1">Category</p>
                    <p className="text-sm text-white light:text-slate-900 capitalize">{formData.category}</p>
                  </div>
                  
                  <div className="bg-[#050506] light:bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 uppercase mb-1">Budget</p>
                    <p className="text-sm text-emerald-400 font-medium">
                      ₹{Number(formData.budget.min).toLocaleString()} - ₹{Number(formData.budget.max).toLocaleString()}
                      {formData.budget.isNegotiable && <span className="text-gray-500 font-normal ml-1">(Negotiable)</span>}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#050506] light:bg-slate-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Delivery</p>
                      <p className="text-sm text-white light:text-slate-900">{formData.expectedDeliveryDays} days</p>
                    </div>
                    <div className="bg-[#050506] light:bg-slate-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Deadline</p>
                      <p className="text-sm text-white light:text-slate-900">
                        {new Date(formData.applicationDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  
                  {formData.isUrgent && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-center gap-2">
                      <HiFire className="text-orange-400" />
                      <span className="text-xs text-orange-400 font-medium">Marked as Urgent</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                <div className="flex gap-3">
                  <HiLightningBolt className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-emerald-400 font-medium mb-1">What happens next?</p>
                    <ul className="text-[10px] text-gray-400 space-y-0.5">
                      <li>• Your brief will be visible to all editors</li>
                      <li>• Editors submit proposals with their pricing</li>
                      <li>• You review, shortlist, and accept the best</li>
                      <li>• Payment only when you accept a proposal</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 bg-[#0A0A0C] light:bg-slate-100 border border-[#1a1a1f] light:border-slate-200 rounded-xl text-gray-400 light:text-slate-600 text-sm font-medium hover:bg-[#0f0f12] transition-colors"
              >
                Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white text-sm font-medium transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || kycStatus !== "approved"}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <HiClipboardList />
                    Post Brief
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default CreateBriefPage;
