/**
 * ProfileCompletionBanner — Professional Redesign
 * All backend logic preserved. Styling only.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCamera, FaFileAlt, FaTags, FaImages, FaUniversity,
  FaBriefcase, FaGlobe, FaLink, FaDollarSign,
  FaCheck, FaChevronDown, FaArrowRight,
  FaExclamationCircle, FaCheckCircle
} from 'react-icons/fa';
import { HiOutlineSparkles, HiOutlineShieldCheck, HiArrowUpRight } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import axios from 'axios';
import kycBannerImg from '../assets/kycbanner.png';

const iconMap = {
  profilePicture: FaCamera,
  about: FaFileAlt,
  skills: FaTags,
  portfolio: FaImages,
  experience: FaBriefcase,
  languages: FaGlobe,
  socialLinks: FaLink,
  kycVerified: FaUniversity,
  hourlyRate: FaDollarSign,
};

const getRedirectUrl = (section, itemId) => {
  switch (itemId) {
    case 'kycVerified': return '/kyc-details';
    case 'portfolio': return '/editor-profile?tab=portfolio';
    default: return `/editor-profile-update#${section}`;
  }
};

// ─── Circular Progress ────────────────────────────────────────────────────────
const CircularProgress = ({ percent }) => {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * percent) / 100;
  const color = percent >= 80 ? '#10b981' : percent >= 50 ? '#f59e0b' : '#6b7280';

  return (
    <div className="relative w-[88px] h-[88px] flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
        {/* Track */}
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
        {/* Progress */}
        <motion.circle
          cx="44" cy="44" r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
        />
        {/* Tick marks at 20% intervals */}
        {[0, 72, 144, 216, 288].map((angle, i) => {
          const rad = (angle - 90) * (Math.PI / 180);
          const x1 = 44 + (r - 3) * Math.cos(rad);
          const y1 = 44 + (r - 3) * Math.sin(rad);
          const x2 = 44 + (r + 3) * Math.cos(rad);
          const y2 = 44 + (r + 3) * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />;
        })}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-[22px] font-black text-white leading-none tabular-nums"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {percent}
        </motion.span>
        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">%</span>
      </div>
    </div>
  );
};

// ─── Step Pill ────────────────────────────────────────────────────────────────
const StepPill = ({ item, onClick }) => {
  const Icon = iconMap[item.id] || FaCheckCircle;
  return (
    <motion.button
      onClick={() => onClick(item.section, item.id)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 w-full ${
        item.complete
          ? 'bg-white/[0.02] border-white/[0.04] opacity-50 cursor-default'
          : 'bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/[0.14] cursor-pointer'
      }`}
    >
      {/* Icon */}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
        item.complete ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/[0.05] text-zinc-500'
      }`}>
        {item.complete ? <FaCheck /> : <Icon />}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-bold truncate ${item.complete ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>
          {item.label}
        </p>
        <p className={`text-[9px] font-semibold uppercase tracking-wider ${item.complete ? 'text-zinc-700' : item.required ? 'text-amber-500/80' : 'text-zinc-600'}`}>
          {item.complete ? 'Done' : item.required ? `+${item.weight}% · Required` : 'Bonus'}
        </p>
      </div>

      {/* Arrow */}
      {!item.complete && (
        <HiArrowUpRight className="text-zinc-700 text-xs flex-shrink-0" />
      )}
    </motion.button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ProfileCompletionBanner = () => {
  const { user, backendURL } = useAppContext();
  const navigate = useNavigate();
  const [completionData, setCompletionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChecklist, setShowChecklist] = useState(false);

  useEffect(() => {
    const fetchCompletionStatus = async () => {
      if (!user?.token || user?.role !== 'editor') { setLoading(false); return; }
      try {
        const res = await axios.get(`${backendURL}/api/profile/completion-status`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setCompletionData(res.data);
      } catch (error) {
        setCompletionData({ percent: 0, breakdown: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchCompletionStatus();
  }, [user?.token, user?.role, backendURL]);

  if (user?.role !== 'editor' || loading) return null;

  const percent = completionData?.percent || 0;
  const breakdown = completionData?.breakdown || [];
  const requiredCount = completionData?.requiredCount || 5;
  const requiredComplete = completionData?.requiredComplete || 0;

  if (percent >= 100) return null;

  const requiredItems = breakdown.filter(i => i.required);
  const optionalItems = breakdown.filter(i => !i.required);
  const kycDone = breakdown.find(i => i.id === 'kycVerified')?.complete;
  const remaining = requiredCount - requiredComplete;

  const handleItemClick = (section, itemId) => {
    navigate(getRedirectUrl(section, itemId));
    setShowChecklist(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0b0b0f]"
    >
      {/* ── Top shimmer line ── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ── Main Content ── */}
      <div className="p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">

          {/* LEFT: Progress ring + copy */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <CircularProgress percent={percent} />

            <div className="flex flex-col gap-1.5 min-w-0">
              {/* Label */}
              <div className="flex items-center gap-2">
                <HiOutlineSparkles className="text-amber-400 text-sm flex-shrink-0" />
                <h3 className="text-[13px] font-black text-white tracking-tight">
                  Complete your profile
                </h3>
              </div>

              {/* Subtitle */}
              <p className="text-[11px] text-zinc-500 leading-relaxed max-w-[260px]">
                {remaining === 1
                  ? 'Just 1 required field left — you\'re almost there.'
                  : `${remaining} required field${remaining > 1 ? 's' : ''} remaining to unlock full visibility.`}
              </p>

              {/* Progress steps indicator */}
              <div className="flex items-center gap-1 mt-0.5">
                {requiredItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                    className={`h-1 rounded-full flex-1 max-w-[28px] origin-left ${
                      item.complete ? 'bg-emerald-500' : 'bg-white/10'
                    }`}
                  />
                ))}
                <span className="text-[9px] font-black text-zinc-600 ml-1 uppercase tracking-widest">
                  {requiredComplete}/{requiredCount}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: KYC + Actions */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">

            {/* KYC Block */}
            <button
              onClick={() => navigate('/kyc-details')}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all duration-200 ${
                kycDone
                  ? 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
                  : 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10'
              }`}
            >
              <motion.img
                src={kycBannerImg}
                alt="KYC"
                className="w-10 h-10 object-contain"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              {kycDone ? (
                <div className="flex items-center gap-1">
                  <HiOutlineShieldCheck className="text-emerald-400 text-[10px]" />
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">Verified</span>
                </div>
              ) : (
                <span className="text-[8px] font-black text-amber-400 uppercase tracking-wider animate-pulse">KYC Pending</span>
              )}
            </button>

            {/* Divider */}
            <div className="w-px h-12 bg-white/[0.06] hidden sm:block" />

            {/* CTA Buttons */}
            <div className="flex flex-col gap-2">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/editor-profile-update')}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-wider hover:bg-zinc-100 transition-all shadow-lg shadow-white/5"
              >
                Complete Profile
                <FaArrowRight className="text-[9px]" />
              </motion.button>

              <button
                onClick={() => setShowChecklist(v => !v)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300 text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                Checklist
                <motion.span animate={{ rotate: showChecklist ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <FaChevronDown className="text-[8px]" />
                </motion.span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className="relative h-[3px] bg-white/[0.04] mx-4 md:mx-5 mb-4 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: percent >= 80 ? '#10b981' : percent >= 50 ? '#f59e0b' : '#6b7280' }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        />
      </div>

      {/* ── Expandable Checklist ── */}
      <AnimatePresence>
        {showChecklist && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.05] mx-0">

              {/* Required */}
              <div className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FaExclamationCircle className="text-amber-500 text-[10px]" />
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em]">Required</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[9px] font-black text-zinc-500">
                    {requiredComplete} / {requiredCount}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {requiredItems.map(item => (
                    <StepPill key={item.id} item={item} onClick={handleItemClick} />
                  ))}
                </div>
              </div>

              {/* Optional */}
              {optionalItems.length > 0 && (
                <div className="p-4 md:p-5 pt-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FaCheckCircle className="text-zinc-600 text-[10px]" />
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.15em]">Optional · Bonus</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[9px] font-black text-zinc-600">
                      {optionalItems.filter(i => i.complete).length} / {optionalItems.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {optionalItems.map(item => (
                      <StepPill key={item.id} item={item} onClick={handleItemClick} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfileCompletionBanner;