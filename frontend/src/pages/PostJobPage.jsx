/**
 * PostJobPage - Form for clients to create job postings
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineBriefcase,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineArrowLeft,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineCheck,
  HiOutlineXMark,
} from "react-icons/hi2";
import { FaBolt } from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import ClientSidebar from "../components/ClientSidebar.jsx";
import ClientNavbar from "../components/ClientNavbar.jsx";
import axios from "axios";
import { toast } from "react-toastify";

// Options
const CATEGORIES = [
  { value: "youtube", label: "YouTube" },
  { value: "instagram-reels", label: "Instagram Reels" },
  { value: "shorts", label: "Shorts" },
  { value: "wedding", label: "Wedding" },
  { value: "corporate", label: "Corporate" },
  { value: "music-video", label: "Music Video" },
  { value: "podcast", label: "Podcast" },
  { value: "documentary", label: "Documentary" },
  { value: "ads", label: "Ads" },
  { value: "social-media", label: "Social Media" },
  { value: "other", label: "Other" },
];

const SKILLS = [
  { value: "premiere-pro", label: "Premiere Pro" },
  { value: "after-effects", label: "After Effects" },
  { value: "davinci-resolve", label: "DaVinci Resolve" },
  { value: "final-cut", label: "Final Cut Pro" },
  { value: "capcut", label: "CapCut" },
  { value: "motion-graphics", label: "Motion Graphics" },
  { value: "color-grading", label: "Color Grading" },
  { value: "sound-design", label: "Sound Design" },
  { value: "vfx", label: "VFX" },
  { value: "3d-animation", label: "3D Animation" },
  { value: "thumbnail-design", label: "Thumbnail Design" },
];

const EXPERIENCE_LEVELS = [
  { value: "fresher", label: "Fresher (0-1 year)" },
  { value: "1-3-years", label: "1-3 Years" },
  { value: "3-5-years", label: "3-5 Years" },
  { value: "5-plus-years", label: "5+ Years (Expert)" },
];

const WORK_TYPES = [
  { value: "remote", label: "Remote" },
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
];

const HIRING_ROUNDS = [
  { value: 1, label: "1 Round (Direct Hire)", names: ["Direct Hire"] },
  { value: 2, label: "2 Rounds", names: ["Screening", "Final Selection"] },
  { value: 3, label: "3 Rounds", names: ["Screening", "Trial/Interview", "Final Selection"] },
];

const PostJobPage = () => {
  const navigate = useNavigate();
  const { user, backendURL } = useAppContext();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    skillsRequired: [],
    experienceLevel: "fresher",
    workType: "remote",
    location: { city: "", state: "" },
    budget: { min: "", max: "", type: "fixed" },
    hiringRounds: 1,
    applicationDeadline: "",
    isUrgent: false,
    maxApplicants: 50,
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skillsRequired: prev.skillsRequired.includes(skill)
        ? prev.skillsRequired.filter(s => s !== skill)
        : [...prev.skillsRequired, skill],
    }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.title.trim()) {
        toast.error("Job title is required");
        return false;
      }
      if (!formData.description.trim()) {
        toast.error("Job description is required");
        return false;
      }
      if (!formData.category) {
        toast.error("Category is required");
        return false;
      }
    }
    if (step === 2) {
      if (!formData.budget.min || !formData.budget.max) {
        toast.error("Budget range is required");
        return false;
      }
      if (Number(formData.budget.min) > Number(formData.budget.max)) {
        toast.error("Minimum budget cannot be greater than maximum");
        return false;
      }
      if (!formData.applicationDeadline) {
        toast.error("Application deadline is required");
        return false;
      }
      if (new Date(formData.applicationDeadline) <= new Date()) {
        toast.error("Deadline must be in the future");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    try {
      setSubmitting(true);
      
      const roundConfig = HIRING_ROUNDS.find(r => r.value === formData.hiringRounds);
      
      const jobData = {
        ...formData,
        budget: {
          min: Number(formData.budget.min),
          max: Number(formData.budget.max),
          type: formData.budget.type,
        },
        roundNames: roundConfig?.names || ["Direct Hire"],
      };

      const res = await axios.post(
        `${backendURL}/api/jobs`,
        jobData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      toast.success("Job posted successfully!");
      navigate(`/jobs/${res.data.job._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#09090B] text-white">
      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ClientNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 px-4 md:px-8 py-6 pt-20 md:pt-6 md:ml-64 md:mt-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-700 transition-all"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Post a Job</h1>
            <p className="text-xs text-zinc-500">Find the perfect video editor for your project</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? "bg-indigo-500 text-white"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {step > s ? <HiOutlineCheck className="w-4 h-4" /> : s}
              </div>
              <span className={`text-xs ${step >= s ? "text-white" : "text-zinc-500"}`}>
                {s === 1 ? "Details" : s === 2 ? "Budget & Deadline" : "Review"}
              </span>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-indigo-500" : "bg-zinc-800"}`} />}
            </div>
          ))}
        </div>

        {/* Form */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Step 1: Basic Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-[#111118] border border-zinc-800/50 rounded-xl p-6">
                <h2 className="text-sm font-semibold uppercase text-zinc-500 mb-4">Job Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Job Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      placeholder="e.g., Looking for YouTube Video Editor"
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Description *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      placeholder="Describe the job requirements, deliverables, and expectations..."
                      rows={6}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleChange("category", e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Skills Required</label>
                    <div className="flex flex-wrap gap-2">
                      {SKILLS.map(skill => (
                        <button
                          key={skill.value}
                          type="button"
                          onClick={() => handleSkillToggle(skill.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            formData.skillsRequired.includes(skill.value)
                              ? "bg-indigo-500 text-white"
                              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                          }`}
                        >
                          {skill.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1.5">Experience Level</label>
                      <select
                        value={formData.experienceLevel}
                        onChange={(e) => handleChange("experienceLevel", e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {EXPERIENCE_LEVELS.map(exp => (
                          <option key={exp.value} value={exp.value}>{exp.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1.5">Work Type</label>
                      <select
                        value={formData.workType}
                        onChange={(e) => handleChange("workType", e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {WORK_TYPES.map(wt => (
                          <option key={wt.value} value={wt.value}>{wt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formData.workType !== "remote" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">City</label>
                        <input
                          type="text"
                          value={formData.location.city}
                          onChange={(e) => handleChange("location", { ...formData.location, city: e.target.value })}
                          placeholder="e.g., Mumbai"
                          className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1.5">State</label>
                        <input
                          type="text"
                          value={formData.location.state}
                          onChange={(e) => handleChange("location", { ...formData.location, state: e.target.value })}
                          placeholder="e.g., Maharashtra"
                          className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => validateStep() && setStep(2)}
                  className="px-6 py-3 bg-indigo-500 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Budget & Settings */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-[#111118] border border-zinc-800/50 rounded-xl p-6">
                <h2 className="text-sm font-semibold uppercase text-zinc-500 mb-4">Budget & Deadline</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Budget Type</label>
                    <div className="flex gap-2">
                      {["fixed", "monthly", "per-video"].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleChange("budget", { ...formData.budget, type })}
                          className={`px-4 py-2 rounded-lg text-xs font-medium capitalize ${
                            formData.budget.type === type
                              ? "bg-indigo-500 text-white"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {type.replace("-", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1.5">Minimum Budget (₹) *</label>
                      <input
                        type="number"
                        value={formData.budget.min}
                        onChange={(e) => handleChange("budget", { ...formData.budget, min: e.target.value })}
                        placeholder="5000"
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1.5">Maximum Budget (₹) *</label>
                      <input
                        type="number"
                        value={formData.budget.max}
                        onChange={(e) => handleChange("budget", { ...formData.budget, max: e.target.value })}
                        placeholder="15000"
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Application Deadline *</label>
                    <input
                      type="date"
                      value={formData.applicationDeadline}
                      onChange={(e) => handleChange("applicationDeadline", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Hiring Rounds</label>
                    <select
                      value={formData.hiringRounds}
                      onChange={(e) => handleChange("hiringRounds", Number(e.target.value))}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {HIRING_ROUNDS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Max Applicants</label>
                    <input
                      type="number"
                      value={formData.maxApplicants}
                      onChange={(e) => handleChange("maxApplicants", Number(e.target.value))}
                      min={10}
                      max={500}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isUrgent}
                      onChange={(e) => handleChange("isUrgent", e.target.checked)}
                      className="w-4 h-4 rounded border-amber-500 text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-amber-400 flex items-center gap-1">
                        <FaBolt className="w-3 h-3" /> Mark as Urgent
                      </span>
                      <p className="text-[10px] text-amber-400/70">Urgent jobs appear at the top and get more visibility</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-zinc-800 rounded-lg text-sm font-semibold hover:bg-zinc-700 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => validateStep() && setStep(3)}
                  className="px-6 py-3 bg-indigo-500 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-[#111118] border border-zinc-800/50 rounded-xl p-6">
                <h2 className="text-sm font-semibold uppercase text-zinc-500 mb-4">Review Your Job</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{formData.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-medium rounded-full capitalize">
                          {formData.category?.replace("-", " ")}
                        </span>
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-medium rounded-full capitalize">
                          {formData.workType}
                        </span>
                        {formData.isUrgent && (
                          <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <FaBolt className="w-2 h-2" /> URGENT
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">
                        ₹{Number(formData.budget.min).toLocaleString()} - ₹{Number(formData.budget.max).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-zinc-500 capitalize">{formData.budget.type}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800/50">
                    <p className="text-sm text-zinc-400 whitespace-pre-wrap">{formData.description}</p>
                  </div>

                  {formData.skillsRequired.length > 0 && (
                    <div className="pt-4 border-t border-zinc-800/50">
                      <p className="text-xs text-zinc-500 mb-2">Skills Required</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.skillsRequired.map(skill => (
                          <span key={skill} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-medium rounded">
                            {SKILLS.find(s => s.value === skill)?.label || skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-zinc-800/50 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-[10px] text-zinc-500 mb-1">Experience</p>
                      <p className="text-xs font-medium capitalize">{formData.experienceLevel?.replace("-", " ")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 mb-1">Deadline</p>
                      <p className="text-xs font-medium">{new Date(formData.applicationDeadline).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 mb-1">Hiring Rounds</p>
                      <p className="text-xs font-medium">{formData.hiringRounds} Round{formData.hiringRounds > 1 ? "s" : ""}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 mb-1">Max Applicants</p>
                      <p className="text-xs font-medium">{formData.maxApplicants}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                <p className="text-xs text-indigo-400">
                  <HiOutlineSparkles className="w-3 h-3 inline mr-1" />
                  Your job will be visible to all editors on Suvix. You'll receive notifications when editors apply.
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-zinc-800 rounded-lg text-sm font-semibold hover:bg-zinc-700 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <HiOutlineBriefcase className="w-4 h-4" /> Post Job
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default PostJobPage;
