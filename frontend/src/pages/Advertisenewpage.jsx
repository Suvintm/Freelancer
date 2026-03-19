import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineArrowRight, HiOutlineArrowLeft, HiOutlineCheckCircle,
  HiOutlineCloudArrowUp, HiOutlineXMark, HiOutlinePhoto,
  HiOutlineVideoCamera, HiOutlineGlobeAlt, HiOutlineUser,
  HiOutlineEnvelope, HiOutlinePhone, 
  HiOutlineCalendarDays, HiOutlineDocumentText,
  HiOutlineRocketLaunch, HiOutlineSparkles, HiOutlineBolt,
  HiOutlineClipboardDocumentCheck, HiOutlineCheck,
  HiOutlineCurrencyRupee,
  HiOutlineBuildingOffice2,
} from "react-icons/hi2";
import {
  FaYoutube, FaInstagram, FaFacebook, FaGlobe,
  FaShoppingCart, FaGraduationCap, FaCalendarAlt, FaUserTie,
} from "react-icons/fa";
import { useAppContext } from "../context/AppContext";
import axios from "axios";

// ─── Constants ─────────────────────────────────────────────────────────────
const AD_TYPES = [
  { id: "youtube",     label: "YouTube Channel",    icon: FaYoutube,      color: "#FF0000", desc: "Grow subscribers" },
  { id: "instagram",   label: "Instagram Page",     icon: FaInstagram,    color: "#E1306C", desc: "Grow followers" },
  { id: "website",     label: "Website / Brand",    icon: FaGlobe,        color: "#6366f1", desc: "Drive traffic" },
  { id: "app",         label: "Mobile App",         icon: HiOutlineBolt,  color: "#10b981", desc: "More downloads" },
  { id: "course",      label: "Online Course",      icon: FaGraduationCap, color: "#f59e0b", desc: "Reach learners" },
  { id: "event",       label: "Event / Launch",     icon: FaCalendarAlt,  color: "#a78bfa", desc: "Promote events" },
  { id: "freelancer",  label: "Freelancer / Editor", icon: FaUserTie,     color: "#34d399", desc: "Get clients" },
  { id: "ecommerce",   label: "E-commerce Store",   icon: FaShoppingCart, color: "#fb923c", desc: "Sell products" },
];

const PLACEMENTS = [
  {
    id: "home_banner",
    label: "Home Banner",
    desc: "Shown to every user who visits the SuviX homepage. Maximum visibility.",
    reach: "~10,000 impressions/day",
    color: "#6366f1",
    best: "Brands, launches, high-budget",
  },
  {
    id: "reels_feed",
    label: "Reels Feed",
    desc: "Shown between reels content. Highly engaged audience actively consuming.",
    reach: "~4,000 impressions/day",
    color: "#10b981",
    best: "YouTube, Instagram, content creators",
  },
  {
    id: "both",
    label: "Both Placements",
    desc: "Maximum exposure across the entire platform. Best value bundle.",
    reach: "~14,000 impressions/day",
    color: "#f59e0b",
    best: "Product launches, high-impact campaigns",
    badge: "BEST VALUE",
  },
];

const DURATIONS = [
  { days: 1,  label: "1 Day",   prices: { home_banner: 499,  reels_feed: 299,  both: 699   } },
  { days: 3,  label: "3 Days",  prices: { home_banner: 1299, reels_feed: 799,  both: 1799  }, save: { home_banner: "13%", reels_feed: "11%", both: "14%" } },
  { days: 7,  label: "7 Days",  prices: { home_banner: 2499, reels_feed: 1499, both: 3499  }, save: { home_banner: "29%", reels_feed: "29%", both: "33%" }, popular: true },
  { days: 15, label: "15 Days", prices: { home_banner: 4499, reels_feed: 2799, both: 6499  }, save: { home_banner: "40%", reels_feed: "37%", both: "39%" } },
  { days: 30, label: "30 Days", prices: { home_banner: 7999, reels_feed: 4999, both: 11499 }, save: { home_banner: "47%", reels_feed: "44%", both: "45%" } },
];

// Type-specific link fields
const TYPE_LINKS = {
  youtube:    [{ key: "youtubeUrl",   label: "YouTube Channel URL *", ph: "https://youtube.com/@yourchannel", icon: FaYoutube,   color: "#FF0000", required: true }],
  instagram:  [{ key: "instagramUrl", label: "Instagram Profile URL *", ph: "https://instagram.com/yourhandle", icon: FaInstagram, color: "#E1306C", required: true }],
  website:    [{ key: "websiteUrl",   label: "Website URL *", ph: "https://yourwebsite.com", icon: FaGlobe, color: "#6366f1", required: true }, { key: "facebookUrl", label: "Facebook Page (optional)", ph: "https://facebook.com/yourpage", icon: FaFacebook, color: "#1877F2" }],
  app:        [{ key: "websiteUrl",   label: "App Store / Play Store URL *", ph: "https://play.google.com/...", icon: FaGlobe, color: "#10b981", required: true }],
  course:     [{ key: "websiteUrl",   label: "Course URL *", ph: "https://udemy.com/your-course", icon: FaGlobe, color: "#f59e0b", required: true }],
  event:      [{ key: "websiteUrl",   label: "Event / Registration URL *", ph: "https://yourregistration.com", icon: FaGlobe, color: "#a78bfa", required: true }],
  freelancer: [{ key: "websiteUrl",   label: "Portfolio URL *", ph: "https://yourportfolio.com", icon: FaGlobe, color: "#34d399", required: true }, { key: "instagramUrl", label: "Instagram (optional)", ph: "https://instagram.com/yourhandle", icon: FaInstagram, color: "#E1306C" }],
  ecommerce:  [{ key: "websiteUrl",   label: "Store URL *", ph: "https://yourstore.com", icon: FaGlobe, color: "#fb923c", required: true }],
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

// ─── Step indicator ────────────────────────────────────────────────────────
const STEPS = ["Ad Type", "Placement", "Creative", "Details", "Review"];

const StepBar = ({ current }) => (
  <div className="flex items-center justify-center gap-0 mb-10">
    {STEPS.map((label, i) => (
      <React.Fragment key={label}>
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${i < current ? "bg-indigo-500 border-indigo-500 text-white" : i === current ? "bg-transparent border-indigo-500 text-indigo-400" : "bg-transparent border-white/15 text-zinc-600"}`}>
            {i < current ? <HiOutlineCheck /> : i + 1}
          </div>
          <span className={`text-[9px] mt-1.5 font-bold uppercase tracking-wider hidden sm:block ${i === current ? "text-indigo-400" : i < current ? "text-zinc-400" : "text-zinc-700"}`}>{label}</span>
        </div>
        {i < STEPS.length - 1 && (
          <div className={`h-px w-8 sm:w-14 mx-1 mb-3 transition-all ${i < current ? "bg-indigo-500" : "bg-white/10"}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ─── Field component ───────────────────────────────────────────────────────
const Field = ({ label, required, error, hint, children }) => (
  <div>
    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-[11px] text-zinc-600 mt-1">{hint}</p>}
    {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
  </div>
);

const inputCls = (err) => `w-full bg-zinc-900 border ${err ? "border-red-500/60" : "border-white/10"} rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors`;

// ─── Live mini preview ─────────────────────────────────────────────────────
const MiniPreview = ({ form }) => {
  const mediaUrl = form.localMediaUrl || form.existingMediaUrl || null;
  return (
    <div className="sticky top-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 text-center">Live Preview</p>
      <div className="relative w-full rounded-2xl overflow-hidden border border-white/8 shadow-2xl" style={{ paddingBottom: `${(192/375)*100}%`, background: "#111" }}>
        <div className="absolute inset-0">
          {mediaUrl ? (
            form.mediaType === "video"
              ? <video src={mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              : <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <HiOutlinePhoto className="text-3xl text-zinc-700" />
            </div>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(4,4,8,0.88) 0%, rgba(4,4,8,0.3) 45%, transparent 75%)" }} />
          <div className="absolute bottom-0 left-0 p-3">
            {form.adType && (
              <span className="block mb-1.5 px-1.5 py-0.5 rounded text-[6px] font-black uppercase bg-white/15 text-white w-fit">{form.badge || "SPONSOR"}</span>
            )}
            <p className="text-white text-[11px] font-black leading-tight mb-1">{form.title || "Your Ad Title"}</p>
            <p className="text-zinc-400 text-[8px] mb-2 truncate max-w-[60%]">{form.description || "Your description"}</p>
            <button className="px-2.5 py-1 rounded-lg bg-white text-black text-[7px] font-black uppercase">
              {form.ctaText || "Learn More"} →
            </button>
          </div>
        </div>
      </div>
      <p className="text-[9px] text-zinc-700 text-center mt-2">375×192px · Home Banner</p>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const AdvertiseNewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { backendURL, user } = useAppContext();
  const fileInputRef = useRef(null);

  const prefill = location.state || {};

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    // Step 0
    adType: "",
    // Step 1
    placement: prefill.placement || "home_banner",
    days: prefill.days || 7,
    // Step 2
    title: "",
    description: "",
    ctaText: "",
    badge: "SPONSOR",
    mediaFile: null,
    localMediaUrl: "",
    mediaType: "image",
    youtubeUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    websiteUrl: "",
    otherUrl: "",
    additionalNotes: "",
    // Step 3
    advertiserName: user?.name || "",
    advertiserEmail: user?.email || "",
    advertiserPhone: "",
    companyName: "",
    suvixUserId: user?._id || "",
    agreeTerms: false,
    // Step 4 — review only
  });

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const clearError = (k) => setErrors(e => { const n = { ...e }; delete n[k]; return n; });

  // Auto-fill user info when user loads
  useEffect(() => {
    if (user) {
      setField("advertiserName", user.name || "");
      setField("advertiserEmail", user.email || "");
      setField("suvixUserId", user._id || "");
    }
  }, [user]);

  // Auto-fill CTA suggestion when type changes
  useEffect(() => {
    if (form.adType && CTA_SUGGESTIONS[form.adType]) {
      setField("ctaText", CTA_SUGGESTIONS[form.adType][0]);
    }
  }, [form.adType]);

  const price = DURATIONS.find(d => d.days === form.days)?.prices[form.placement] || 0;

  // File pick
  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    setField("mediaFile", file);
    setField("localMediaUrl", URL.createObjectURL(file));
    setField("mediaType", isVideo ? "video" : "image");
    clearError("mediaFile");
    e.target.value = "";
  };

  // Validation per step
  const validate = () => {
    const e = {};
    if (step === 0 && !form.adType) e.adType = "Please select an ad type";
    if (step === 1) {
      if (!form.placement) e.placement = "Select a placement";
      if (!form.days) e.days = "Select a duration";
    }
    if (step === 2) {
      if (!form.title.trim()) e.title = "Title is required";
      if (!form.description.trim()) e.description = "Description is required";
      if (!form.ctaText.trim()) e.ctaText = "CTA text is required";
      if (!form.mediaFile && !form.localMediaUrl) e.mediaFile = "Upload a banner image or video";
      const reqLinks = TYPE_LINKS[form.adType]?.filter(l => l.required) || [];
      reqLinks.forEach(l => { if (!form[l.key]?.trim()) e[l.key] = `${l.label.replace(" *", "")} is required`; });
    }
    if (step === 3) {
      if (!form.advertiserName.trim()) e.advertiserName = "Name is required";
      if (!form.advertiserEmail.trim()) e.advertiserEmail = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.advertiserEmail)) e.advertiserEmail = "Enter a valid email";
      if (!form.advertiserPhone.trim()) e.advertiserPhone = "Phone is required";
      if (!form.agreeTerms) e.agreeTerms = "You must agree to the terms";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, 4)); };
  const prev = () => setStep(s => Math.max(s - 1, 0));

  // Submit
  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      if (form.mediaFile) fd.append("media", form.mediaFile);
      const fields = ["adType","placement","title","description","ctaText","badge","mediaType","youtubeUrl","instagramUrl","facebookUrl","websiteUrl","otherUrl","advertiserName","advertiserEmail","advertiserPhone","companyName","suvixUserId","additionalNotes"];
      fields.forEach(k => { if (form[k]) fd.append(k, form[k]); });
      fd.append("days", form.days);
      fd.append("requestedPrice", price);
      if (user?._id) fd.append("userId", user._id);

      const { data } = await axios.post(`${backendURL}/api/ad-requests`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmitResult(data);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || "Submission failed. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────
  if (submitResult) {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
            <HiOutlineCheckCircle className="text-4xl text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black mb-3">Request Submitted!</h1>
          <p className="text-zinc-400 mb-2">Your ad request has been received.</p>
          {submitResult.requestId && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 mb-6">
              <span className="text-xs text-zinc-500">Request ID:</span>
              <span className="text-sm font-black text-indigo-400">{submitResult.requestId}</span>
            </div>
          )}
          <div className="bg-zinc-900/60 border border-white/8 rounded-2xl p-6 text-left mb-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400">What Happens Next</h3>
            {[
              { step: "1", text: "Our team reviews your ad within 24–48 hours", time: "Now → 48hrs" },
              { step: "2", text: "You receive an approval or revision email", time: "After review" },
              { step: "3", text: "We send a payment link once approved", time: "After approval" },
              { step: "4", text: "Pay and your campaign goes live on your start date", time: "After payment" },
            ].map(({ step: s, text, time }) => (
              <div key={s} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-black text-indigo-400">{s}</span>
                </div>
                <div>
                  <p className="text-sm text-zinc-300">{text}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{time}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-600 mb-6">We'll send updates to <span className="text-zinc-400">{form.advertiserEmail}</span></p>
          <div className="flex gap-3">
            <button onClick={() => navigate("/")} className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/25 text-sm font-bold transition-all">Back to Home</button>
            <button onClick={() => navigate("/advertise")} className="flex-1 py-3 rounded-xl bg-indigo-500 text-white text-sm font-black hover:bg-indigo-400 transition-all">View Pricing</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Step content renderer ──────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      // ── STEP 0: Ad Type ────────────────────────────────────────────────
      case 0:
        return (
          <div>
            <h2 className="text-2xl font-black mb-2">What are you promoting?</h2>
            <p className="text-zinc-500 text-sm mb-8">Select the type that best matches your ad. This helps us tailor your submission form.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {AD_TYPES.map(({ id, label, icon: Icon, color, desc }) => (
                <button
                  key={id}
                  onClick={() => { setField("adType", id); clearError("adType"); }}
                  className={`p-4 rounded-2xl border text-left transition-all ${form.adType === id ? "border-transparent" : "border-white/8 bg-zinc-900/40 hover:border-white/20"}`}
                  style={form.adType === id ? { background: `${color}15`, borderColor: `${color}60`, boxShadow: `0 0 0 1px ${color}30` } : {}}
                >
                  <Icon className="text-2xl mb-3" style={{ color }} />
                  <p className="text-sm font-bold text-white mb-0.5">{label}</p>
                  <p className="text-xs text-zinc-500">{desc}</p>
                  {form.adType === id && (
                    <div className="mt-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: color }}>
                      <HiOutlineCheck className="text-[9px] text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {errors.adType && <p className="text-red-400 text-xs mt-3">{errors.adType}</p>}
          </div>
        );

      // ── STEP 1: Placement + Duration ───────────────────────────────────
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-black mb-2">Choose Placement & Duration</h2>
            <p className="text-zinc-500 text-sm mb-8">Select where you want your ad to appear and how long.</p>

            <div className="mb-8">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-3">Ad Placement</label>
              <div className="grid sm:grid-cols-3 gap-3">
                {PLACEMENTS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setField("placement", p.id); clearError("placement"); }}
                    className={`p-5 rounded-2xl border text-left transition-all relative ${form.placement === p.id ? "border-transparent" : "border-white/8 bg-zinc-900/40 hover:border-white/20"}`}
                    style={form.placement === p.id ? { background: `${p.color}12`, borderColor: `${p.color}50`, boxShadow: `0 0 0 1px ${p.color}25` } : {}}
                  >
                    {p.badge && <span className="absolute top-2 right-2 text-[8px] font-black uppercase px-1.5 py-0.5 rounded" style={{ background: p.color, color: "#000" }}>{p.badge}</span>}
                    <div className="w-8 h-8 rounded-xl mb-3 flex items-center justify-center" style={{ background: `${p.color}20` }}>
                      <HiOutlineRocketLaunch className="text-sm" style={{ color: p.color }} />
                    </div>
                    <p className="font-black text-white text-sm mb-1">{p.label}</p>
                    <p className="text-xs text-zinc-500 mb-2 leading-relaxed">{p.desc}</p>
                    <p className="text-[10px] font-bold" style={{ color: p.color }}>{p.reach}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">Best for: {p.best}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-3">Campaign Duration</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {DURATIONS.map(d => {
                  const p = d.prices[form.placement];
                  const save = d.save?.[form.placement];
                  return (
                    <button
                      key={d.days}
                      onClick={() => { setField("days", d.days); clearError("days"); }}
                      className={`p-3 rounded-xl border text-center transition-all relative ${form.days === d.days ? "border-indigo-500 bg-indigo-500/10" : "border-white/8 bg-zinc-900/40 hover:border-white/20"}`}
                    >
                      {d.popular && <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded-full uppercase whitespace-nowrap">Popular</span>}
                      <p className={`text-xs font-bold mb-1 ${form.days === d.days ? "text-indigo-300" : "text-white"}`}>{d.label}</p>
                      <p className="text-sm font-black text-white">₹{p.toLocaleString("en-IN")}</p>
                      {save && <p className="text-[9px] text-emerald-400 mt-0.5">-{save}</p>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price summary */}
            <div className="mt-6 p-4 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">{PLACEMENTS.find(p => p.id === form.placement)?.label} · {DURATIONS.find(d => d.days === form.days)?.label}</p>
                <p className="text-xl font-black text-white mt-0.5">₹{price.toLocaleString("en-IN")}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">Per day</p>
                <p className="text-sm font-bold text-zinc-300">₹{Math.round(price / form.days).toLocaleString("en-IN")}</p>
              </div>
            </div>
            <p className="text-xs text-zinc-600 mt-2 text-center">💳 Payment collected only after admin approval</p>
          </div>
        );

      // ── STEP 2: Creative ───────────────────────────────────────────────
      case 2:
        return (
          <div className="grid lg:grid-cols-[1fr_260px] gap-8">
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black mb-2">Your Ad Creative</h2>
                <p className="text-zinc-500 text-sm">Upload your banner and write your ad copy.</p>
              </div>

              {/* Media upload */}
              <Field label="Banner Media" required error={errors.mediaFile} hint="Image: JPG, PNG, WebP · Min 375×192px · Max 10MB   Video: MP4, MOV · Max 60s · Max 200MB">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${errors.mediaFile ? "border-red-500/40" : "border-white/10 hover:border-indigo-500/50"}`}
                  onMouseEnter={e => { if (!errors.mediaFile) e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; }}
                  onMouseLeave={e => { if (!errors.mediaFile) e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                >
                  {form.localMediaUrl ? (
                    <div className="relative">
                      {form.mediaType === "video"
                        ? <video src={form.localMediaUrl} className="max-h-36 mx-auto rounded-xl" muted />
                        : <img src={form.localMediaUrl} className="max-h-36 mx-auto rounded-xl object-contain" alt="" />
                      }
                      <p className="text-xs text-indigo-400 font-bold mt-3">Click to replace</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-center gap-3 mb-3">
                        <HiOutlinePhoto className="text-3xl text-zinc-600" />
                        <HiOutlineVideoCamera className="text-3xl text-zinc-600" />
                      </div>
                      <p className="text-sm text-zinc-400 font-semibold mb-1">Click to upload image or video</p>
                      <p className="text-xs text-zinc-600">Recommended: 375×192px or wider, 16:5 ratio</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFilePick} className="hidden" />
              </Field>

              {/* Ad copy */}
              <Field label="Ad Headline" required error={errors.title} hint="Short, punchy title shown on the banner (max 60 chars)">
                <input
                  value={form.title}
                  onChange={e => { setField("title", e.target.value); clearError("title"); }}
                  className={inputCls(errors.title)}
                  placeholder="e.g. Subscribe to India's Top Editing Channel"
                  maxLength={60}
                />
                <p className="text-[10px] text-zinc-700 mt-1 text-right">{form.title.length}/60</p>
              </Field>

              <Field label="Short Description" required error={errors.description} hint="One line shown under the title (max 120 chars)">
                <input
                  value={form.description}
                  onChange={e => { setField("description", e.target.value); clearError("description"); }}
                  className={inputCls(errors.description)}
                  placeholder="e.g. 500K+ subscribers · Free tutorials every week"
                  maxLength={120}
                />
              </Field>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="CTA Button Text" required error={errors.ctaText}>
                  <input
                    value={form.ctaText}
                    onChange={e => { setField("ctaText", e.target.value); clearError("ctaText"); }}
                    className={inputCls(errors.ctaText)}
                    placeholder="Subscribe Now"
                    maxLength={25}
                  />
                  {form.adType && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {CTA_SUGGESTIONS[form.adType]?.map(s => (
                        <button key={s} onClick={() => setField("ctaText", s)} className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all">{s}</button>
                      ))}
                    </div>
                  )}
                </Field>
                <Field label="Badge Text" hint="Small label shown above title (default: SPONSOR)">
                  <input
                    value={form.badge}
                    onChange={e => setField("badge", e.target.value)}
                    className={inputCls(false)}
                    placeholder="SPONSOR"
                    maxLength={20}
                  />
                </Field>
              </div>

              {/* Type-specific links */}
              {form.adType && TYPE_LINKS[form.adType] && (
                <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/50 border border-white/6">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Your Links</p>
                  {TYPE_LINKS[form.adType].map(({ key, label, ph, icon: Icon, color, required: req }) => (
                    <Field key={key} label={label} required={req} error={errors[key]}>
                      <div className="relative">
                        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color }} />
                        <input
                          value={form[key]}
                          onChange={e => { setField(key, e.target.value); clearError(key); }}
                          className={`${inputCls(errors[key])} pl-9`}
                          placeholder={ph}
                        />
                      </div>
                    </Field>
                  ))}
                  {/* Always show optional other links */}
                  {form.adType !== "website" && (
                    <Field label="Website URL (optional)">
                      <div className="relative">
                        <FaGlobe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500" />
                        <input value={form.websiteUrl} onChange={e => setField("websiteUrl", e.target.value)} className={`${inputCls(false)} pl-9`} placeholder="https://yourwebsite.com" />
                      </div>
                    </Field>
                  )}
                </div>
              )}

              <Field label="Additional Notes to Admin (optional)" hint="Any special instructions or context for our review team">
                <textarea
                  value={form.additionalNotes}
                  onChange={e => setField("additionalNotes", e.target.value)}
                  className={`${inputCls(false)} resize-none h-20`}
                  placeholder="e.g. Please ensure the banner runs on weekends, targeting video editing audience..."
                />
              </Field>
            </div>

            {/* Live preview sidebar */}
            <div className="hidden lg:block">
              <MiniPreview form={form} />
            </div>
          </div>
        );

      // ── STEP 3: Details ────────────────────────────────────────────────
      case 3:
        return (
          <div className="max-w-xl">
            <h2 className="text-2xl font-black mb-2">Your Contact Details</h2>
            <p className="text-zinc-500 text-sm mb-8">We'll use this to send you review updates and the payment link.</p>

            {user && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 mb-6">
                <HiOutlineCheckCircle className="text-emerald-400 text-lg flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-400">Logged in as SuviX user</p>
                  <p className="text-xs text-zinc-500">Your details have been pre-filled from your account</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name" required error={errors.advertiserName}>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500" />
                    <input value={form.advertiserName} onChange={e => { setField("advertiserName", e.target.value); clearError("advertiserName"); }} className={`${inputCls(errors.advertiserName)} pl-9`} placeholder="John Doe" />
                  </div>
                </Field>
                <Field label="Company / Brand Name" hint="Leave blank if individual">
                  <div className="relative">
                    <HiOutlineBuildingOffice2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500" />
                    <input value={form.companyName} onChange={e => setField("companyName", e.target.value)} className={`${inputCls(false)} pl-9`} placeholder="Acme Studios" />
                  </div>
                </Field>
              </div>

              <Field label="Email Address" required error={errors.advertiserEmail} hint="All communication and payment link sent here">
                <div className="relative">
                  <HiOutlineEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500" />
                  <input value={form.advertiserEmail} onChange={e => { setField("advertiserEmail", e.target.value); clearError("advertiserEmail"); }} className={`${inputCls(errors.advertiserEmail)} pl-9`} placeholder="you@example.com" type="email" />
                </div>
              </Field>

              <Field label="Phone Number" required error={errors.advertiserPhone} hint="For urgent communication if needed">
                <div className="relative">
                  <HiOutlinePhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500" />
                  <input value={form.advertiserPhone} onChange={e => { setField("advertiserPhone", e.target.value); clearError("advertiserPhone"); }} className={`${inputCls(errors.advertiserPhone)} pl-9`} placeholder="+91 98765 43210" type="tel" />
                </div>
              </Field>

              {user && (
                <Field label="SuviX User ID" hint="Automatically linked — helps us verify your account">
                  <div className="relative">
                    <HiOutlineSparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-indigo-400" />
                    <input value={form.suvixUserId} readOnly className={`${inputCls(false)} pl-9 opacity-60 cursor-not-allowed`} />
                  </div>
                </Field>
              )}

              <div className={`p-4 rounded-xl border ${errors.agreeTerms ? "border-red-500/40 bg-red-500/5" : "border-white/8 bg-zinc-900/40"}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => { setField("agreeTerms", !form.agreeTerms); clearError("agreeTerms"); }}
                    className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-all ${form.agreeTerms ? "bg-indigo-500 border-indigo-500" : "border-white/25 bg-transparent"}`}
                  >
                    {form.agreeTerms && <HiOutlineCheck className="text-white text-[10px]" />}
                  </button>
                  <span className="text-xs text-zinc-400 leading-relaxed">
                    I agree to SuviX's <a href="/advertise#faq" className="text-indigo-400 underline">Ad Guidelines</a> and understand that:
                    <br />• Ads may be rejected if they violate our content policy
                    <br />• Payment is required after approval before the campaign goes live
                    <br />• Refunds are issued for rejected ads. No refunds once live.
                    <br />• SuviX reserves the right to remove ads that violate guidelines
                  </span>
                </label>
                {errors.agreeTerms && <p className="text-red-400 text-xs mt-2">{errors.agreeTerms}</p>}
              </div>
            </div>
          </div>
        );

      // ── STEP 4: Review & Submit ─────────────────────────────────────────
      case 4:
        const adTypeInfo = AD_TYPES.find(t => t.id === form.adType);
        const placementInfo = PLACEMENTS.find(p => p.id === form.placement);
        const durationInfo = DURATIONS.find(d => d.days === form.days);
        return (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-black mb-2">Review Your Request</h2>
            <p className="text-zinc-500 text-sm mb-8">Check everything before submitting. You can go back to make changes.</p>

            <div className="space-y-4">
              {/* Campaign summary */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/8 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Campaign</h4>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/3">
                    <p className="text-[10px] text-zinc-500 mb-1">Type</p>
                    <div className="flex items-center gap-1.5">
                      {adTypeInfo && <adTypeInfo.icon className="text-sm" style={{ color: adTypeInfo.color }} />}
                      <p className="text-sm font-bold text-white">{adTypeInfo?.label}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/3">
                    <p className="text-[10px] text-zinc-500 mb-1">Placement</p>
                    <p className="text-sm font-bold text-white">{placementInfo?.label}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/3">
                    <p className="text-[10px] text-zinc-500 mb-1">Duration</p>
                    <p className="text-sm font-bold text-white">{durationInfo?.label}</p>
                  </div>
                </div>
              </div>

              {/* Creative summary */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/8">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Creative</h4>
                <div className="flex gap-4 items-start">
                  {form.localMediaUrl && (
                    <div className="w-32 flex-shrink-0 rounded-xl overflow-hidden border border-white/8" style={{ aspectRatio: "375/192" }}>
                      {form.mediaType === "video"
                        ? <video src={form.localMediaUrl} className="w-full h-full object-cover" muted />
                        : <img src={form.localMediaUrl} className="w-full h-full object-cover" alt="" />
                      }
                    </div>
                  )}
                  <div className="space-y-1.5 min-w-0">
                    <p className="text-white font-black text-sm truncate">{form.title}</p>
                    <p className="text-zinc-400 text-xs truncate">{form.description}</p>
                    <p className="text-indigo-400 text-xs font-bold">CTA: "{form.ctaText}"</p>
                    {form.websiteUrl && <p className="text-zinc-600 text-xs truncate">{form.websiteUrl}</p>}
                    {form.youtubeUrl && <p className="text-zinc-600 text-xs truncate">{form.youtubeUrl}</p>}
                    {form.instagramUrl && <p className="text-zinc-600 text-xs truncate">{form.instagramUrl}</p>}
                  </div>
                </div>
              </div>

              {/* Contact summary */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/8 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Your Details</h4>
                {[
                  { label: "Name",    value: form.advertiserName },
                  { label: "Email",   value: form.advertiserEmail },
                  { label: "Phone",   value: form.advertiserPhone },
                  { label: "Company", value: form.companyName || "–" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 text-xs">{label}</span>
                    <span className="text-zinc-200 font-medium text-xs">{value}</span>
                  </div>
                ))}
              </div>

              {/* Price */}
              <div className="p-5 rounded-2xl border" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))", borderColor: "rgba(99,102,241,0.25)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Campaign Total</p>
                    <p className="text-3xl font-black text-white">₹{price.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-zinc-500 mt-1">₹{Math.round(price / form.days)}/day · {durationInfo?.label}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-emerald-400 justify-end mb-1">
                      <HiOutlineCheckCircle className="text-sm" />
                      <span className="text-xs font-bold">Pay After Approval</span>
                    </div>
                    <p className="text-[10px] text-zinc-600">No charge today</p>
                  </div>
                </div>
              </div>

              {errors.submit && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {errors.submit}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white" style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[400px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, #6366f1, transparent 65%)" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/6 bg-[#070709]/90 backdrop-blur px-4 sm:px-6 py-4 flex items-center justify-between">
        <button onClick={() => step === 0 ? navigate("/advertise") : prev()} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-semibold">
          <HiOutlineArrowLeft /> {step === 0 ? "Back to Advertise" : "Previous"}
        </button>
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Ad Request</p>
          <p className="text-xs text-zinc-600">Step {step + 1} of {STEPS.length}</p>
        </div>
        <button onClick={() => navigate("/advertise")} className="text-zinc-600 hover:text-white transition-colors">
          <HiOutlineXMark className="text-xl" />
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <StepBar current={step} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/6">
          <button
            onClick={prev}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/25 text-sm font-bold transition-all ${step === 0 ? "invisible" : ""}`}
          >
            <HiOutlineArrowLeft /> Back
          </button>

          {step < 4 ? (
            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white text-sm uppercase tracking-wider transition-all hover:opacity-90 active:scale-98"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}
            >
              Continue <HiOutlineArrowRight />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-black text-white text-sm uppercase tracking-wider transition-all hover:opacity-90 active:scale-98 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 8px 24px rgba(16,185,129,0.35)" }}
            >
              {saving ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Submitting…</>
              ) : (
                <><HiOutlineClipboardDocumentCheck /> Submit Ad Request</>
              )}
            </button>
          )}
        </div>

        {/* Step helper text */}
        <p className="text-center text-[11px] text-zinc-700 mt-4">
          {["Select your ad type to continue", "Choose where your ad appears and for how long", "Upload your creative and write your ad copy", "Your details for review communication", "Submit your request — no payment today"][step]}
        </p>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');`}</style>
    </div>
  );
};

export default AdvertiseNewPage;