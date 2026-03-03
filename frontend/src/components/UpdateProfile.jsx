import { useEffect, useState } from "react";
import axios from "axios";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineAcademicCap,
  HiOutlineLanguage,
  HiOutlineCloudArrowUp,
  HiOutlineShieldCheck,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineDevicePhoneMobile,
  HiOutlineBriefcase,
  HiOutlineSparkles,
} from "react-icons/hi2";
import countryList from "react-select-country-list";
import Select from "react-select";
import { PageLoader } from "./LoadingSpinner.jsx";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import AvailabilitySelector from "./AvailabilitySelector";
import { 
  FaYoutube, 
  FaInstagram, 
  FaTiktok, 
  FaSquareXTwitter, 
  FaLinkedin 
} from "react-icons/fa6";
import { 
  HiOutlineLink,
} from "react-icons/hi2";

import premiereIcon from "../assets/preimerepro.png";
import aeIcon from "../assets/adobeexpress.png";
import davinciIcon from "../assets/davinci.png";
import capcutIcon from "../assets/capcut.png";
import fcpxIcon from "../assets/FCPX.png";
import photoshopIcon from "../assets/photoshop.png";
import canvaIcon from "../assets/canvalogo.png";
import vnIcon from "../assets/Vnlogo.png";


const UpdateProfile = ({ languagesOptions = [] }) => {
  const { user, backendURL } = useAppContext();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [countries, setCountries] = useState([]);
  const { isDark } = useTheme();
  const [customSoftwareInput, setCustomSoftwareInput] = useState("");

  const [formData, setFormData] = useState({
    about: "",
    experience: "",
    contactEmail: "",
    country: "",
    skillInput: "",
    skills: [],
    languageInput: "",
    languages: [],
    certifications: [],
    existingCertifications: [],
    manualApproval: user?.followSettings?.manualApproval || false,
    softwares: [],
    socialLinks: {
      youtube: "",
      instagram: "",
      tiktok: "",
      twitter: "",
      linkedin: ""
    }
  });

  useEffect(() => {
    setCountries(countryList().getData());
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${backendURL}/api/profile`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const p = res.data.profile;
      setProfile(p);
      setFormData((prev) => ({
        ...prev,
        about: p?.about || "",
        experience: p?.experience || "",
        contactEmail: p?.contactEmail || "",
        country: p?.location?.country || "",
        skills: p?.skills?.filter(Boolean) || [],
        languages: p?.languages?.filter(Boolean) || [],
        certifications:
          p?.certifications?.filter((c) => c?.image) || [],
        existingCertifications:
          p?.certifications?.filter((c) => c?.image) || [],
        manualApproval: p?.user?.followSettings?.manualApproval || false,
        softwares: p?.softwares || [],
        socialLinks: {
          youtube: p?.socialLinks?.youtube || "",
          instagram: p?.socialLinks?.instagram || "",
          tiktok: p?.socialLinks?.tiktok || "",
          twitter: p?.socialLinks?.twitter || "",
          linkedin: p?.socialLinks?.linkedin || ""
        }
      }));
    } catch (err) {
      console.error("Error fetching profile:", err);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCountryChange = (selected) =>
    setFormData({ ...formData, country: selected.label });

  const addSkill = () => {
    const skill = formData.skillInput.trim();
    if (skill && !formData.skills.includes(skill)) {
      if (formData.skills.length >= 20) {
        toast.warning("Maximum 20 skills allowed");
        return;
      }
      setFormData({
        ...formData,
        skills: [...formData.skills, skill],
        skillInput: "",
      });
    }
  };

  const removeSkill = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const addLanguage = () => {
    const lang = formData.languageInput.trim();
    if (lang && !formData.languages.includes(lang)) {
      if (formData.languages.length >= 10) {
        toast.warning("Maximum 10 languages allowed");
        return;
      }
      setFormData({
        ...formData,
        languages: [...formData.languages, lang],
        languageInput: "",
      });
    }
  };

  // Toggle from quick-select list
  const toggleLanguageFromOptions = (lang) => {
    if (formData.languages.includes(lang)) {
      // remove
      setFormData({
        ...formData,
        languages: formData.languages.filter((l) => l !== lang),
      });
    } else {
      // add (respect max 10)
      if (formData.languages.length >= 10) {
        toast.warning("Maximum 10 languages allowed");
        return;
      }
      setFormData({
        ...formData,
        languages: [...formData.languages, lang],
      });
    }
  };

  const removeLanguage = (lang) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter((l) => l !== lang),
    });
  };

  const handleCertUpload = (e) => {
    const files = Array.from(e.target.files);
    const totalCerts =
      formData.existingCertifications.length +
      formData.certifications.length;

    if (totalCerts + files.length > 10) {
      toast.warning("Maximum 10 certifications allowed");
      return;
    }

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 5MB per file.`);
        return false;
      }
      return true;
    });

    setFormData({
      ...formData,
      certifications: [...formData.certifications, ...validFiles],
    });
  };

  const removeCert = (index, type = "local") => {
    if (type === "local") {
      const updated = [...formData.certifications];
      updated.splice(index, 1);
      setFormData({ ...formData, certifications: updated });
    } else {
      const updated = [...formData.existingCertifications];
      updated.splice(index, 1);
      setFormData({ ...formData, existingCertifications: updated });
    }
  };

  const isFormValid =
    formData.about.trim() &&
    (user?.role === 'client' || formData.experience.trim()) &&
    formData.contactEmail.trim() &&
    formData.country.trim() &&
    (user?.role === 'client' || formData.skills.length > 0) &&
    formData.languages.length > 0;

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error("Please fill all required fields!");
      return;
    }

    console.log("Saving softwares:", formData.softwares);
    const softwaresPayload = JSON.stringify(formData.softwares);
    console.log("Softwares Payload String:", softwaresPayload);

    try {
      setUpdating(true);
      const formPayload = new FormData();
      formPayload.append("about", formData.about);
      formPayload.append("experience", formData.experience);
      formPayload.append("contactEmail", formData.contactEmail);
      formPayload.append("country", formData.country);
      formPayload.append("skills", formData.skills.join(","));
      formPayload.append("languages", formData.languages.join(","));
      formPayload.append("followSettings", JSON.stringify({ manualApproval: formData.manualApproval }));
      formPayload.append("softwares", JSON.stringify(formData.softwares));
      formPayload.append("socialLinks", JSON.stringify(formData.socialLinks));

      formData.certifications.forEach((file) => {
        formPayload.append("certifications", file);
      });

      const res = await axios.put(`${backendURL}/api/profile`, formPayload, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Profile updated successfully!");
      setProfile(res.data.profile);

      setFormData((prev) => ({
        ...prev,
        softwares: res.data.profile.softwares || [],
        certifications: [],
        existingCertifications:
          res.data.profile.certifications?.filter((c) => c?.image) || [],
      }));
    } catch (err) {
      console.error("Update failed:", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    }
  };

  const experienceOptions = [
    "0-6 months",
    "6-12 months",
    "1-2 years",
    "2-3 years",
    "3-5 years",
    "5+ years",
  ];

  const SOFTWARES_LIST = [
    { name: "Premiere Pro", icon: premiereIcon, color: "#9999FF", isImage: true },
    { name: "After Effects", icon: aeIcon, color: "#CF96FD", isImage: true },
    { name: "DaVinci Resolve", icon: davinciIcon, color: "#32A5D5", isImage: true },
    { name: "CapCut", icon: capcutIcon, color: "#FFFFFF", isImage: true },
    { name: "FCPX", icon: fcpxIcon, color: "#3B3B3B", isImage: true },
    { name: "Photoshop", icon: photoshopIcon, color: "#31A8FF", isImage: true },
    { name: "Canva", icon: canvaIcon, color: "#00C4CC", isImage: true },
    { name: "VN Editor", icon: vnIcon, color: "#FFDE59", isImage: true },
  ];

  const SOCIAL_PLATFORMS = [
    { id: "youtube", label: "YouTube", icon: FaYoutube, color: "#FF0000" },
    { id: "instagram", label: "Instagram", icon: FaInstagram, color: "#E4405F" },
    { id: "tiktok", label: "TikTok", icon: FaTiktok, color: "#FFFFFF" },
    { id: "twitter", label: "X / Twitter", icon: FaSquareXTwitter, color: "#FFFFFF" },
    { id: "linkedin", label: "LinkedIn", icon: FaLinkedin, color: "#0A66C2" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const SectionHeader = ({ icon: Icon, title, subtitle, simple }) => (
    <div className={`flex items-center gap-3 ${simple ? "mb-4" : "mb-6"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
        simple 
        ? (isDark ? "bg-white/10 text-white" : "bg-zinc-900 text-white")
        : (isDark ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border border-emerald-100")
      }`}>
        <Icon className={simple ? "w-4 h-4" : "w-5 h-5"} />
      </div>
      <div>
        <h3 className={`${simple ? "text-sm" : "text-base"} font-black tracking-tight ${isDark ? "text-white" : "text-zinc-900"}`}>{title}</h3>
        <p className={`${simple ? "text-[8px]" : "text-[10px]"} font-bold uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>{subtitle}</p>
      </div>
    </div>
  );

  const InputWrapper = ({ label, required, children, error }) => (
    <div className="space-y-2">
      <label className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
        {label} {required && <span className="text-emerald-500">*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] text-red-500 font-bold">{error}</p>}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-20" style={{ fontFamily: "'Inter', sans-serif" }}>
      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Left Column: Basic Info & Social */}
          <div className="space-y-6">
            {/* Availability & Account Status - NEW */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-0 transition-all"
            >
              <SectionHeader simple icon={HiOutlineShieldCheck} title="Availability & Access" subtitle="Sync with sidebar" />
              <div className="flex items-center justify-between p-4 rounded-2xl border bg-black/20 border-white/5">
                <div>
                  <h4 className="text-sm font-black text-white">Editor Availability</h4>
                  <p className="text-[10px] text-zinc-500 font-medium mt-1">Updates both here and Sidebar</p>
                </div>
                <AvailabilitySelector />
              </div>
            </motion.div>

            {/* Basic Info Card - Simple Version */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-0 transition-all"
            >
              <SectionHeader simple icon={HiOutlineUser} title="Basic Information" subtitle="Your public identity" />
              
              <div className="space-y-6">
                <InputWrapper label="About Me" required>
                  <textarea
                    name="about"
                    value={formData.about}
                    onChange={handleChange}
                    rows="5"
                    maxLength={1000}
                    className={`w-full p-4 rounded-2xl border text-sm transition-all outline-none resize-none ${isDark ? "bg-black/40 border-white/5 text-white focus:border-emerald-500/50" : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-emerald-500"}`}
                    placeholder="Describe your editing style, niche, and what makes you unique..."
                  />
                  <div className={`text-[10px] text-right font-bold ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
                    {formData.about.length}/1000
                  </div>
                </InputWrapper>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputWrapper label="Contact Email" required>
                    <div className="relative">
                      <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                      <input
                        type="email"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm transition-all outline-none ${isDark ? "bg-black/40 border-white/5 text-white focus:border-emerald-500/50" : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-emerald-500"}`}
                        placeholder="Public email"
                      />
                    </div>
                  </InputWrapper>

                  <InputWrapper label="Country" required>
                    <Select
                      options={countries}
                      value={formData.country ? { label: formData.country, value: formData.country } : null}
                      onChange={handleCountryChange}
                      classNamePrefix="select"
                      placeholder="Select..."
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: "1rem",
                          padding: "4px",
                          backgroundColor: isDark ? "rgba(0,0,0,0.4)" : "#f9fafb",
                          borderColor: state.isFocused ? "#10b981" : isDark ? "rgba(255,255,255,0.05)" : "#e5e7eb",
                          color: isDark ? "white" : "#18181b",
                          fontSize: "14px",
                          boxShadow: "none",
                          "&:hover": { borderColor: "#10b981" }
                        }),
                        menu: (base) => ({
                          ...base,
                          backgroundColor: isDark ? "#18181b" : "white",
                          borderRadius: "1rem",
                          overflow: "hidden",
                          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb"
                        }),
                        option: (base, { isFocused, isSelected }) => ({
                          ...base,
                          backgroundColor: isSelected ? "#10b981" : isFocused ? (isDark ? "#27272a" : "#f4f4f5") : "transparent",
                          color: isSelected ? "white" : isDark ? "#e4e4e7" : "#3f3f46",
                          cursor: "pointer"
                        }),
                        singleValue: (base) => ({
                          ...base,
                          color: isDark ? "white" : "#18181b"
                        })
                      }}
                    />
                  </InputWrapper>
                </div>
              </div>
            </motion.div>

            {/* Social Presence Card - NEW */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-0 transition-all"
            >
              <SectionHeader simple icon={HiOutlineGlobeAlt} title="Social Presence" subtitle="Connect your platforms" />
              <div className="grid grid-cols-1 gap-4">
                {SOCIAL_PLATFORMS.map((platform) => (
                  <div key={platform.id} className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <platform.icon className={`w-4 h-4 transition-colors group-focus-within:text-emerald-500`} style={{ color: platform.color }} />
                    </div>
                    <input
                      type="text"
                      placeholder={`${platform.label} profile URL...`}
                      value={formData.socialLinks[platform.id]}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, [platform.id]: e.target.value }
                      })}
                      className={`w-full pl-12 pr-4 py-3 rounded-2xl border text-sm transition-all outline-none ${isDark ? "bg-black/40 border-white/5 text-white focus:border-emerald-500/50" : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-emerald-500"}`}
                    />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Privacy & Settings - Simple Version */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-0 transition-all"
            >
              <SectionHeader simple icon={HiOutlineShieldCheck} title="Privacy & Social" subtitle="Management controls" />
              
              <div className="space-y-6">
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? "bg-black/20 border-white/5" : "bg-zinc-50 border-zinc-100"}`}>
                  <div>
                    <h4 className={`text-sm font-black ${isDark ? "text-white" : "text-zinc-900"}`}>Manual Follow Approval</h4>
                    <p className={`text-[10px] font-medium leading-relaxed mt-1 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                      Require approval for all follow requests
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, manualApproval: !formData.manualApproval })}
                    className={`w-12 h-6 rounded-full p-1 transition-all ${formData.manualApproval ? "bg-emerald-500" : (isDark ? "bg-zinc-800" : "bg-zinc-300")}`}
                  >
                    <motion.div 
                      animate={{ x: formData.manualApproval ? 24 : 0 }}
                      className="w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                {user?.role === 'editor' && (
                  <InputWrapper label="Experience Level" required>
                    <div className="grid grid-cols-2 gap-2">
                      {experienceOptions.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setFormData({ ...formData, experience: opt })}
                          className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${formData.experience === opt 
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                            : (isDark ? "bg-black/40 border-white/5 text-zinc-400 hover:border-white/10" : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300")
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </InputWrapper>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Skills & Portfolio */}
          <div className="space-y-6">
            {/* Professional Tools - NEW */}
            {user?.role === 'editor' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-0 transition-all"
              >
                <SectionHeader simple icon={HiOutlineBriefcase} title="Professional Tools" subtitle="Your creative arsenal" />
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
                  {SOFTWARES_LIST.map((tool) => (
                    <button
                      key={tool.name}
                      type="button"
                      onClick={() => {
                        const isSelected = formData.softwares.includes(tool.name);
                        setFormData({
                          ...formData,
                          softwares: isSelected 
                            ? formData.softwares.filter(t => t !== tool.name)
                            : [...formData.softwares, tool.name]
                        });
                      }}
                      className={`relative aspect-square flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                        formData.softwares.includes(tool.name)
                        ? "bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10"
                        : "bg-black/20 border-white/5 hover:border-white/10"
                      }`}
                    >
                      {tool.isImage ? (
                        <img 
                          src={tool.icon} 
                          className={`w-8 h-8 mb-2 object-contain transition-transform ${formData.softwares.includes(tool.name) ? "scale-110" : "grayscale opacity-50"}`} 
                          alt={tool.name}
                        />
                      ) : (
                        <tool.icon 
                          className={`w-8 h-8 mb-2 transition-transform ${formData.softwares.includes(tool.name) ? "scale-110" : ""}`} 
                          style={{ color: formData.softwares.includes(tool.name) ? tool.color : (isDark ? "#52525b" : "#9ca3af") }}
                        />
                      )}
                      <span className={`text-[8px] font-black uppercase tracking-widest text-center ${formData.softwares.includes(tool.name) ? "text-emerald-500" : "text-zinc-500"}`}>
                        {tool.name}
                      </span>
                      {formData.softwares.includes(tool.name) && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
                      )}
                    </button>
                  ))}

                  {/* Render Custom Selected Tools */}
                  {formData.softwares
                    .filter(name => !SOFTWARES_LIST.some(t => t.name === name))
                    .map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          softwares: formData.softwares.filter(t => t !== name)
                        });
                      }}
                      className="relative aspect-square flex flex-col items-center justify-center p-3 rounded-2xl border bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10 transition-all"
                    >
                      <HiOutlineBriefcase className="w-8 h-8 mb-2 text-emerald-500" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-center text-emerald-500">
                        {name}
                      </span>
                      <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
                    </button>
                  ))}
                </div>

                {/* Add Custom Tool Input */}
                <div className="mt-4 flex gap-2">
                  <div className="relative flex-1">
                    <HiOutlineLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Add other software..."
                      value={customSoftwareInput}
                      onChange={(e) => setCustomSoftwareInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (customSoftwareInput.trim()) {
                            const newTool = customSoftwareInput.trim();
                            if (!formData.softwares.includes(newTool)) {
                              setFormData({
                                ...formData,
                                softwares: [...formData.softwares, newTool]
                              });
                            }
                            setCustomSoftwareInput("");
                          }
                        }
                      }}
                      className={`w-full pl-11 pr-4 py-3 rounded-2xl border text-[11px] font-bold transition-all outline-none ${isDark ? "bg-black/40 border-white/5 text-white focus:border-emerald-500/50" : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-emerald-500"}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (customSoftwareInput.trim()) {
                        const newTool = customSoftwareInput.trim();
                        if (!formData.softwares.includes(newTool)) {
                          setFormData({
                            ...formData,
                            softwares: [...formData.softwares, newTool]
                          });
                        }
                        setCustomSoftwareInput("");
                      }
                    }}
                    className={`px-6 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all ${isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-zinc-900 text-white hover:bg-zinc-800"}`}
                  >
                    Add
                  </button>
                </div>
              </motion.div>
            )}

            {/* Skills & Expertise - Simple Version */}
            {user?.role === 'editor' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-0 transition-all"
              >
                <SectionHeader simple icon={HiOutlineSparkles} title="Skills & Expertise" subtitle="Showcase your power" />
                
                <div className="space-y-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="skillInput"
                      value={formData.skillInput}
                      onChange={handleChange}
                      onKeyPress={(e) => handleKeyPress(e, addSkill)}
                      placeholder="Add a skill..."
                      className={`flex-1 px-4 py-3 rounded-2xl border text-sm transition-all outline-none ${isDark ? "bg-black/40 border-white/5 text-white focus:border-emerald-500/50" : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-emerald-500"}`}
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      <HiOutlinePlus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {formData.skills.map((skill) => (
                        <motion.span
                          key={skill}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-2 border transition-colors ${
                            isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-700"
                          }`}
                        >
                          {skill}
                          <HiOutlineXMark 
                            className="w-3.5 h-3.5 cursor-pointer hover:text-red-500"
                            onClick={() => removeSkill(skill)}
                          />
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-3">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>Suggested Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Video Editing", "Reels", "DaVinci", "Premiere", "After Effects", "Color Grading", "Sound Design", "Motion Graphics"].map(skill => (
                        <button
                          key={skill}
                          type="button"
                          disabled={formData.skills.includes(skill)}
                          onClick={() => {
                            if (formData.skills.length < 20) {
                              setFormData({ ...formData, skills: [...formData.skills, skill] });
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            formData.skills.includes(skill)
                            ? "opacity-30 grayscale cursor-default"
                            : (isDark ? "bg-transparent border-white/5 text-zinc-500 hover:border-emerald-500/30 hover:text-emerald-500" : "bg-white border-zinc-100 text-zinc-400 hover:border-emerald-500 hover:text-emerald-600")
                          }`}
                        >
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Languages - Simple Version */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-0 transition-all"
            >
              <SectionHeader simple icon={HiOutlineLanguage} title="Language Hub" subtitle="Global communication" />
              
              <div className="space-y-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="languageInput"
                    value={formData.languageInput}
                    onChange={handleChange}
                    onKeyPress={(e) => handleKeyPress(e, addLanguage)}
                    placeholder="Add a language..."
                    className={`flex-1 px-4 py-3 rounded-2xl border text-sm transition-all outline-none ${isDark ? "bg-black/40 border-white/5 text-white focus:border-emerald-500/50" : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-emerald-500"}`}
                  />
                  <button
                    type="button"
                    onClick={addLanguage}
                    className="w-12 h-12 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white rounded-2xl flex items-center justify-center hover:opacity-90 transition-all shadow-lg shadow-black/10"
                  >
                    <HiOutlinePlus className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {formData.languages.map((l) => (
                      <motion.span
                        key={l}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-2 border transition-colors ${
                          isDark ? "bg-zinc-100 border-zinc-200 text-black" : "bg-zinc-900 border-zinc-800 text-white"
                        }`}
                      >
                        {l}
                        <HiOutlineXMark 
                          className="w-3.5 h-3.5 cursor-pointer hover:text-red-500"
                          onClick={() => removeLanguage(l)}
                        />
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Certifications - Simple Version */}
            {user?.role === 'editor' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-0 transition-all"
              >
                <SectionHeader simple icon={HiOutlineAcademicCap} title="Certifications" subtitle="Verify your skill" />
                
                <div className="space-y-6">
                  <div className={`relative group p-8 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${isDark ? "border-white/5 bg-black/20 hover:border-emerald-500/30" : "border-zinc-200 bg-zinc-50 hover:border-emerald-500/50"}`}>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleCertUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${isDark ? "bg-emerald-500/10 text-emerald-500 group-hover:scale-110" : "bg-emerald-50 text-emerald-600 group-hover:scale-110"}`}>
                      <HiOutlineCloudArrowUp className="w-8 h-8" />
                    </div>
                    <p className={`text-sm font-black ${isDark ? "text-white" : "text-zinc-900"}`}>Upload Certificates</p>
                    <p className={`text-[10px] font-bold mt-1 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>PNG, JPG or WEBP (Max 5MB)</p>
                  </div>

                  {(formData.existingCertifications.length > 0 || formData.certifications.length > 0) && (
                    <div className="grid grid-cols-4 gap-3">
                      {formData.existingCertifications.map((cert, i) => (
                        <div key={`existing-${i}`} className="relative group aspect-square">
                          <img src={cert.image} alt="" className="w-full h-full object-cover rounded-xl border border-white/10" />
                          <button
                            type="button"
                            onClick={() => removeCert(i, "existing")}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          >
                            <HiOutlineXMark className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {formData.certifications.map((file, i) => (
                        <div key={`new-${i}`} className="relative group aspect-square">
                          <img src={file instanceof File ? URL.createObjectURL(file) : file} alt="" className="w-full h-full object-cover rounded-xl border border-white/10" />
                          <button
                            type="button"
                            onClick={() => removeCert(i, "local")}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          >
                            <HiOutlineXMark className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Global Submit */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="sticky bottom-8 z-30"
        >
          <button
            type="submit"
            disabled={!isFormValid || updating}
            className={`w-full max-w-lg mx-auto py-5 rounded-[24px] font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3 transition-all ${
              isFormValid && !updating
              ? "bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40 hover:scale-[1.02] active:scale-95"
              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {updating ? (
              <>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
                Updating Hub...
              </>
            ) : (
              <>
                <HiOutlineShieldCheck className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
};

export default UpdateProfile;
