import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineRocketLaunch,
  HiOutlineChartBarSquare,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlineSparkles,
  HiOutlineBolt,
  HiOutlineGlobeAlt,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineEye,
  HiOutlineCursorArrowRipple,
  HiChevronDown,
  HiChevronUp,
} from "react-icons/hi2";
import { FaYoutube, FaInstagram } from "react-icons/fa";

// ─── Pricing data ──────────────────────────────────────────────────────────
const PRICING = {
  home_banner: { label: "Home Banner", color: "#6366f1", days: { 1: 499, 3: 1299, 7: 2499, 15: 4499, 30: 7999 } },
  reels_feed:  { label: "Reels Feed",  color: "#10b981", days: { 1: 299, 3: 799,  7: 1499, 15: 2799, 30: 4999 } },
  both:        { label: "Both",        color: "#f59e0b", days: { 1: 699, 3: 1799, 7: 3499, 15: 6499, 30: 11499 } },
};

const DURATION_LABELS = { 1: "1 Day", 3: "3 Days", 7: "7 Days", 15: "15 Days", 30: "30 Days" };

const SAVINGS = {
  home_banner: { 3: "13%", 7: "29%", 15: "40%", 30: "47%" },
  reels_feed:  { 3: "11%", 7: "29%", 15: "37%", 30: "44%" },
  both:        { 3: "14%", 7: "33%", 15: "39%", 30: "45%" },
};

const FAQ_ITEMS = [
  { q: "How long does review take?", a: "Our team reviews all ad requests within 24–48 hours. You'll receive an email update at every stage — submitted, under review, approved, or rejected." },
  { q: "When do I pay?", a: "Payment is required after your ad is approved and before it goes live. We'll send you a payment link via email. No upfront cost." },
  { q: "What file formats are accepted?", a: "Images: JPG, PNG, WebP (min 375×192px). Videos: MP4, MOV (max 60 seconds, max 200MB). Higher quality media performs better." },
  { q: "Can I cancel or modify my ad after approval?", a: "You can request modifications before the campaign start date. Once live, the ad cannot be edited but can be paused with 24-hour notice." },
  { q: "What content is not allowed?", a: "Adult content, misleading claims, competitor attacks, illegal products/services, content without proper rights, or anything that violates our community guidelines." },
  { q: "Will I get a report after the campaign?", a: "Yes. You'll receive a campaign report showing total impressions, clicks, and CTR. Available in your campaign dashboard throughout and after the campaign." },
  { q: "Can I target specific users?", a: "All ads are shown to all SuviX users on your selected placement. Audience targeting is on our roadmap for future releases." },
  { q: "Do you offer refunds?", a: "If we reject your ad, you get a 100% refund. If you cancel before the start date, 80% refund. No refunds once the campaign is live." },
];

const STEPS = [
  { icon: HiOutlineRocketLaunch, label: "Submit Request",     desc: "Fill out the form with your ad creative and campaign details. Takes ~5 minutes." },
  { icon: HiOutlineShieldCheck,  label: "Admin Review",       desc: "Our team reviews your ad within 24–48 hours to ensure it meets our guidelines." },
  { icon: HiOutlineCurrencyRupee, label: "Pay & Confirm",    desc: "Once approved, we send a payment link. Pay and your campaign is confirmed." },
  { icon: HiOutlineBolt,         label: "Go Live",            desc: "Your ad activates on your chosen start date and reaches thousands of creators." },
];

const STATS = [
  { icon: HiOutlineUserGroup,        value: "10,000+", label: "Active Creators" },
  { icon: HiOutlineEye,              value: "50K+",    label: "Monthly Impressions" },
  { icon: HiOutlineCursorArrowRipple, value: "4.8%",   label: "Avg. Click Rate" },
  { icon: HiOutlineChartBarSquare,   value: "₹499",    label: "Starts From" },
];

// ─── Mini Banner Mockup ────────────────────────────────────────────────────
const BannerMockup = () => (
  <div className="relative w-full rounded-2xl overflow-hidden border border-white/10" style={{ aspectRatio: "375/192", background: "linear-gradient(135deg, #1a1035, #0d1a2e)" }}>
    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url('/hero_banner_1_1766946342128.png')", backgroundSize: "cover", backgroundPosition: "center" }} />
    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(4,4,8,0.92) 0%, rgba(4,4,8,0.3) 50%, transparent 80%)" }} />
    <div className="absolute bottom-0 left-0 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest bg-indigo-500/80 text-white">YOUR BRAND</span>
        <span className="px-2 py-0.5 rounded text-[6px] font-black uppercase text-white bg-amber-500/80">SPONSOR</span>
      </div>
      <p className="text-white text-sm font-black leading-tight mb-2">Your Ad Headline Here</p>
      <p className="text-zinc-400 text-[9px] mb-3">Your short description shown here</p>
      <button className="px-3 py-1.5 rounded-lg bg-white text-black text-[9px] font-black uppercase tracking-wider">Visit Now →</button>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/8">
      <div className="h-full w-2/5 bg-white/50" />
    </div>
    <div className="absolute top-2 right-2 bg-black/40 backdrop-blur rounded-xl p-1.5 flex flex-col gap-1.5">
      {[{ c: "#fbbf24" }, { c: "#a78bfa" }, { c: "#34d399" }].map((d, i) => (
        <div key={i} className="w-5 h-5 rounded-full" style={{ background: i === 0 ? "#fff" : "transparent", border: i !== 0 ? "1px solid rgba(255,255,255,0.15)" : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: d.c }} />
        </div>
      ))}
    </div>
    {/* Label */}
    <div className="absolute top-3 left-3 bg-indigo-500/20 backdrop-blur border border-indigo-500/30 rounded-lg px-2 py-1">
      <span className="text-indigo-300 text-[9px] font-bold uppercase tracking-widest">Home Banner</span>
    </div>
  </div>
);

// ─── Mini Reels Card Mockup ────────────────────────────────────────────────
const ReelsMockup = () => (
  <div className="relative rounded-2xl overflow-hidden border border-white/10 mx-auto" style={{ width: 140, height: 240, background: "linear-gradient(135deg, #0a1f0e, #0d1a1a)" }}>
    <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "url('/gig_banner_1_1766948855701.png')", backgroundSize: "cover", backgroundPosition: "center" }} />
    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(4,4,8,0.95) 0%, transparent 60%)" }} />
    <div className="absolute top-2 left-2 bg-amber-500/80 rounded px-1.5 py-0.5">
      <span className="text-[6px] font-black uppercase text-white tracking-wider">SPONSORED</span>
    </div>
    <div className="absolute bottom-0 left-0 right-0 p-3">
      <span className="block text-white text-[10px] font-black leading-tight mb-1">Your Channel</span>
      <span className="block text-zinc-400 text-[8px] mb-2">Subscribe for more</span>
      <div className="flex items-center gap-1.5">
        <button className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500 text-[7px] font-black text-white uppercase">
          <FaYoutube className="text-[8px]" /> Subscribe
        </button>
      </div>
    </div>
    <div className="absolute top-2 right-2">
      <span className="text-[8px] text-emerald-400 font-bold bg-emerald-500/20 rounded px-1.5 py-0.5">Reels Feed</span>
    </div>
  </div>
);

// ─── Pricing Calculator ────────────────────────────────────────────────────
const PricingCalculator = ({ onSelect }) => {
  const [placement, setPlacement] = useState("home_banner");
  const [days, setDays] = useState(7);

  const price = PRICING[placement].days[days];
  const saving = SAVINGS[placement]?.[days];

  return (
    <div className="bg-zinc-900/60 border border-white/8 rounded-3xl p-6 sm:p-8">
      <h3 className="text-lg font-black text-white mb-6">Calculate Your Campaign Cost</h3>

      {/* Placement */}
      <div className="mb-5">
        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-3">Placement</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(PRICING).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setPlacement(key)}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${placement === key ? "text-white border-transparent" : "bg-zinc-800/60 text-zinc-400 border-white/5 hover:border-white/15"}`}
              style={placement === key ? { background: val.color, borderColor: val.color } : {}}
            >
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="mb-6">
        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-3">Duration</label>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(DURATION_LABELS).map(([d, label]) => (
            <button
              key={d}
              onClick={() => setDays(Number(d))}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${days === Number(d) ? "bg-white text-black border-white" : "bg-zinc-800/60 text-zinc-400 border-white/5 hover:border-white/20"}`}
            >
              {label}
              {SAVINGS[placement]?.[d] && Number(d) !== 1 && (
                <span className="ml-1 text-emerald-400 text-[9px]">-{SAVINGS[placement][d]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price display */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/8 mb-5">
        <div>
          <p className="text-xs text-zinc-500 mb-1">{PRICING[placement].label} · {DURATION_LABELS[days]}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">₹{price.toLocaleString("en-IN")}</span>
            {saving && <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Save {saving}</span>}
          </div>
          <p className="text-[10px] text-zinc-600 mt-1">₹{Math.round(price / days)}/day · Pay after approval</p>
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${PRICING[placement].color}20`, border: `1px solid ${PRICING[placement].color}40` }}>
          <HiOutlineCurrencyRupee className="text-xl" style={{ color: PRICING[placement].color }} />
        </div>
      </div>

      <button
        onClick={() => onSelect({ placement, days, price })}
        className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider text-white transition-all hover:opacity-90 active:scale-98 flex items-center justify-center gap-2"
        style={{ background: `linear-gradient(135deg, ${PRICING[placement].color}, ${PRICING[placement].color}cc)`, boxShadow: `0 8px 24px ${PRICING[placement].color}40` }}
      >
        Start This Campaign <HiOutlineArrowRight />
      </button>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────
const AdvertisePage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const handleSelectPackage = ({ placement, days, price }) => {
    navigate("/advertise/new", { state: { placement, days, price } });
  };

  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
  });

  return (
    <div className="min-h-screen bg-[#070709] text-white" style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[700px] h-[500px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, #6366f1, transparent 65%)" }} />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, #10b981, transparent 65%)" }} />
      </div>

      {/* ── HERO ── */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div {...fade(0)} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
            <HiOutlineSparkles className="text-sm" /> Advertise on SuviX
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            Reach India's Best<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #6366f1, #a78bfa, #10b981)" }}>
              Video Creators
            </span>
          </h1>
          <p className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Put your brand, channel, or product in front of 10,000+ active video editors and content creators. High-intent audience. Affordable rates. No hidden fees.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/advertise/new")}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-98"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 12px 40px rgba(99,102,241,0.4)" }}
            >
              <HiOutlineRocketLaunch /> Submit Ad Request — Free
            </button>
            <a href="#pricing" className="flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-zinc-300 text-sm border border-white/10 hover:border-white/25 hover:text-white transition-all">
              View Pricing <HiOutlineArrowRight />
            </a>
          </div>
        </motion.div>

        {/* ── MOCKUP PREVIEWS ── */}
        <motion.div {...fade(0.1)} className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
          <div>
            <div className="text-center mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Home Banner</span>
              <p className="text-zinc-600 text-xs mt-0.5">Shown to every homepage visitor</p>
            </div>
            <BannerMockup />
          </div>
          <div>
            <div className="text-center mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Reels Feed</span>
              <p className="text-zinc-600 text-xs mt-0.5">Shown between reels content</p>
            </div>
            <ReelsMockup />
          </div>
        </motion.div>

        {/* ── STATS ── */}
        <motion.div {...fade(0.15)} className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center p-5 rounded-2xl bg-zinc-900/50 border border-white/6">
              <Icon className="text-xl text-indigo-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── WHAT YOU CAN ADVERTISE ── */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div {...fade()} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black mb-3">What Can You Advertise?</h2>
          <p className="text-zinc-500 text-sm">Any brand, channel, product, or service is welcome.</p>
        </motion.div>
        <motion.div {...fade(0.1)} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: FaYoutube,              label: "YouTube Channel",   desc: "Grow subscribers & views",          color: "#FF0000", bg: "rgba(255,0,0,0.08)" },
            { icon: FaInstagram,            label: "Instagram Page",    desc: "Grow followers & engagement",       color: "#E1306C", bg: "rgba(225,48,108,0.08)" },
            { icon: HiOutlineGlobeAlt,      label: "Website / Brand",   desc: "Drive traffic to your site",        color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
            { icon: HiOutlineRocketLaunch,  label: "Mobile App",        desc: "Get more downloads",                color: "#10b981", bg: "rgba(16,185,129,0.08)" },
            { icon: HiOutlineChartBarSquare, label: "Online Course",    desc: "Reach learners in your niche",      color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
            { icon: HiOutlineBolt,          label: "Event / Launch",    desc: "Promote launches & webinars",       color: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
            { icon: HiOutlineUserGroup,     label: "Freelancer / Editor", desc: "Get more editing clients",        color: "#34d399", bg: "rgba(52,211,153,0.08)" },
            { icon: HiOutlineSparkles,      label: "E-commerce Store",  desc: "Sell products to creators",         color: "#fb923c", bg: "rgba(251,146,60,0.08)" },
          ].map(({ icon: Icon, label, desc, color, bg }) => (
            <div key={label} className="p-5 rounded-2xl border border-white/6 hover:border-white/15 transition-all group cursor-pointer" style={{ background: bg }}>
              <Icon className="text-2xl mb-3 transition-transform group-hover:scale-110" style={{ color }} />
              <p className="text-sm font-bold text-white mb-1">{label}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div {...fade()} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black mb-3">How It Works</h2>
          <p className="text-zinc-500 text-sm">From request to live in as little as 48 hours</p>
        </motion.div>
        <div className="grid sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {STEPS.map(({ icon: Icon, label, desc }, i) => (
            <motion.div key={label} {...fade(i * 0.08)} className="relative text-center">
              {i < STEPS.length - 1 && (
                <div className="hidden sm:block absolute top-7 left-[60%] w-full h-px" style={{ background: "linear-gradient(to right, rgba(99,102,241,0.4), transparent)" }} />
              )}
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center relative z-10" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))", border: "1px solid rgba(99,102,241,0.25)" }}>
                <Icon className="text-xl text-indigo-400" />
              </div>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-indigo-500 text-white text-[9px] font-black flex items-center justify-center z-20">{i + 1}</div>
              <p className="font-black text-white text-sm mb-1.5">{label}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div {...fade()} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black mb-3">Simple, Transparent Pricing</h2>
          <p className="text-zinc-500 text-sm">No hidden fees. Pay only after your ad is approved.</p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 max-w-5xl mx-auto items-start">
          {/* Table */}
          <motion.div {...fade(0.1)} className="overflow-x-auto rounded-3xl border border-white/8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left p-4 text-zinc-500 text-xs uppercase tracking-widest font-bold">Duration</th>
                  <th className="p-4 text-indigo-400 text-xs uppercase tracking-widest font-bold text-center">Home Banner</th>
                  <th className="p-4 text-emerald-400 text-xs uppercase tracking-widest font-bold text-center">Reels Feed</th>
                  <th className="p-4 text-amber-400 text-xs uppercase tracking-widest font-bold text-center">Both</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(DURATION_LABELS).map(([d, label], i) => (
                  <tr key={d} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i === 2 ? "relative" : ""}`}>
                    <td className="p-4 font-bold text-white">
                      {label}
                      {Number(d) === 7 && <span className="ml-2 text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold">POPULAR</span>}
                    </td>
                    <td className="p-4 text-center text-white font-semibold">
                      ₹{PRICING.home_banner.days[d].toLocaleString("en-IN")}
                      {SAVINGS.home_banner[d] && <span className="block text-[9px] text-emerald-400">save {SAVINGS.home_banner[d]}</span>}
                    </td>
                    <td className="p-4 text-center text-white font-semibold">
                      ₹{PRICING.reels_feed.days[d].toLocaleString("en-IN")}
                      {SAVINGS.reels_feed[d] && <span className="block text-[9px] text-emerald-400">save {SAVINGS.reels_feed[d]}</span>}
                    </td>
                    <td className="p-4 text-center text-white font-semibold">
                      ₹{PRICING.both.days[d].toLocaleString("en-IN")}
                      {SAVINGS.both[d] && <span className="block text-[9px] text-emerald-400">save {SAVINGS.both[d]}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t border-white/5 text-center">
              <p className="text-xs text-zinc-600">All prices in INR. GST applicable. Pay after approval only.</p>
            </div>
          </motion.div>

          {/* Calculator */}
          <motion.div {...fade(0.15)}>
            <PricingCalculator onSelect={handleSelectPackage} />
          </motion.div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div {...fade()} className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-10">Everything Included</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Custom banner design using your media and branding",
              "Live preview before submission — see exactly how it looks",
              "Dedicated campaign dashboard with real-time analytics",
              "Impression & click tracking throughout campaign",
              "Email notifications at every status change",
              "Campaign performance report after expiry",
              "Reels feed card design (if Reels placement selected)",
              "Ad details page showing your full brand story",
              "Link buttons to all your social channels",
              "24/7 ad serving — never goes down",
            ].map((item, i) => (
              <motion.div key={i} {...fade(i * 0.04)} className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/5">
                <HiOutlineCheckCircle className="text-emerald-400 text-lg flex-shrink-0 mt-0.5" />
                <span className="text-sm text-zinc-300 leading-relaxed">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-4 sm:px-6 max-w-3xl mx-auto">
        <motion.div {...fade()} className="text-center mb-10">
          <h2 className="text-3xl font-black mb-2">Frequently Asked Questions</h2>
          <p className="text-zinc-500 text-sm">Everything you need to know before submitting</p>
        </motion.div>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div key={i} {...fade(i * 0.04)} className="border border-white/8 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/3 transition-colors"
              >
                <span className="font-bold text-sm text-white pr-4">{item.q}</span>
                {openFaq === i ? <HiChevronUp className="text-zinc-400 flex-shrink-0" /> : <HiChevronDown className="text-zinc-400 flex-shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-4">
                  {item.a}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-24 px-4 sm:px-6">
        <motion.div {...fade()} className="max-w-2xl mx-auto text-center">
          <div className="p-10 rounded-[2.5rem] border border-indigo-500/20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))" }}>
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 50% 0%, #6366f1, transparent 60%)" }} />
            <HiOutlineRocketLaunch className="text-4xl text-indigo-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black mb-3">Ready to Grow Your Brand?</h2>
            <p className="text-zinc-400 mb-8 text-sm leading-relaxed">Submit your ad request today. No upfront payment — pay only after we approve your campaign.</p>
            <button
              onClick={() => navigate("/advertise/new")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white text-sm uppercase tracking-widest transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 12px 40px rgba(99,102,241,0.4)" }}
            >
              Submit Ad Request — It's Free <HiOutlineArrowRight />
            </button>
            <p className="text-zinc-600 text-xs mt-4">No payment until approved · Review within 48 hours · Cancel anytime before go-live</p>
          </div>
        </motion.div>
      </section>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');`}</style>
    </div>
  );
};

export default AdvertisePage;