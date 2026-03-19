import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar.jsx";
import ClientSidebar from "../components/ClientSidebar.jsx";
import EditorNavbar from "../components/EditorNavbar.jsx";
import { useAppContext } from "../context/AppContext";
import axios from "axios";
import {
  HiOutlineArrowRight, HiOutlineArrowLeft, HiOutlineCheckCircle,
  HiOutlineXMark, HiOutlinePhoto, HiOutlineVideoCamera,
  HiOutlineUser, HiOutlineEnvelope, HiOutlinePhone,
  HiOutlineRocketLaunch, HiOutlineSparkles, HiOutlineBolt,
  HiOutlineClipboardDocumentCheck, HiOutlineCheck,
  HiOutlineBuildingOffice2, HiOutlineGlobeAlt,
} from "react-icons/hi2";
import {
  FaYoutube, FaInstagram, FaFacebook, FaGlobe,
  FaShoppingCart, FaGraduationCap, FaCalendarAlt, FaUserTie,
} from "react-icons/fa";

// ─── Theme tokens ─────────────────────────────────────────────────────────────
// Purple:  #7c3aed (deep), #8b5cf6 (mid), #a78bfa (light)
// Green:   #16a34a (deep), #22c55e (mid), #4ade80 (light)
// Base:    #000, #0a0a0a, #111, #1a1a1a, #222
// Border:  rgba(255,255,255,0.08) default, rgba(255,255,255,0.15) hover

const P = { deep: "#7c3aed", mid: "#8b5cf6", light: "#a78bfa", bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.3)" };
const G = { deep: "#16a34a", mid: "#22c55e", light: "#4ade80", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.25)" };

// ─── Data ─────────────────────────────────────────────────────────────────────
const AD_TYPES = [
  { id: "youtube",    label: "YouTube Channel",     icon: FaYoutube,        desc: "Grow your subscriber base" },
  { id: "instagram",  label: "Instagram Page",      icon: FaInstagram,      desc: "Grow followers & engagement" },
  { id: "website",    label: "Website / Brand",     icon: FaGlobe,          desc: "Drive traffic to your site" },
  { id: "app",        label: "Mobile App",          icon: HiOutlineBolt,    desc: "Get more installs" },
  { id: "course",     label: "Online Course",       icon: FaGraduationCap,  desc: "Reach learners in your niche" },
  { id: "event",      label: "Event / Launch",      icon: FaCalendarAlt,    desc: "Promote launches & events" },
  { id: "freelancer", label: "Freelancer / Editor", icon: FaUserTie,        desc: "Get more editing clients" },
  { id: "ecommerce",  label: "E-commerce Store",    icon: FaShoppingCart,   desc: "Sell products to creators" },
];

const PLACEMENTS = [
  { id: "home_banner", label: "Home Banner",     reach: "~10,000 / day", desc: "Shown to every homepage visitor. Maximum reach." },
  { id: "reels_feed",  label: "Reels Feed",      reach: "~4,000 / day",  desc: "Between reels. Highly engaged audience." },
  { id: "both",        label: "Both Placements", reach: "~14,000 / day", desc: "Full platform coverage. Best value.", badge: "BEST VALUE" },
];

const DURATIONS = [
  { days: 1,  label: "1 Day",   prices: { home_banner: 499,  reels_feed: 299,  both: 699   } },
  { days: 3,  label: "3 Days",  prices: { home_banner: 1299, reels_feed: 799,  both: 1799  }, save: "14%" },
  { days: 7,  label: "7 Days",  prices: { home_banner: 2499, reels_feed: 1499, both: 3499  }, save: "29%", popular: true },
  { days: 15, label: "15 Days", prices: { home_banner: 4499, reels_feed: 2799, both: 6499  }, save: "39%" },
  { days: 30, label: "30 Days", prices: { home_banner: 7999, reels_feed: 4999, both: 11499 }, save: "45%" },
];

const TYPE_LINKS = {
  youtube:    [{ key: "youtubeUrl",   label: "YouTube Channel URL",       ph: "https://youtube.com/@yourchannel",  icon: FaYoutube,   required: true }],
  instagram:  [{ key: "instagramUrl", label: "Instagram Profile URL",     ph: "https://instagram.com/yourhandle",  icon: FaInstagram, required: true }],
  website:    [{ key: "websiteUrl",   label: "Website URL",               ph: "https://yourwebsite.com",           icon: FaGlobe,     required: true },
               { key: "facebookUrl",  label: "Facebook Page (optional)",  ph: "https://facebook.com/yourpage",     icon: FaFacebook }],
  app:        [{ key: "websiteUrl",   label: "App Store / Play Store URL",ph: "https://play.google.com/...",       icon: FaGlobe,     required: true }],
  course:     [{ key: "websiteUrl",   label: "Course URL",                ph: "https://udemy.com/your-course",     icon: FaGlobe,     required: true }],
  event:      [{ key: "websiteUrl",   label: "Event / Registration URL",  ph: "https://yourregistration.com",      icon: FaGlobe,     required: true }],
  freelancer: [{ key: "websiteUrl",   label: "Portfolio URL",             ph: "https://yourportfolio.com",         icon: FaGlobe,     required: true },
               { key: "instagramUrl", label: "Instagram (optional)",      ph: "https://instagram.com/yourhandle",  icon: FaInstagram }],
  ecommerce:  [{ key: "websiteUrl",   label: "Store URL",                 ph: "https://yourstore.com",             icon: FaGlobe,     required: true }],
};

const CTA_SUGGESTIONS = {
  youtube:    ["Subscribe Now", "Watch Now", "Join Channel"],
  instagram:  ["Follow Us", "See More", "Visit Profile"],
  website:    ["Visit Now", "Learn More", "Explore"],
  app:        ["Download Free", "Get the App", "Install Now"],
  course:     ["Enroll Now", "Start Learning", "View Course"],
  event:      ["Register Now", "Get Tickets", "Join Event"],
  freelancer: ["Hire Me", "View Portfolio", "Get Quote"],
  ecommerce:  ["Shop Now", "Browse Store", "Get Deal"],
};

const STEPS = ["Ad Type", "Placement", "Creative", "Details", "Review"];

// ─── Small shared components ───────────────────────────────────────────────────
const inputCls = (err) =>
  `w-full bg-[#0a0a0a] border ${err ? "border-red-900/60" : "border-white/8"} rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors`;

const Field = ({ label, required, error, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-bold uppercase tracking-widest text-white/35">
      {label}{required && <span className="ml-1" style={{ color: P.light }}>*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-[11px] text-white/20 leading-relaxed">{hint}</p>}
    {error && <p className="text-[11px] font-semibold" style={{ color: "#f87171" }}>{error}</p>}
  </div>
);

// ─── Step bar ─────────────────────────────────────────────────────────────────
const StepBar = ({ current }) => (
  <div className="flex items-center justify-center gap-0">
    {STEPS.map((label, i) => (
      <React.Fragment key={label}>
        <div className="flex flex-col items-center">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all"
            style={
              i < current
                ? { background: P.mid, borderColor: P.mid, color: "#fff" }
                : i === current
                ? { background: "transparent", borderColor: P.light, color: P.light }
                : { background: "transparent", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.2)" }
            }
          >
            {i < current ? <HiOutlineCheck className="text-xs" /> : i + 1}
          </div>
          <span
            className="text-[9px] mt-1 font-bold uppercase tracking-wider hidden sm:block"
            style={{ color: i === current ? P.light : i < current ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)" }}
          >
            {label}
          </span>
        </div>
        {i < STEPS.length - 1 && (
          <div className="h-px w-6 sm:w-10 mx-1 mb-3 transition-all"
            style={{ background: i < current ? P.mid : "rgba(255,255,255,0.07)" }} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ─── Mini live preview ─────────────────────────────────────────────────────────
const MiniPreview = ({ form }) => {
  const mediaUrl = form.localMediaUrl || null;
  return (
    <div className="sticky top-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full" style={{ background: P.mid }} />
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Preview</p>
      </div>
      <div
        className="relative w-full rounded-xl overflow-hidden border"
        style={{ paddingBottom: `${(192 / 375) * 100}%`, background: "#111", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="absolute inset-0">
          {mediaUrl ? (
            form.mediaType === "video"
              ? <video src={mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              : <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <HiOutlinePhoto className="text-xl text-white/10" />
              <span className="text-[9px] text-white/15">Upload to preview</span>
            </div>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 p-3">
            <span className="block mb-1.5 px-1.5 py-0.5 rounded text-[6px] font-black uppercase tracking-widest w-fit"
              style={{ background: P.bg, border: `1px solid ${P.border}`, color: P.light }}>
              {form.badge || "SPONSOR"}
            </span>
            <p className="text-white text-[10px] font-black leading-tight mb-1">{form.title || "Your Ad Title"}</p>
            <p className="text-[8px] mb-2 truncate max-w-[70%]" style={{ color: "rgba(255,255,255,0.35)" }}>{form.description || "Your description"}</p>
            <button className="px-2 py-1 rounded-md text-[6px] font-black uppercase tracking-wider text-white"
              style={{ background: P.mid }}>
              {form.ctaText || "Learn More"} →
            </button>
          </div>
        </div>
      </div>
      <p className="text-[9px] text-center mt-2" style={{ color: "rgba(255,255,255,0.18)" }}>375 × 192px banner</p>
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────────
const AdvertiseNewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { backendURL, user } = useAppContext();
  const fileInputRef = useRef(null);
  const prefill = location.state || {};

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    adType: "", placement: prefill.placement || "home_banner", days: prefill.days || 7,
    title: "", description: "", ctaText: "", badge: "SPONSOR",
    mediaFile: null, localMediaUrl: "", mediaType: "image",
    youtubeUrl: "", instagramUrl: "", facebookUrl: "", websiteUrl: "", otherUrl: "",
    additionalNotes: "",
    advertiserName: user?.name || "", advertiserEmail: user?.email || "",
    advertiserPhone: "", companyName: "", suvixUserId: user?._id || "",
    agreeTerms: false,
  });

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const clearError = (k) => setErrors(e => { const n = { ...e }; delete n[k]; return n; });

  useEffect(() => {
    if (user) {
      setField("advertiserName", user.name || "");
      setField("advertiserEmail", user.email || "");
      setField("suvixUserId", user._id || "");
    }
  }, [user]);

  useEffect(() => {
    if (form.adType && CTA_SUGGESTIONS[form.adType]) setField("ctaText", CTA_SUGGESTIONS[form.adType][0]);
  }, [form.adType]);

  const price = DURATIONS.find(d => d.days === form.days)?.prices[form.placement] || 0;

  const handleFilePick = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setField("mediaFile", file);
    setField("localMediaUrl", URL.createObjectURL(file));
    setField("mediaType", file.type.startsWith("video/") ? "video" : "image");
    clearError("mediaFile"); e.target.value = "";
  };

  const validate = () => {
    const e = {};
    if (step === 0 && !form.adType) e.adType = "Select an ad type to continue";
    if (step === 1) {
      if (!form.placement) e.placement = "Select a placement";
      if (!form.days) e.days = "Select a duration";
    }
    if (step === 2) {
      if (!form.title.trim()) e.title = "Title is required";
      if (!form.description.trim()) e.description = "Description is required";
      if (!form.ctaText.trim()) e.ctaText = "CTA text is required";
      if (!form.mediaFile && !form.localMediaUrl) e.mediaFile = "Upload a banner image or video";
      (TYPE_LINKS[form.adType]?.filter(l => l.required) || [])
        .forEach(l => { if (!form[l.key]?.trim()) e[l.key] = `${l.label} is required`; });
    }
    if (step === 3) {
      if (!form.advertiserName.trim()) e.advertiserName = "Name is required";
      if (!form.advertiserEmail.trim()) e.advertiserEmail = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.advertiserEmail)) e.advertiserEmail = "Enter a valid email";
      if (!form.advertiserPhone.trim()) e.advertiserPhone = "Phone is required";
      if (!form.agreeTerms) e.agreeTerms = "You must agree to continue";
    }
    setErrors(e); return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, 4)); };
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!validate()) return; setSaving(true);
    try {
      const fd = new FormData();
      if (form.mediaFile) fd.append("media", form.mediaFile);
      ["adType","placement","title","description","ctaText","badge","mediaType","youtubeUrl","instagramUrl","facebookUrl","websiteUrl","otherUrl","advertiserName","advertiserEmail","advertiserPhone","companyName","suvixUserId","additionalNotes"]
        .forEach(k => { if (form[k]) fd.append(k, form[k]); });
      fd.append("days", form.days); fd.append("requestedPrice", price);
      if (user?._id) fd.append("userId", user._id);
      const token = user?.token || JSON.parse(localStorage.getItem("user") || "{}")?.token;
      const { data } = await axios.post(`${backendURL}/ad-requests`, fd, {
        headers: { "Content-Type": "multipart/form-data", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      setSubmitResult(data);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || "Submission failed. Please try again." });
    } finally { setSaving(false); }
  };

  const SidebarComponent = user?.role === "client" ? ClientSidebar : Sidebar;

  // ── Success screen ───────────────────────────────────────────────────────────
  if (submitResult) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
        <SidebarComponent isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 md:ml-64 md:mt-16 flex items-center justify-center px-4 py-16">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full">

            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: G.bg, border: `1px solid ${G.border}` }}>
              <HiOutlineCheckCircle className="text-2xl" style={{ color: G.light }} />
            </div>

            <h1 className="text-xl font-black text-white text-center mb-1">Request Submitted</h1>
            <p className="text-sm text-center mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>
              Your ad is in the review queue.
            </p>

            {submitResult.requestId && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-5"
                style={{ background: P.bg, border: `1px solid ${P.border}` }}>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: P.light + "80" }}>Request ID</span>
                <span className="text-sm font-black font-mono" style={{ color: P.light }}>{submitResult.requestId}</span>
              </div>
            )}

            {/* Next steps */}
            <div className="rounded-xl overflow-hidden border border-white/8 mb-5">
              {[
                { n: "1", text: "Team reviews within 24–48 hours" },
                { n: "2", text: "Approval or revision email sent" },
                { n: "3", text: "Payment link sent on approval" },
                { n: "4", text: "Campaign goes live after payment" },
              ].map(({ n, text }) => (
                <div key={n} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 bg-[#0a0a0a]">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: P.bg, border: `1px solid ${P.border}` }}>
                    <span className="text-[9px] font-black" style={{ color: P.light }}>{n}</span>
                  </div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{text}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-center mb-5" style={{ color: "rgba(255,255,255,0.2)" }}>
              Updates sent to <span style={{ color: "rgba(255,255,255,0.45)" }}>{form.advertiserEmail}</span>
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate("/")}
                className="py-3 rounded-xl border border-white/10 text-sm font-bold transition-all hover:border-white/25 hover:text-white"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                Back to Home
              </button>
              <button onClick={() => navigate("/advertise")}
                className="py-3 rounded-xl text-sm font-black text-white transition-all"
                style={{ background: P.mid }}>
                View Pricing
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // ── Steps ────────────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      // ── STEP 0: Ad Type ──────────────────────────────────────────────────────
      case 0: return (
        <div>
          <h2 className="text-xl font-black text-white mb-1">What are you promoting?</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>
            Select the category that best describes your campaign.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AD_TYPES.map(({ id, label, icon: Icon, desc }) => {
              const sel = form.adType === id;
              return (
                <motion.button key={id} whileTap={{ scale: 0.97 }}
                  onClick={() => { setField("adType", id); clearError("adType"); }}
                  className="p-4 rounded-xl border text-left transition-all"
                  style={sel
                    ? { background: P.bg, borderColor: P.border, boxShadow: `0 0 0 1px ${P.mid}30` }
                    : { background: "#0f0f0f", borderColor: "rgba(255,255,255,0.07)" }
                  }
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: sel ? P.mid + "20" : "rgba(255,255,255,0.04)", border: sel ? `1px solid ${P.border}` : "1px solid rgba(255,255,255,0.06)" }}>
                    <Icon className="text-sm" style={{ color: sel ? P.light : "rgba(255,255,255,0.35)" }} />
                  </div>
                  <p className="text-sm font-bold text-white mb-0.5">{label}</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{desc}</p>
                  {sel && (
                    <div className="mt-2.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: P.mid }}>
                      <HiOutlineCheck className="text-[8px] text-white" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
          {errors.adType && <p className="text-xs mt-3 font-semibold" style={{ color: "#f87171" }}>{errors.adType}</p>}
        </div>
      );

      // ── STEP 1: Placement + Duration ─────────────────────────────────────────
      case 1: return (
        <div>
          <h2 className="text-xl font-black text-white mb-1">Placement & Duration</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>
            Choose where your ad appears and for how long.
          </p>

          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>Ad Placement</p>
          <div className="grid sm:grid-cols-3 gap-2 mb-7">
            {PLACEMENTS.map(p => {
              const sel = form.placement === p.id;
              return (
                <motion.button key={p.id} whileTap={{ scale: 0.97 }}
                  onClick={() => { setField("placement", p.id); clearError("placement"); }}
                  className="p-4 rounded-xl border text-left transition-all relative"
                  style={sel
                    ? { background: P.bg, borderColor: P.border }
                    : { background: "#0f0f0f", borderColor: "rgba(255,255,255,0.07)" }
                  }
                >
                  {p.badge && (
                    <span className="absolute top-3 right-3 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full"
                      style={{ background: G.mid, color: "#000" }}>{p.badge}</span>
                  )}
                  <p className="font-black text-white text-sm mb-1">{p.label}</p>
                  <p className="text-[11px] mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>{p.desc}</p>
                  <p className="text-[11px] font-bold" style={{ color: sel ? P.light : G.light }}>{p.reach}</p>
                </motion.button>
              );
            })}
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>Campaign Duration</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-5">
            {DURATIONS.map(d => {
              const p = d.prices[form.placement];
              const sel = form.days === d.days;
              return (
                <motion.button key={d.days} whileTap={{ scale: 0.97 }}
                  onClick={() => { setField("days", d.days); clearError("days"); }}
                  className="p-3 rounded-xl border text-center transition-all relative"
                  style={sel
                    ? { background: P.bg, borderColor: P.border }
                    : { background: "#0f0f0f", borderColor: "rgba(255,255,255,0.07)" }
                  }
                >
                  {d.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[6px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: G.mid, color: "#000" }}>POPULAR</span>
                  )}
                  <p className="text-xs font-bold mb-1" style={{ color: sel ? P.light : "rgba(255,255,255,0.4)" }}>{d.label}</p>
                  <p className="text-sm font-black text-white">₹{p.toLocaleString("en-IN")}</p>
                  {d.save && <p className="text-[9px] mt-0.5 font-semibold" style={{ color: G.light }}>-{d.save}</p>}
                </motion.button>
              );
            })}
          </div>

          {/* Price summary */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-white/8 bg-[#0f0f0f]">
            <div>
              <p className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                {PLACEMENTS.find(p => p.id === form.placement)?.label} · {DURATIONS.find(d => d.days === form.days)?.label}
              </p>
              <p className="text-2xl font-black text-white">₹{price.toLocaleString("en-IN")}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Per day</p>
              <p className="text-sm font-bold" style={{ color: P.light }}>₹{Math.round(price / form.days).toLocaleString("en-IN")}</p>
              <p className="text-[10px] mt-1 font-semibold" style={{ color: G.light }}>Pay after approval</p>
            </div>
          </div>
        </div>
      );

      // ── STEP 2: Creative ─────────────────────────────────────────────────────
      case 2: return (
        <div className="grid lg:grid-cols-[1fr_230px] gap-6">
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black text-white mb-1">Your Ad Creative</h2>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Upload your banner and write the ad copy.</p>
            </div>

            {/* Media upload */}
            <Field label="Banner Media *" error={errors.mediaFile}
              hint="Image: JPG/PNG/WebP · min 375×192px · max 10MB   |   Video: MP4/MOV · max 60s · 200MB">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all bg-[#0a0a0a]"
                style={{
                  borderColor: errors.mediaFile
                    ? "rgba(239,68,68,0.35)"
                    : form.localMediaUrl
                    ? G.border
                    : "rgba(255,255,255,0.08)"
                }}
                onMouseEnter={e => { if (!form.localMediaUrl && !errors.mediaFile) e.currentTarget.style.borderColor = P.border; }}
                onMouseLeave={e => { if (!form.localMediaUrl && !errors.mediaFile) e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
              >
                {form.localMediaUrl ? (
                  <div>
                    {form.mediaType === "video"
                      ? <video src={form.localMediaUrl} className="max-h-32 mx-auto rounded-xl" muted />
                      : <img src={form.localMediaUrl} className="max-h-32 mx-auto rounded-xl object-contain" alt="" />
                    }
                    <p className="text-xs font-bold mt-3" style={{ color: G.light }}>✓ Uploaded · Click to replace</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-center gap-3 mb-3">
                      <HiOutlinePhoto className="text-2xl" style={{ color: "rgba(255,255,255,0.12)" }} />
                      <HiOutlineVideoCamera className="text-2xl" style={{ color: "rgba(255,255,255,0.12)" }} />
                    </div>
                    <p className="text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Click to upload image or video</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>Recommended: 375×192px · 16:5 ratio</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFilePick} className="hidden" />
            </Field>

            <Field label="Ad Headline *" error={errors.title} hint="Short and punchy · max 60 chars">
              <input value={form.title} onChange={e => { setField("title", e.target.value.slice(0, 60)); clearError("title"); }}
                className={inputCls(errors.title)} placeholder="e.g. Subscribe to India's Top Editing Channel" />
              <p className="text-[10px] text-right mt-1" style={{ color: "rgba(255,255,255,0.18)" }}>{form.title.length}/60</p>
            </Field>

            <Field label="Short Description *" error={errors.description} hint="One line under the title · max 120 chars">
              <input value={form.description} onChange={e => { setField("description", e.target.value.slice(0, 120)); clearError("description"); }}
                className={inputCls(errors.description)} placeholder="e.g. 500K+ subscribers · Free tutorials every week" />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="CTA Button Text *" error={errors.ctaText}>
                <input value={form.ctaText} onChange={e => { setField("ctaText", e.target.value); clearError("ctaText"); }}
                  className={inputCls(errors.ctaText)} placeholder="Subscribe Now" maxLength={25} />
                {form.adType && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {CTA_SUGGESTIONS[form.adType]?.map(s => (
                      <button key={s} onClick={() => setField("ctaText", s)}
                        className="text-[10px] px-2 py-1 rounded-lg border transition-all"
                        style={{ background: P.bg, borderColor: P.border, color: P.light }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </Field>
              <Field label="Badge Label" hint="Tag above title · default: SPONSOR">
                <input value={form.badge} onChange={e => setField("badge", e.target.value)}
                  className={inputCls(false)} placeholder="SPONSOR" maxLength={20} />
              </Field>
            </div>

            {/* Type-specific links */}
            {form.adType && TYPE_LINKS[form.adType] && (
              <div className="space-y-3 p-4 rounded-xl border" style={{ background: G.bg, borderColor: G.border }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: G.light + "90" }}>Your Links</p>
                {TYPE_LINKS[form.adType].map(({ key, label, ph, icon: Icon, required: req }) => (
                  <Field key={key} label={`${label}${req ? " *" : ""}`} error={errors[key]}>
                    <div className="relative">
                      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: "rgba(255,255,255,0.2)" }} />
                      <input value={form[key]} onChange={e => { setField(key, e.target.value); clearError(key); }}
                        className={`${inputCls(errors[key])} pl-9`} placeholder={ph} />
                    </div>
                  </Field>
                ))}
                {form.adType !== "website" && (
                  <Field label="Website URL (optional)">
                    <div className="relative">
                      <FaGlobe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: "rgba(255,255,255,0.2)" }} />
                      <input value={form.websiteUrl} onChange={e => setField("websiteUrl", e.target.value)}
                        className={`${inputCls(false)} pl-9`} placeholder="https://yourwebsite.com" />
                    </div>
                  </Field>
                )}
              </div>
            )}

            <Field label="Notes to Admin (optional)" hint="Special instructions for the review team">
              <textarea value={form.additionalNotes} onChange={e => setField("additionalNotes", e.target.value)}
                className={`${inputCls(false)} resize-none h-20`} placeholder="Any context or special requests..." />
            </Field>
          </div>

          <div className="hidden lg:block"><MiniPreview form={form} /></div>
        </div>
      );

      // ── STEP 3: Details ──────────────────────────────────────────────────────
      case 3: return (
        <div className="max-w-lg">
          <h2 className="text-xl font-black text-white mb-1">Contact Details</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>
            We'll send review updates and the payment link here.
          </p>

          {user && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl mb-5 border"
              style={{ background: G.bg, borderColor: G.border }}>
              <HiOutlineCheckCircle className="text-base flex-shrink-0" style={{ color: G.light }} />
              <div>
                <p className="text-xs font-bold" style={{ color: G.light }}>Logged in — details pre-filled</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>Linked to your SuviX account</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name *" error={errors.advertiserName}>
                <div className="relative">
                  <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: "rgba(255,255,255,0.18)" }} />
                  <input value={form.advertiserName} onChange={e => { setField("advertiserName", e.target.value); clearError("advertiserName"); }}
                    className={`${inputCls(errors.advertiserName)} pl-9`} placeholder="John Doe" />
                </div>
              </Field>
              <Field label="Company / Brand" hint="Optional">
                <div className="relative">
                  <HiOutlineBuildingOffice2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: "rgba(255,255,255,0.18)" }} />
                  <input value={form.companyName} onChange={e => setField("companyName", e.target.value)}
                    className={`${inputCls(false)} pl-9`} placeholder="Acme Studios" />
                </div>
              </Field>
            </div>

            <Field label="Email Address *" error={errors.advertiserEmail} hint="All communication and payment link sent here">
              <div className="relative">
                <HiOutlineEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: "rgba(255,255,255,0.18)" }} />
                <input value={form.advertiserEmail} onChange={e => { setField("advertiserEmail", e.target.value); clearError("advertiserEmail"); }}
                  className={`${inputCls(errors.advertiserEmail)} pl-9`} placeholder="you@example.com" type="email" />
              </div>
            </Field>

            <Field label="Phone Number *" error={errors.advertiserPhone} hint="For urgent communication if needed">
              <div className="relative">
                <HiOutlinePhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: "rgba(255,255,255,0.18)" }} />
                <input value={form.advertiserPhone} onChange={e => { setField("advertiserPhone", e.target.value); clearError("advertiserPhone"); }}
                  className={`${inputCls(errors.advertiserPhone)} pl-9`} placeholder="+91 98765 43210" type="tel" />
              </div>
            </Field>

            <div className="p-4 rounded-xl border transition-all"
              style={errors.agreeTerms
                ? { background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.3)" }
                : { background: "#0a0a0a", borderColor: "rgba(255,255,255,0.08)" }
              }>
              <label className="flex items-start gap-3 cursor-pointer">
                <button type="button"
                  onClick={() => { setField("agreeTerms", !form.agreeTerms); clearError("agreeTerms"); }}
                  className="w-5 h-5 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-all"
                  style={form.agreeTerms
                    ? { background: P.mid, borderColor: P.mid }
                    : { background: "transparent", borderColor: "rgba(255,255,255,0.18)" }
                  }
                >
                  {form.agreeTerms && <HiOutlineCheck className="text-white text-[10px]" />}
                </button>
                <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
                  I agree to SuviX's{" "}
                  <a href="/advertise#faq" className="underline underline-offset-2" style={{ color: P.light }}>Ad Guidelines</a>
                  {" "}— ads may be rejected for policy violations, payment required after approval, no refunds once live.
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="text-xs mt-2 pl-8 font-semibold" style={{ color: "#f87171" }}>{errors.agreeTerms}</p>
              )}
            </div>
          </div>
        </div>
      );

      // ── STEP 4: Review ───────────────────────────────────────────────────────
      case 4:
        const adTypeInfo = AD_TYPES.find(t => t.id === form.adType);
        const placementInfo = PLACEMENTS.find(p => p.id === form.placement);
        const durationInfo = DURATIONS.find(d => d.days === form.days);
        return (
          <div className="max-w-2xl">
            <h2 className="text-xl font-black text-white mb-1">Review & Submit</h2>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>
              Everything look good? Submit when ready.
            </p>

            <div className="space-y-3">
              {/* Campaign */}
              <div className="rounded-xl overflow-hidden border border-white/8">
                <div className="px-4 py-2.5 border-b border-white/8" style={{ background: P.bg }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: P.light }}>Campaign</p>
                </div>
                <div className="grid grid-cols-3 divide-x bg-[#0a0a0a]" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  {[
                    { label: "Type",      value: adTypeInfo?.label,    Icon: adTypeInfo?.icon },
                    { label: "Placement", value: placementInfo?.label, Icon: null },
                    { label: "Duration",  value: durationInfo?.label,  Icon: null },
                  ].map(({ label, value, Icon }) => (
                    <div key={label} className="p-4">
                      <p className="text-[10px] mb-1.5" style={{ color: "rgba(255,255,255,0.22)" }}>{label}</p>
                      <div className="flex items-center gap-1.5">
                        {Icon && <Icon className="text-sm" style={{ color: P.light }} />}
                        <p className="text-sm font-bold text-white">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Creative */}
              <div className="rounded-xl overflow-hidden border border-white/8">
                <div className="px-4 py-2.5 border-b border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Creative</p>
                </div>
                <div className="p-4 bg-[#0a0a0a] flex gap-4 items-start">
                  {form.localMediaUrl && (
                    <div className="w-28 flex-shrink-0 rounded-xl overflow-hidden border border-white/8" style={{ aspectRatio: "375/192" }}>
                      {form.mediaType === "video"
                        ? <video src={form.localMediaUrl} className="w-full h-full object-cover" muted />
                        : <img src={form.localMediaUrl} className="w-full h-full object-cover" alt="" />
                      }
                    </div>
                  )}
                  <div className="space-y-1.5 min-w-0">
                    <p className="text-sm font-black text-white truncate">{form.title}</p>
                    <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{form.description}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
                      CTA: <span className="font-semibold" style={{ color: P.light }}>"{form.ctaText}"</span>
                    </p>
                    {form.websiteUrl && <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.22)" }}>{form.websiteUrl}</p>}
                    {form.youtubeUrl && <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.22)" }}>{form.youtubeUrl}</p>}
                    {form.instagramUrl && <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.22)" }}>{form.instagramUrl}</p>}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="rounded-xl overflow-hidden border border-white/8">
                <div className="px-4 py-2.5 border-b border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Contact</p>
                </div>
                <div className="bg-[#0a0a0a]">
                  {[
                    { label: "Name", value: form.advertiserName },
                    { label: "Email", value: form.advertiserEmail },
                    { label: "Phone", value: form.advertiserPhone },
                    { label: "Company", value: form.companyName || "—" },
                  ].map(({ label, value }, i, arr) => (
                    <div key={label} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? "border-b" : ""}`}
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>{label}</span>
                      <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="p-5 rounded-xl flex items-center justify-between border"
                style={{ background: G.bg, borderColor: G.border }}>
                <div>
                  <p className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.28)" }}>Campaign Total</p>
                  <p className="text-3xl font-black text-white">₹{price.toLocaleString("en-IN")}</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.28)" }}>
                    ₹{Math.round(price / form.days)}/day · {durationInfo?.label}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <HiOutlineCheckCircle className="text-sm" style={{ color: G.light }} />
                    <span className="text-xs font-bold" style={{ color: G.light }}>Pay After Approval</span>
                  </div>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>No charge today</p>
                </div>
              </div>

              {errors.submit && (
                <div className="p-4 rounded-xl border text-sm"
                  style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.2)", color: "#f87171" }}>
                  {errors.submit}
                </div>
              )}
            </div>
          </div>
        );

      default: return null;
    }
  };

  // ── Layout ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <SidebarComponent isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <EditorNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 md:ml-64 md:mt-16 flex flex-col">

        {/* Sticky step header */}
        <div className="sticky top-0 z-30 border-b"
          style={{ background: "rgba(0,0,0,0.96)", backdropFilter: "blur(12px)", borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <button onClick={() => step === 0 ? navigate("/advertise") : prev()}
              className="flex items-center gap-1.5 text-sm font-semibold transition-colors flex-shrink-0"
              style={{ color: "rgba(255,255,255,0.35)" }}
              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}>
              <HiOutlineArrowLeft className="text-sm" />
              <span className="hidden sm:inline">{step === 0 ? "Back" : "Previous"}</span>
            </button>

            <StepBar current={step} />

            <button onClick={() => navigate("/advertise")}
              className="transition-colors flex-shrink-0"
              style={{ color: "rgba(255,255,255,0.22)" }}
              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.22)"}>
              <HiOutlineXMark className="text-lg" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <AnimatePresence mode="wait">
              <motion.div key={step}
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Nav footer */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <button onClick={prev}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-bold transition-all ${step === 0 ? "invisible" : ""}`}
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}>
                <HiOutlineArrowLeft className="text-sm" /> Back
              </button>

              {step < 4 ? (
                <motion.button whileTap={{ scale: 0.97 }} onClick={next}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm text-white transition-all"
                  style={{ background: P.mid }}>
                  Continue <HiOutlineArrowRight className="text-sm" />
                </motion.button>
              ) : (
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={saving}
                  className="flex items-center gap-2 px-7 py-3 rounded-xl font-black text-sm text-white transition-all disabled:opacity-50"
                  style={{ background: G.deep }}>
                  {saving ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      Submitting…
                    </>
                  ) : (
                    <><HiOutlineClipboardDocumentCheck className="text-sm" /> Submit Ad Request</>
                  )}
                </motion.button>
              )}
            </div>

            <p className="text-center text-[11px] mt-4" style={{ color: "rgba(255,255,255,0.18)" }}>
              {["Select your ad type to continue","Choose where and how long","Upload your creative and ad copy","Your contact details","Review everything — no payment today"][step]}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdvertiseNewPage;