import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import UnifiedNavigation from "../components/UnifiedNavigation.jsx";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import { repairUrl } from "../utils/urlHelper";
import axios from "axios";
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
  HiOutlineCurrencyRupee,
  HiOutlineEye,
  HiOutlineCursorArrowRipple,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineSpeakerWave,
  HiOutlinePlay,
} from "react-icons/hi2";
import { FaYoutube, FaInstagram } from "react-icons/fa";

// ─── Data ──────────────────────────────────────────────────────────────────
const PRICING = {
  home_banner: { label: "Home Banner", days: { 1: 499, 3: 1299, 7: 2499, 15: 4499, 30: 7999 } },
  reels_feed:  { label: "Reels Feed",  days: { 1: 299, 3: 799,  7: 1499, 15: 2799, 30: 4999 } },
  both:        { label: "Both",        days: { 1: 699, 3: 1799, 7: 3499, 15: 6499, 30: 11499 } },
};
const DURATION_LABELS = { 1: "1 Day", 3: "3 Days", 7: "7 Days", 15: "15 Days", 30: "30 Days" };
const SAVINGS = {
  home_banner: { 3: "13%", 7: "29%", 15: "40%", 30: "47%" },
  reels_feed:  { 3: "11%", 7: "29%", 15: "37%", 30: "44%" },
  both:        { 3: "14%", 7: "33%", 15: "39%", 30: "45%" },
};
const FAQ_ITEMS = [
  { q: "How long does review take?", a: "Our team reviews all ad requests within 24–48 hours. You'll receive an email update at every stage — submitted, under review, approved, or rejected." },
  { q: "When do I pay?", a: "Payment is required after your ad is approved and before it goes live. We'll send you a payment link via email. No upfront cost today." },
  { q: "What file formats are accepted?", a: "Images: JPG, PNG, WebP (min 375×192px). Videos: MP4, MOV (max 60 seconds, max 200MB). Higher quality media performs better." },
  { q: "Can I cancel after approval?", a: "You can request modifications before the campaign start date. Once live, the ad cannot be edited but can be paused with 24-hour notice." },
  { q: "What content is not allowed?", a: "Adult content, misleading claims, competitor attacks, illegal products/services, or anything that violates our community guidelines." },
  { q: "Do you offer refunds?", a: "If we reject your ad, you get a 100% refund. If you cancel before the start date, 80% refund. No refunds once the campaign is live." },
];
const STEPS = [
  { icon: HiOutlineRocketLaunch, n: "01", label: "Submit",  desc: "Fill the form in ~5 min" },
  { icon: HiOutlineShieldCheck,  n: "02", label: "Review",  desc: "We check within 24–48h" },
  { icon: HiOutlineCurrencyRupee,n: "03", label: "Pay",     desc: "Payment link on approval" },
  { icon: HiOutlineBolt,         n: "04", label: "Go Live", desc: "Campaign activates instantly" },
];
const AD_TYPES = [
  { icon: FaYoutube,             label: "YouTube",    color: "#FF0000" },
  { icon: FaInstagram,           label: "Instagram",  color: "#E1306C" },
  { icon: HiOutlineGlobeAlt,     label: "Website",    color: null },
  { icon: HiOutlineBolt,         label: "App",        color: null },
  { icon: HiOutlineChartBarSquare,label:"Course",     color: null },
  { icon: HiOutlineSparkles,     label: "E-commerce", color: null },
  { icon: HiOutlineUserGroup,    label: "Freelancer", color: null },
  { icon: HiOutlinePlay,         label: "Event",      color: null },
];

// ─── Pricing Calculator ─────────────────────────────────────────────────────
const PricingCalculator = ({ onSelect }) => {
  const [placement, setPlacement] = useState("home_banner");
  const [days, setDays] = useState(7);
  const price = PRICING[placement].days[days];
  const saving = SAVINGS[placement]?.[days];

  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Placement</p>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {Object.entries(PRICING).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setPlacement(key)}
            className={`py-2 rounded-lg text-xs font-bold transition-all border ${
              placement === key
                ? "bg-white text-black border-white"
                : "bg-transparent text-white/40 border-white/10 hover:border-white/25 hover:text-white/70"
            }`}
          >
            {val.label}
          </button>
        ))}
      </div>

      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Duration</p>
      <div className="flex gap-1.5 flex-wrap mb-5">
        {Object.entries(DURATION_LABELS).map(([d, label]) => (
          <button
            key={d}
            onClick={() => setDays(Number(d))}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all border ${
              days === Number(d)
                ? "bg-white text-black border-white"
                : "bg-transparent text-white/40 border-white/10 hover:border-white/25 hover:text-white/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl bg-white/4 border border-white/8 mb-4">
        <div>
          <p className="text-[10px] text-white/30 mb-1">{PRICING[placement].label} · {DURATION_LABELS[days]}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">₹{price.toLocaleString("en-IN")}</span>
            {saving && (
              <span className="text-[10px] font-bold text-white/50 border border-white/15 px-1.5 py-0.5 rounded">
                save {saving}
              </span>
            )}
          </div>
          <p className="text-[10px] text-white/25 mt-1">₹{Math.round(price / days)}/day · pay after approval</p>
        </div>
      </div>

      <button
        onClick={() => onSelect({ placement, days, price })}
        className="w-full py-3.5 rounded-xl font-black text-sm text-black bg-white hover:bg-white/90 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        Start Campaign <HiOutlineArrowRight className="text-sm" />
      </button>
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────
const AdvertisePage = () => {
  const navigate = useNavigate();
  const { user, backendURL } = useAppContext();
  const { socket } = useSocket();
  const [previews, setPreviews] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchPreviews = async () => {
    try {
      const { data } = await axios.get(`${backendURL}/api/ad-previews`);
      if (data.previews) setPreviews(data.previews);
    } catch (err) { console.error("Failed to fetch ad previews", err); }
  };

  useEffect(() => {
    fetchPreviews();
  }, [backendURL]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      console.log("🔄 Ad previews updated via socket, re-fetching...");
      fetchPreviews();
    };
    socket.on("ad-previews:updated", handleUpdate);
    return () => socket.off("ad-previews:updated", handleUpdate);
  }, [socket]);

  const handleSelect = ({ placement, days }) => {
    navigate("/advertise/new", { state: { placement, days } });
  };


  return (
    <div
      className="min-h-screen bg-black text-white flex flex-col md:flex-row"
      style={{ fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}
    >
      <UnifiedNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 md:ml-64 md:mt-16 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

          {/* ── HERO ─────────────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-5">
              <HiOutlineSpeakerWave className="text-white/30 text-sm" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                Advertise on SuviX
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight mb-3">
              Reach 10,000+<br />
              <span className="text-white/40">Active Creators</span>
            </h1>
            <p className="text-sm text-white/40 max-w-md mb-6 leading-relaxed">
              Put your brand in front of India's top video editors and content creators. Transparent pricing, no hidden fees, payment only after we approve your campaign.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button
                onClick={() => navigate("/advertise/new")}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-sm text-black bg-white hover:bg-white/90 transition-all active:scale-[0.98]"
              >
                <HiOutlineRocketLaunch className="text-sm" /> Submit Ad Request — Free
              </button>
              <a
                href="#pricing"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white/50 border border-white/10 hover:border-white/25 hover:text-white transition-all"
              >
                View Pricing <HiOutlineArrowRight className="text-sm" />
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: "10K+", label: "Active Creators" },
                { value: "50K+", label: "Monthly Impressions" },
                { value: "4.8%", label: "Avg. Click Rate" },
                { value: "₹499", label: "Starting Price" },
              ].map(({ value, label }) => (
                <div key={label} className="p-4 rounded-xl bg-[#111] border border-white/8">
                  <p className="text-lg font-black text-white">{value}</p>
                  <p className="text-[11px] text-white/35 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── AD PLACEMENTS PREVIEW ────────────────────────────────── */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4">Ad Placements</p>
            <div className="grid sm:grid-cols-2 gap-3">

              {/* Home Banner */}
              <div className="rounded-2xl border border-white/10 overflow-hidden">
                <div className="relative bg-[#141414]" style={{ aspectRatio: "375/192" }}>
                  {previews?.homeAdBanner?.url ? (
                    previews.homeAdBanner.resourceType === "video" ? (
                      <video 
                        src={repairUrl(previews.homeAdBanner.url)}
                        autoPlay loop muted playsInline 
                        className="absolute inset-0 w-full h-full object-cover" 
                        key={repairUrl(previews.homeAdBanner.url)}
                        onError={(e) => {
                          e.target.src = "https://pixabay.com/videos/download/video-225543_medium.mp4";
                          e.target.load();
                        }}
                      />
                    ) : (
                      <img 
                        src={repairUrl(previews.homeAdBanner.url)} 
                        className="absolute inset-0 w-full h-full object-cover" 
                        alt="Banner" 
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1000&auto=format&fit=crop";
                        }}
                      />
                    )
                  ) : (
                    <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                      <source src="https://pixabay.com/videos/download/video-225543_medium.mp4" type="video/mp4" />
                    </video>
                  )}
                  {/* Simulated banner overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

    <div className="absolute bottom-0 left-0 p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="px-1.5 py-0.5 rounded text-[6px] font-black uppercase tracking-widest bg-white/10 border border-white/10 text-white/60">
          YOUR BRAND
        </span>
        <span className="px-1.5 py-0.5 rounded text-[6px] font-black uppercase text-white/40 border border-white/8">
          SPONSOR
        </span>
      </div>
      <p className="text-white text-sm font-black leading-tight mb-1">
        Your Ad Headline Here
      </p>
      <p className="text-white/40 text-[9px] mb-2.5">
        Your short description goes here
      </p>
      <button className="px-2.5 py-1.5 rounded-lg bg-white text-black text-[8px] font-black uppercase tracking-wider">
        Visit Now →
      </button>
    </div>

    <div className="absolute bottom-0 left-0 right-0 h-px bg-white/5">
      <div className="h-full w-2/5 bg-white/20" />
    </div>
  </div>

  <div className="px-4 py-3 bg-[#111] border-t border-white/8">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-white">Home Banner</p>
        <p className="text-[10px] text-white/35 mt-0.5">
          Shown to every homepage visitor
        </p>
      </div>
      <span className="text-[10px] text-white/30 font-semibold">~10K/day</span>
    </div>
  </div>
</div>

              {/* Reels Feed */}
             {/* Reels Feed */}
<div className="rounded-2xl border border-white/10 overflow-hidden">
      <div className="flex items-center justify-center py-5 bg-[#141414]">
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a]" style={{ width: 110, height: 185 }}>
          {previews?.reelAd?.url ? (
            previews.reelAd.resourceType === "video" ? (
              <video 
                src={repairUrl(previews.reelAd.url)}
                autoPlay loop muted playsInline 
                className="absolute inset-0 w-full h-full object-cover" 
                key={repairUrl(previews.reelAd.url)}
                onError={(e) => {
                  e.target.src = "https://www.w3schools.com/html/movie.mp4";
                  e.target.load();
                }}
              />
            ) : (
              <img 
                src={repairUrl(previews.reelAd.url)} 
                className="absolute inset-0 w-full h-full object-cover" 
                alt="Reel" 
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=1000&auto=format&fit=crop";
                }}
              />
            )
          ) : (
            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
              <source src="https://www.w3schools.com/html/movie.mp4" type="video/mp4" />
            </video>
          )}

      <div className="absolute top-2 left-2 bg-white/8 border border-white/10 rounded px-1.5 py-0.5">
        <span className="text-[5px] font-black uppercase text-white/50 tracking-wider">
          SPONSORED
        </span>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <span className="block text-white text-[9px] font-black mb-1">
          Your Channel
        </span>
        <span className="block text-white/40 text-[8px] mb-2">
          Subscribe for more
        </span>
        <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-white text-black text-[6px] font-black uppercase">
          <FaYoutube className="text-[7px]" /> Subscribe
        </button>
      </div>
    </div>
  </div>

  <div className="px-4 py-3 bg-[#111] border-t border-white/8">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-white">Reels Feed</p>
        <p className="text-[10px] text-white/35 mt-0.5">
          Shown between reels content
        </p>
      </div>
      <span className="text-[10px] text-white/30 font-semibold">~4K/day</span>
    </div>
  </div>
</div>
            </div>
          </section>

          {/* ── WHAT YOU CAN PROMOTE ─────────────────────────────────── */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4">What You Can Promote</p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AD_TYPES.map(({ icon: Icon, label, color }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#111] border border-white/8 hover:border-white/20 transition-all"
                >
                  <Icon
                    className="text-xl"
                    style={{ color: color || "rgba(255,255,255,0.45)" }}
                  />
                  <span className="text-[9px] text-white/35 font-medium text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4">How It Works</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STEPS.map(({ icon: Icon, n, label, desc }) => (
                <div key={label} className="p-4 rounded-xl bg-[#111] border border-white/8 relative overflow-hidden">
                  <span className="absolute top-3 right-3 text-[28px] font-black text-white/4 leading-none select-none">
                    {n}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                    <Icon className="text-sm text-white/50" />
                  </div>
                  <p className="text-xs font-black text-white mb-1">{label}</p>
                  <p className="text-[11px] text-white/35 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── PRICING ──────────────────────────────────────────────── */}
          <section id="pricing">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4">Pricing</p>
            <div className="grid lg:grid-cols-[1fr_300px] gap-4 items-start">

              {/* Table */}
              <div className="rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#111] border-b border-white/8">
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Duration</th>
                      <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-white/35 text-center">Banner</th>
                      <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-white/35 text-center">Reels</th>
                      <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-white/35 text-center">Both</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(DURATION_LABELS).map(([d, label]) => (
                      <tr
                        key={d}
                        className={`border-b border-white/5 hover:bg-white/2 transition-colors ${Number(d) === 7 ? "bg-white/3" : "bg-[#0a0a0a]"}`}
                      >
                        <td className="px-4 py-3 text-xs font-bold text-white">
                          {label}
                          {Number(d) === 7 && (
                            <span className="ml-2 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-white/15 text-white/40">
                              POPULAR
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center text-xs font-semibold text-white/60">
                          ₹{PRICING.home_banner.days[d].toLocaleString("en-IN")}
                          {SAVINGS.home_banner[d] && <span className="block text-[9px] text-white/25">-{SAVINGS.home_banner[d]}</span>}
                        </td>
                        <td className="px-3 py-3 text-center text-xs font-semibold text-white/60">
                          ₹{PRICING.reels_feed.days[d].toLocaleString("en-IN")}
                          {SAVINGS.reels_feed[d] && <span className="block text-[9px] text-white/25">-{SAVINGS.reels_feed[d]}</span>}
                        </td>
                        <td className="px-3 py-3 text-center text-xs font-semibold text-white/60">
                          ₹{PRICING.both.days[d].toLocaleString("en-IN")}
                          {SAVINGS.both[d] && <span className="block text-[9px] text-white/25">-{SAVINGS.both[d]}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-3 bg-[#0a0a0a] border-t border-white/5">
                  <p className="text-[10px] text-white/20">All prices in INR incl. GST. Pay only after approval.</p>
                </div>
              </div>

              {/* Calculator */}
              <PricingCalculator onSelect={handleSelect} />
            </div>
          </section>

          {/* ── INCLUDED ─────────────────────────────────────────────── */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4">Everything Included</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Banner using your media and branding",
                "Live preview before submission",
                "Real-time impression & click tracking",
                "Email updates at every status change",
                "Campaign performance report after expiry",
                "Reels card if Reels placement selected",
                "Ad details page with your full brand story",
                "Links to all your social channels",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#111] border border-white/8">
                  <HiOutlineCheckCircle className="text-white/30 text-sm flex-shrink-0" />
                  <span className="text-xs text-white/50">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── FAQ ─────────────────────────────────────────────────── */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4">FAQ</p>
            <div className="rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/8">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/2 transition-colors"
                  >
                    <span className="text-sm font-semibold text-white/70 pr-4">{item.q}</span>
                    {openFaq === i
                      ? <HiOutlineChevronUp className="text-white/25 flex-shrink-0 text-sm" />
                      : <HiOutlineChevronDown className="text-white/25 flex-shrink-0 text-sm" />
                    }
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 pt-3 text-sm text-white/35 leading-relaxed border-t border-white/5 bg-[#0a0a0a]">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>

          {/* ── BOTTOM CTA ───────────────────────────────────────────── */}
          <section className="pb-4">
            <div className="rounded-2xl border border-white/10 bg-[#111] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">Ready?</p>
                <h2 className="text-xl sm:text-2xl font-black text-white mb-1.5">Grow your brand on SuviX</h2>
                <p className="text-sm text-white/35">No payment today. Submit free. Pay only after approval.</p>
              </div>
              <button
                onClick={() => navigate("/advertise/new")}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm text-black bg-white hover:bg-white/90 transition-all active:scale-[0.98] whitespace-nowrap"
              >
                Submit Ad Request <HiOutlineArrowRight className="text-sm" />
              </button>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default AdvertisePage;