/**
 * SuvixHeroIntro.jsx
 * Place in: frontend/src/components/SuvixHeroIntro.jsx
 *
 * Matches the clean SaaS landing page style shown in the reference screenshot:
 *   - Welcome back pill badge + #1 Platform badge
 *   - Large bold headline with green accent word
 *   - Subtitle
 *   - CTA card with big button
 *   - Floating notification toast cards (payment, project delivered, new order)
 *   - Stats row at bottom
 *
 * ONLY visible on lg+ — completely hidden on mobile/tablet.
 *
 * Props:
 *   userType: "editor" | "client"
 *   userName: string
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// ─── Floating notification toast ──────────────────────────────────────────────
const ToastCard = ({ icon, title, sub, accentColor, delay, style }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.88, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className="absolute flex items-center gap-3 px-3.5 py-2.5 rounded-2xl z-30 pointer-events-none select-none bg-[#0E0E14]/88 light:bg-white/95 backdrop-blur-2xl border border-white/10 light:border-zinc-200 shadow-2xl shadow-black/50 light:shadow-zinc-200/50 min-w-[196px]"
    style={{ ...style, transform: "translateZ(0)", willChange: "transform, opacity" }}
  >
    {/* Icon bubble */}
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
      style={{
        background: accentColor + "1a",
        border: `1px solid ${accentColor}33`,
      }}
    >
      {icon}
    </div>

    <div className="flex flex-col min-w-0">
      <span className="text-[11px] font-bold text-white light:text-zinc-900 leading-tight">{title}</span>
      <span className="text-[9.5px] leading-tight text-white/40 light:text-zinc-500">
        {sub}
      </span>
    </div>

    <motion.div
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0"
      style={{ background: accentColor }}
    />
  </motion.div>
);

// ─── Stat item ────────────────────────────────────────────────────────────────
const Stat = ({ value, label, accent, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    className="flex flex-col"
  >
    <span className="text-[18px] font-black leading-none tracking-tight" style={{ color: accent }}>
      {value}
    </span>
    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] mt-0.5 text-white/30 light:text-zinc-400">
      {label}
    </span>
  </motion.div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const SuvixHeroIntro = ({ userType = "editor", userName = "" }) => {
  const navigate  = useNavigate();
  const firstName = userName?.split(" ")[0] || "there";

  const content = {
    editor: {
      headline1: "Your Projects",
      headline2: "Await",
      sub: "Continue where you left off. Your workspace, messages, and earnings are ready.",
      cardBody: "Your active gigs, pending orders, and client messages are all waiting for you.",
      cta: "Enter Workspace →",
      ctaPath: "/gigs",
      toasts: [
        { icon: "✅", title: "Project Delivered!", sub: "Wedding Film · Just now",  accentColor: "#22c55e", delay: 0.72, style: { top: 0, right: -12 } },
        { icon: "💸", title: "₹12,500 Received",  sub: "Payment · 2 min ago",      accentColor: "#6366f1", delay: 0.9,  style: { bottom: 32, left: -20 } },
        { icon: "🔔", title: "New Order!",         sub: "YouTube Edit · 4 min ago", accentColor: "#f59e0b", delay: 1.08, style: { top: "42%", right: -12 } },
      ],
    },
    client: {
      headline1: "Find Your",
      headline2: "Perfect Editor",
      sub: "Browse India's top verified editors, post your brief, and get stunning work delivered.",
      cardBody: "Post a project brief, receive competitive proposals, and hire with full escrow protection.",
      cta: "Explore Editors →",
      ctaPath: "/explore",
      toasts: [
        { icon: "⭐", title: "5-Star Review",    sub: "Corporate Reel · Just now", accentColor: "#f59e0b", delay: 0.72, style: { top: 0, right: -12 } },
        { icon: "✅", title: "Brief Accepted",   sub: "Wedding Film · 1 min ago",  accentColor: "#22c55e", delay: 0.9,  style: { bottom: 32, left: -20 } },
        { icon: "👥", title: "12 Proposals In",  sub: "Reels Edit · 3 min ago",    accentColor: "#6366f1", delay: 1.08, style: { top: "42%", right: -12 } },
      ],
    },
  };

  const c = content[userType] || content.editor;

  const stats = [
    { value: "12K+", label: "Editors",  accent: "#a78bfa" },
    { value: "4.9★", label: "Rating",   accent: "#fbbf24" },
    { value: "98%",  label: "Success",  accent: "#34d399" },
    { value: "2M+",  label: "Users",    accent: "#60a5fa" },
  ];

  return (
    <div className="hidden lg:flex flex-col h-full relative overflow-visible">
      {/* BACKGROUND ACCENTS ONLY (No main card bg as requested) */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 light:bg-indigo-500/5 blur-[60px] rounded-full" style={{ transform: "translateZ(0)", willChange: "transform" }} />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 light:bg-purple-500/5 blur-[80px] rounded-full" style={{ transform: "translateZ(0)", willChange: "transform" }} />

      {/* Floating toast cards - adjusted positioning to look better in the grid */}
      {c.toasts.map((t) => (
        <ToastCard key={t.title} {...t} />
      ))}

      {/* Main content layer */}
      <div className="relative z-10 flex flex-col h-full p-4 xl:p-6 gap-5">
        
        {/* Badge row */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2.2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-500 light:text-emerald-600">
              Welcome back, {firstName}!
            </span>
          </div>

          <div className="px-2.5 py-1.5 rounded-full bg-white/5 light:bg-zinc-100 border border-white/10 light:border-zinc-200">
            <span className="text-[10px] font-black text-white/50 light:text-zinc-500">
              #1 Platform
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <div className="flex flex-col">
          <motion.span
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="font-black leading-[1.05] tracking-tight text-white light:text-zinc-900"
            style={{ fontSize: "clamp(32px, 3.5vw, 46px)" }}
          >
            {c.headline1}
          </motion.span>

          <motion.span
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.5 }}
            className="font-black leading-[1.05] tracking-tight"
            style={{
              fontSize: "clamp(32px, 3.5vw, 46px)",
              background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {c.headline2}
          </motion.span>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-sm font-medium text-zinc-400 light:text-zinc-500 leading-relaxed max-w-[92%]"
        >
          {c.sub}
        </motion.p>

        {/* Action Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-5 flex flex-col gap-4 bg-white/5 light:bg-zinc-100 border border-white/10 light:border-zinc-200"
        >
          <p className="text-[12px] font-semibold text-zinc-400 light:text-zinc-600 leading-snug">
            {c.cardBody}
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate(c.ctaPath)}
            className="w-full py-3.5 rounded-xl text-[12px] font-black uppercase tracking-widest bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all"
          >
            {c.cta}
          </motion.button>
        </motion.div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 mt-auto">
          {stats.map((s, i) => (
            <div key={s.label} className="flex items-center gap-6">
              <Stat {...s} delay={0.45 + i * 0.1} />
              {i < stats.length - 1 && (
                <div className="w-px h-6 bg-white/10 light:bg-zinc-200" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuvixHeroIntro;