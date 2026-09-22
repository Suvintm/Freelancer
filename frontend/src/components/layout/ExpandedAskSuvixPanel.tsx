import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Maximize2, 
  X, 
  Paperclip, 
  Send,
  BarChart2,
  Users,
  Trophy,
  Sparkles,
  CheckCheck,
  Briefcase, 
  Lightbulb, 
  TrendingUp, 
  Sun,
  Moon,
  ChevronLeft
} from 'lucide-react';
import asksuvixBg from '../../assets/asksuvixbg.png';
import asksuvixWhiteBg from '../../assets/asksuvixwhitebg.png';
import officialLogo from '../../assets/officiallogo.png';
import defaultProfile from '../../assets/defaultprofile.png';
import { useAskSuvix } from '../../context/AskSuvixContext';
import { useTheme } from '../../hooks/useTheme';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';

const QUICK_PROMPTS = [
  { text: 'Show my content performance', icon: BarChart2 },
  { text: 'Find brand opportunities', icon: Briefcase },
  { text: 'Suggest content ideas', icon: Lightbulb },
  { text: 'How can I earn more?', icon: TrendingUp },
];

export const ExpandedAskSuvixPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { 
    closeAskSuvix, 
    messages, 
    sendMessage, 
    isAnalyzing 
  } = useAskSuvix();
  
  const { isDarkMode, toggleTheme } = useTheme();
  const user = useSelector(selectUser);
  const [inputText, setInputText] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialMountRef = useRef(true);

  // Auto-resize textarea height like ChatGPT (up to 160px max height, then shows scrollbar)
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      const newHeight = Math.min(scrollH, 160);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);

  // Butter-smooth, glitch-free scrolling mechanism
  const scrollToBottom = useCallback((instant = false) => {
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: instant ? 'auto' : 'smooth',
          block: 'end'
        });
      } else if (chatContainerRef.current) {
        if (instant) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        } else {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }
    });
  }, []);

  // Instantly pin to bottom on initial open - zero visible scrolling jump from top
  useLayoutEffect(() => {
    scrollToBottom(true);
    const rAf = requestAnimationFrame(() => {
      scrollToBottom(true);
      isInitialMountRef.current = false;
    });
    return () => cancelAnimationFrame(rAf);
  }, [scrollToBottom]);

  // Smooth scroll for subsequent user messages and AI answers
  useEffect(() => {
    if (!isInitialMountRef.current) {
      const timer = setTimeout(() => {
        scrollToBottom(false);
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [messages, isAnalyzing, scrollToBottom]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    sendMessage(promptText);
  };

  return (
    <div 
      data-lenis-prevent="true"
      className={`relative w-full h-full rounded-[24px] sm:rounded-[30px] lg:rounded-[34px] xl:rounded-[38px] overflow-hidden select-none flex flex-col justify-between transition-all duration-300 ${
        isDarkMode 
          ? 'bg-[#090A0F] text-white border border-white/[0.22] shadow-[-22px_0_60px_rgba(0,0,0,0.92),22px_0_60px_rgba(0,0,0,0.92),0_20px_60px_rgba(0,0,0,0.95),0_-10px_30px_rgba(0,0,0,0.65)]' 
          : 'bg-[#F8F9FD] text-zinc-900 border border-black/[0.14] shadow-[-20px_0_50px_rgba(0,0,0,0.18),20px_0_50px_rgba(0,0,0,0.18),0_15px_50px_rgba(0,0,0,0.15),0_-8px_25px_rgba(0,0,0,0.06)]'
      } ${className}`}
    >
      {/* 3D Continuous Samsung Curved Glass Edge (360° Waterfall Contour around ALL 4 Corners) */}
      <div 
        aria-hidden="true" 
        className="hidden lg:block absolute inset-0 rounded-[24px] sm:rounded-[30px] lg:rounded-[34px] xl:rounded-[38px] pointer-events-none z-30"
      >
        {/* Continuous Specular Glare Arc tracing all 4 rounded corners & all 4 sides */}
        <div className={`absolute inset-0 rounded-[24px] sm:rounded-[30px] lg:rounded-[34px] xl:rounded-[38px] border-[1.5px] pointer-events-none transition-all duration-300 ${
          isDarkMode
            ? 'border-white/70 shadow-[inset_1px_1px_4px_rgba(255,255,255,0.4),0_0_12px_rgba(255,255,255,0.3)]'
            : 'border-white/95 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.95),0_0_8px_rgba(255,255,255,0.7)]'
        }`} />

        {/* 3D Glass Refractive Depth & Ambient Occlusion following all 4 rounded corners */}
        <div className={`absolute inset-0 rounded-[24px] sm:rounded-[30px] lg:rounded-[34px] xl:rounded-[38px] pointer-events-none transition-all duration-300 ${
          isDarkMode
            ? 'shadow-[inset_18px_0_32px_rgba(0,0,0,0.85),inset_-18px_0_32px_rgba(0,0,0,0.85),inset_0_18px_32px_rgba(0,0,0,0.55),inset_0_-18px_32px_rgba(0,0,0,0.65),inset_2px_2px_8px_rgba(255,255,255,0.25)]'
            : 'shadow-[inset_16px_0_28px_rgba(0,0,0,0.16),inset_-16px_0_28px_rgba(0,0,0,0.16),inset_0_14px_28px_rgba(0,0,0,0.09),inset_0_-14px_28px_rgba(0,0,0,0.11),inset_2px_2px_6px_rgba(255,255,255,0.95)]'
        }`} />

        {/* Left Curved Lateral Glare */}
        <div className={`absolute left-0 top-0 bottom-0 w-8 rounded-l-[34px] pointer-events-none ${
          isDarkMode
            ? 'bg-gradient-to-r from-white/[0.12] via-white/[0.03] to-transparent'
            : 'bg-gradient-to-r from-black/[0.12] via-black/[0.03] to-transparent'
        }`} />

        {/* Right Curved Lateral Glare */}
        <div className={`absolute right-0 top-0 bottom-0 w-8 rounded-r-[34px] pointer-events-none ${
          isDarkMode
            ? 'bg-gradient-to-l from-white/[0.12] via-white/[0.03] to-transparent'
            : 'bg-gradient-to-l from-black/[0.12] via-black/[0.03] to-transparent'
        }`} />
      </div>

      {/* Samsung Galaxy Edge Tactile Indicator Handle Pill (Centered on Left Curved Edge) */}
      <div 
        aria-hidden="true" 
        className="hidden lg:flex absolute left-1.5 top-1/2 -translate-y-1/2 z-30 pointer-events-none items-center justify-center"
      >
        <div className={`w-1.2 h-14 rounded-full shadow-md backdrop-blur-md transition-all duration-300 ${
          isDarkMode 
            ? 'bg-white/25 border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.15)]' 
            : 'bg-black/35 border border-white/60 shadow-[0_0_8px_rgba(0,0,0,0.15)]'
        }`} />
      </div>

      {/* 1. Authentic Glow Background Asset (Dark: asksuvixbg.png | Light: asksuvixwhitebg.png) */}
      <img
        src={isDarkMode ? asksuvixBg : asksuvixWhiteBg}
        alt="Ask SuviX Background"
        className={`absolute inset-0 w-full h-full object-cover object-bottom pointer-events-none transition-opacity duration-300 ${
          isDarkMode ? 'opacity-90' : 'opacity-95'
        }`}
      />

      {/* Subtle Black Overlay on background image in Dark mode only - Clean & bright in Light mode */}
      <div 
        aria-hidden="true" 
        className={`absolute inset-0 pointer-events-none transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-b from-black/85 via-black/45 to-transparent opacity-100' 
            : 'opacity-0 pointer-events-none'
        }`} 
      />

      {/* iPhone Dynamic Island / Camera & Sensor Capsule Component */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex items-center justify-center">
        <div 
          className={`h-5.5 px-3 rounded-full flex items-center justify-between gap-3 shadow-lg backdrop-blur-md transition-all duration-300 select-none ${
            isDarkMode 
              ? 'bg-black/95 border border-white/15 shadow-[0_2px_12px_rgba(0,0,0,0.9)] text-white' 
              : 'bg-black/90 border border-black/20 shadow-[0_2px_10px_rgba(0,0,0,0.25)] text-white'
          }`}
        >
          {/* Front Camera Lens with blue optical antireflection dot */}
          <div className="w-2.5 h-2.5 rounded-full bg-[#05070e] border border-white/20 flex items-center justify-center relative shadow-inner">
            <div className="w-1 h-1 rounded-full bg-[#1e40af] shadow-[0_0_2px_#3b82f6]" />
            <div className="w-0.5 h-0.5 rounded-full bg-white/80 absolute top-0.5 right-0.5" />
          </div>

          {/* Micro Speaker Earpiece / Sensor Slit */}
          <div className="w-4 h-0.5 rounded-full bg-zinc-800" />

          {/* Green/Emerald Active Indicator LED */}
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
        </div>
      </div>

      {/* 2. Top Header Row */}
      <div className={`relative z-20 pt-7 pb-3.5 px-3.5 sm:px-4 border-0 flex items-center justify-between gap-2 backdrop-blur-md transition-all duration-300 ${
        isDarkMode ? 'bg-black/20' : 'bg-white/70 border-b border-zinc-200/50'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Circular Official SuviX Logo */}
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-md border-0 bg-white">
            <img 
              src={officialLogo} 
              alt="SuviX" 
              className="w-full h-full object-cover" 
            />
          </div>

          {/* Title & Tagline */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <h3 className={`text-[15px] sm:text-[16px] font-bold tracking-tight leading-none ${
                isDarkMode ? 'text-white' : 'text-zinc-950'
              }`}>
                Ask SuviX
              </h3>
              <span className="px-1.5 py-0.5 rounded-[4.5px] bg-[#8B5CF6] text-white text-[8px] sm:text-[8.5px] font-semibold uppercase tracking-wider leading-none shadow-xs">
                BETA
              </span>
            </div>
            <p className={`text-[9.5px] sm:text-[10px] font-normal leading-tight mt-1 truncate ${
              isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
              Your data. Your insights. Your growth.
            </p>
          </div>
        </div>

        {/* Action Buttons: Theme Toggle, Maximize & Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all cursor-pointer border-0 ${
              isDarkMode 
                ? 'bg-white/10 hover:bg-white/20 text-amber-300' 
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <Sun size={14} className="text-amber-300 fill-amber-300/30" />
            ) : (
              <Moon size={14} className="text-zinc-800 fill-zinc-800/20" />
            )}
          </button>

          <button
            type="button"
            className={`w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all cursor-pointer border-0 ${
              isDarkMode 
                ? 'bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white' 
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950'
            }`}
            title="Maximize"
            aria-label="Maximize"
          >
            <Maximize2 size={13} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={closeAskSuvix}
            className={`w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all cursor-pointer border-0 ${
              isDarkMode 
                ? 'bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white' 
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950'
            }`}
            title="Close Assistant"
            aria-label="Close Assistant"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* 3. Messages Flow Scrollable Body */}
      <div 
        ref={chatContainerRef} 
        data-lenis-prevent="true"
        className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [will-change:scroll-position] transform-gpu scrollbar-hide px-3.5 sm:px-5 py-3.5 space-y-4 w-full max-w-full min-w-0"
        style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
      >
        
        {messages.map((msg, idx) => {
          // User Message Bubble (Pill shape, rounded edges, no border, medium font)
          if (msg.sender === 'user') {
            return (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-full flex flex-col items-end gap-1 min-w-0"
              >
                <div className="flex items-end justify-end gap-2.5 max-w-[85%] sm:max-w-[80%] min-w-0">
                  <div className={`min-w-0 max-w-full px-4 py-2.5 sm:px-4.5 sm:py-3 rounded-[20px] rounded-br-[5px] text-xs sm:text-[13px] font-medium shadow-md leading-relaxed border-0 transition-colors duration-200 break-all [word-break:break-word] [overflow-wrap:anywhere] whitespace-pre-wrap ${
                    isDarkMode ? 'bg-white text-zinc-950' : 'bg-zinc-950 text-white'
                  }`}>
                    {msg.text}
                  </div>
                  <img
                    src={user?.profilePicture || defaultProfile}
                    alt="User"
                    className="w-7 h-7 rounded-full object-cover border-0 shadow-sm shrink-0 mb-0.5"
                  />
                </div>
                <div className={`flex items-center gap-1 text-[9.5px] pr-9 font-normal select-none ${
                  isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  <span>{msg.timestamp}</span>
                  <CheckCheck size={12} className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} />
                </div>
              </motion.div>
            );
          }

          // Welcome Greeting Message Bubble
          if (idx === 0) {
            return (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-full flex flex-col items-start gap-2.5 min-w-0"
              >
                <div className="flex items-start gap-3 w-full max-w-full min-w-0">
                  {/* Circular AI Avatar */}
                  <div className="w-8.5 h-8.5 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border-0 mt-0.5 overflow-hidden">
                    <img 
                      src={officialLogo} 
                      alt="SuviX AI" 
                      className="w-full h-full object-cover" 
                    />
                  </div>

                  {/* AI Greeting Card - No Border, Rounded Edges */}
                  <div className={`p-4 sm:p-5 rounded-[22px] sm:rounded-[26px] shadow-xl backdrop-blur-md space-y-1.5 border-0 w-full max-w-full min-w-0 overflow-hidden transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-[#0E1018]/90 text-white' 
                      : 'bg-white/95 text-zinc-900 border border-zinc-200/70 shadow-md'
                  }`}>
                    <h4 className={`text-[15px] sm:text-[16px] font-bold flex items-center gap-1.5 leading-tight break-all [word-break:break-word] [overflow-wrap:anywhere] ${
                      isDarkMode ? 'text-white' : 'text-zinc-950'
                    }`}>
                      <span>Hi! I'm SuviX</span>
                      <Sparkles size={14} className={isDarkMode ? "text-amber-300 fill-amber-300/40" : "text-amber-500 fill-amber-500/30"} />
                    </h4>
                    <p className={`text-xs sm:text-[12.5px] leading-relaxed font-normal break-all [word-break:break-word] [overflow-wrap:anywhere] whitespace-pre-wrap ${
                      isDarkMode ? 'text-zinc-300' : 'text-zinc-600'
                    }`}>
                      {msg.text || "Ask me anything about your content, opportunities, analytics, brands, earnings or platform features. I'm here to help you grow."}
                    </p>
                  </div>
                </div>

                {/* 4 Quick Action Prompt Buttons */}
                <div className="pl-11 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
                  {QUICK_PROMPTS.map((qp, qIdx) => {
                    const IconComp = qp.icon;
                    return (
                      <button
                        key={qIdx}
                        type="button"
                        onClick={() => handleQuickPrompt(qp.text)}
                        className={`px-3.5 py-2.5 rounded-full text-[11px] sm:text-[11.5px] font-medium flex items-center gap-2 cursor-pointer transition-all active:scale-95 text-left border-0 ${
                          isDarkMode 
                            ? 'bg-[#12141F]/90 hover:bg-white/10 text-zinc-200 hover:text-white shadow-2xs' 
                            : 'bg-white hover:bg-zinc-50 text-zinc-800 hover:text-zinc-950 shadow-xs border border-zinc-200/80'
                        }`}
                      >
                        <IconComp size={13} className={`shrink-0 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`} />
                        <span className="truncate">{qp.text}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          }

          // AI Structured Insights Message (Matching exact Reference UI - No border, highly rounded cards)
          return (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-full flex flex-col items-start gap-1 min-w-0"
            >
              <div className="flex items-start gap-3 w-full max-w-full min-w-0">
                {/* AI Avatar */}
                <div className="w-8.5 h-8.5 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border-0 mt-0.5 overflow-hidden">
                  <img 
                    src={officialLogo} 
                    alt="SuviX AI" 
                    className="w-full h-full object-cover" 
                  />
                </div>

                {/* Main AI Insights Card - Theme aware, Rounded Edges, NO BORDER */}
                <div className={`p-4 sm:p-5 rounded-[22px] sm:rounded-[26px] shadow-xl backdrop-blur-md space-y-3.5 border-0 w-full max-w-full min-w-0 overflow-hidden transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-[#0E1018]/95 text-white' 
                    : 'bg-white/95 text-zinc-900 border border-zinc-200/70 shadow-md'
                }`}>
                  {/* Title */}
                  <h4 className={`text-[15px] sm:text-[16px] font-bold flex items-center gap-2 leading-tight break-all [word-break:break-word] [overflow-wrap:anywhere] ${
                    isDarkMode ? 'text-white' : 'text-zinc-950'
                  }`}>
                    <span className="break-all [word-break:break-word] [overflow-wrap:anywhere]">{msg.title || "Here's your content performance for this month"}</span>
                    <span className="shrink-0">📊</span>
                  </h4>

                  {/* Body summary */}
                  {msg.text && (
                    <p className={`text-xs sm:text-[12px] leading-relaxed font-normal break-all [word-break:break-word] [overflow-wrap:anywhere] whitespace-pre-wrap ${
                      isDarkMode ? 'text-zinc-300' : 'text-zinc-600'
                    }`}>
                      {msg.text}
                    </p>
                  )}

                  {/* 3 Metric Cards Grid (Avg Retention | Profile Reach | Sponsor Score) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5 w-full min-w-0">
                    {/* Metric 1: Avg. Retention */}
                    <div className={`p-3.5 rounded-[18px] sm:rounded-[20px] border-0 flex items-center gap-3 min-w-0 transition-colors duration-200 ${
                      isDarkMode ? 'bg-[#161823]/95 shadow-inner' : 'bg-[#F2F4F8]/95 shadow-xs'
                    }`}>
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isDarkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-zinc-800'
                      }`}>
                        <Users size={16} strokeWidth={2} />
                      </div>
                      <div className="flex flex-col leading-none min-w-0 overflow-hidden">
                        <span className={`text-[10px] font-normal truncate ${
                          isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                        }`}>
                          Avg. Retention
                        </span>
                        <span className={`text-[15px] sm:text-[16.5px] font-bold mt-1 leading-none truncate ${
                          isDarkMode ? 'text-white' : 'text-zinc-950'
                        }`}>
                          {msg.metrics?.[0]?.value || '46.2s'}
                        </span>
                        <span className={`text-[9.5px] font-medium mt-1 flex items-center gap-0.5 leading-none truncate ${
                          isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                        }`}>
                          ▲ {msg.metrics?.[0]?.change || '+14%'}
                        </span>
                      </div>
                    </div>

                    {/* Metric 2: Profile Reach */}
                    <div className={`p-3.5 rounded-[18px] sm:rounded-[20px] border-0 flex items-center gap-3 min-w-0 transition-colors duration-200 ${
                      isDarkMode ? 'bg-[#161823]/95 shadow-inner' : 'bg-[#F2F4F8]/95 shadow-xs'
                    }`}>
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isDarkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-zinc-800'
                      }`}>
                        <BarChart2 size={16} strokeWidth={2} />
                      </div>
                      <div className="flex flex-col leading-none min-w-0 overflow-hidden">
                        <span className={`text-[10px] font-normal truncate ${
                          isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                        }`}>
                          Profile Reach
                        </span>
                        <span className={`text-[15px] sm:text-[16.5px] font-bold mt-1 leading-none truncate ${
                          isDarkMode ? 'text-white' : 'text-zinc-950'
                        }`}>
                          {msg.metrics?.[1]?.value || '18.4K'}
                        </span>
                        <span className={`text-[9.5px] font-medium mt-1 flex items-center gap-0.5 leading-none truncate ${
                          isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                        }`}>
                          ▲ {msg.metrics?.[1]?.change || '+28%'}
                        </span>
                      </div>
                    </div>

                    {/* Metric 3: Sponsor Score */}
                    <div className={`p-3.5 rounded-[18px] sm:rounded-[20px] border-0 flex items-center gap-3 min-w-0 transition-colors duration-200 ${
                      isDarkMode ? 'bg-[#161823]/95 shadow-inner' : 'bg-[#F2F4F8]/95 shadow-xs'
                    }`}>
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isDarkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-zinc-800'
                      }`}>
                        <Trophy size={16} strokeWidth={2} />
                      </div>
                      <div className="flex flex-col leading-none min-w-0 overflow-hidden">
                        <span className={`text-[10px] font-normal truncate ${
                          isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                        }`}>
                          Sponsor Score
                        </span>
                        <span className={`text-[15px] sm:text-[16.5px] font-bold mt-1 leading-none truncate ${
                          isDarkMode ? 'text-white' : 'text-zinc-950'
                        }`}>
                          {msg.metrics?.[2]?.value || '94/100'}
                        </span>
                        <span className={`text-[9.5px] font-medium mt-1 flex items-center gap-0.5 leading-none truncate ${
                          isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                        }`}>
                          ▲ {msg.metrics?.[2]?.change || '+8'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Key Insights Box - Rounded corners, NO BORDER */}
                  <div className={`p-3.5 sm:p-4 rounded-[18px] sm:rounded-[20px] border-0 space-y-2 min-w-0 w-full overflow-hidden transition-colors duration-200 ${
                    isDarkMode ? 'bg-[#161823]/95 shadow-inner' : 'bg-[#F2F4F8]/95 shadow-xs'
                  }`}>
                    <div className={`flex items-center gap-1.5 text-[12.5px] sm:text-[13px] font-bold ${
                      isDarkMode ? 'text-white' : 'text-zinc-950'
                    }`}>
                      <Sparkles size={13} className={isDarkMode ? 'text-white fill-white' : 'text-zinc-900 fill-zinc-900'} />
                      <span>Key Insights</span>
                    </div>
                    <ul className={`space-y-1.5 text-[11px] sm:text-[11.5px] leading-relaxed font-normal pl-1 min-w-0 ${
                      isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
                    }`}>
                      <li className="flex items-start gap-2 min-w-0">
                        <span className="text-zinc-400 shrink-0">•</span>
                        <span className="break-all [word-break:break-word] [overflow-wrap:anywhere]">Publish your next reel during peak window: Wednesday at 6:30 PM.</span>
                      </li>
                      <li className="flex items-start gap-2 min-w-0">
                        <span className="text-zinc-400 shrink-0">•</span>
                        <span className="break-all [word-break:break-word] [overflow-wrap:anywhere]">Feature your top converted service card at position #1 in Bio.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <span className={`text-[9.5px] pl-11 font-normal mt-0.5 ${
                isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
              }`}>
                {msg.timestamp}
              </span>
            </motion.div>
          );
        })}

        {/* AI Analyzing / Thinking Indicator Bubble (Matching Reference UI: "Analyzing more insights for you...") */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-full flex flex-col items-start gap-1 min-w-0"
          >
            <div className="flex items-center gap-3 min-w-0 max-w-full">
              <div className="w-8.5 h-8.5 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border-0 overflow-hidden">
                <img 
                  src={officialLogo} 
                  alt="SuviX AI" 
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* Rounded capsule analyzing pill - NO BORDER */}
              <div className={`px-4 py-2 rounded-full shadow-md backdrop-blur-md flex items-center gap-2.5 border-0 min-w-0 max-w-full transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-[#10121A]/95 text-white' 
                  : 'bg-white/95 text-zinc-900 border border-zinc-200/70'
              }`}>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${
                    isDarkMode ? 'bg-white' : 'bg-zinc-900'
                  }`} />
                  <span className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${
                    isDarkMode ? 'bg-zinc-300' : 'bg-zinc-600'
                  }`} />
                  <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${
                    isDarkMode ? 'bg-zinc-500' : 'bg-zinc-400'
                  }`} />
                </div>
                <span className={`text-[11.5px] font-medium truncate ${
                  isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
                }`}>
                  Analyzing more insights for you...
                </span>
              </div>
            </div>
            <span className={`text-[9px] pl-11 font-normal ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}>
              10:24 AM
            </span>
          </motion.div>
        )}

        {/* Scroll anchor to guarantee silky pinning and zero jump */}
        <div ref={messagesEndRef} className="h-0.5 w-full shrink-0 pointer-events-none" />
      </div>

      {/* 4. Bottom Input Capsule & Disclaimer (ChatGPT Auto-Expanding Textarea) */}
      <div className="relative z-20 px-3.5 sm:px-5 py-3 space-y-2 backdrop-blur-md bg-transparent w-full max-w-full min-w-0">
        {/* Rounded Input Capsule / Box that expands vertically with multiline text */}
        <form 
          onSubmit={handleSubmit}
          className={`relative w-full max-w-full min-w-0 rounded-[22px] sm:rounded-[26px] transition-all p-2 pl-3.5 pr-2.5 flex items-end gap-2 shadow-2xl backdrop-blur-md ${
            isDarkMode 
              ? 'bg-[#10121B]/95 border border-white/15 focus-within:border-white/35 text-white' 
              : 'bg-white/95 border border-zinc-200/80 focus-within:border-zinc-400 text-zinc-900 shadow-xl'
          }`}
        >
          {/* Attachment / Paperclip button */}
          <button
            type="button"
            className={`mb-0.5 p-1 rounded-full transition-colors cursor-pointer shrink-0 ${
              isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-950'
            }`}
            title="Attach Context"
          >
            <Paperclip size={16} />
          </button>

          {/* Auto-expanding Multiline Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className={`w-full flex-1 min-w-0 text-xs sm:text-[13px] bg-transparent outline-none py-1 font-normal resize-none overflow-y-auto max-h-[160px] scrollbar-thin leading-relaxed break-all [word-break:break-word] [overflow-wrap:anywhere] ${
              isDarkMode 
                ? 'text-white placeholder:text-zinc-500' 
                : 'text-zinc-950 placeholder:text-zinc-400'
            }`}
            style={{ minHeight: '22px', maxHeight: '160px' }}
          />

          {/* Right controls: Helper text and Circular Send button */}
          <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
            <span className={`text-[10px] font-normal whitespace-nowrap hidden sm:inline-block pr-1 select-none ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}>
              Press Enter to send
            </span>

            {/* Circular Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all cursor-pointer font-medium ${
                isDarkMode 
                  ? 'bg-white text-zinc-950' 
                  : 'bg-zinc-950 text-white'
              } ${
                inputText.trim() ? 'hover:scale-105 active:scale-95' : 'opacity-70'
              }`}
              aria-label="Send Message"
            >
              <Send size={13} className="translate-x-[-0.5px] fill-current" />
            </button>
          </div>
        </form>

        {/* Disclaimer Text */}
        <p className={`text-[9px] text-center select-none font-normal pb-0.5 ${
          isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
        }`}>
          SuviX may make mistakes. Verify important information.
        </p>

        {/* 5. Mobile 3-Button Navigation Bar (Recent Tasks, Home, Back) */}
        <div className={`w-full pt-1.5 pb-0.5 px-10 sm:px-16 flex items-center justify-between select-none transition-colors duration-200 border-t ${
          isDarkMode 
            ? 'border-white/10 text-zinc-400' 
            : 'border-black/10 text-zinc-600'
        }`}>
          {/* 1. Recent Apps / Tasks (3 vertical lines) */}
          <button
            type="button"
            className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
              isDarkMode ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-black/5 hover:text-zinc-950'
            }`}
            title="Recent Tasks"
            aria-label="Recent Tasks"
          >
            <div className="flex items-center gap-1">
              <div className="w-0.5 h-3 rounded-full bg-current" />
              <div className="w-0.5 h-3 rounded-full bg-current" />
              <div className="w-0.5 h-3 rounded-full bg-current" />
            </div>
          </button>

          {/* 2. Home Button (Rounded Square / Pill) */}
          <button
            type="button"
            onClick={() => scrollToBottom(false)}
            className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
              isDarkMode ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-black/5 hover:text-zinc-950'
            }`}
            title="Home / Scroll to latest"
            aria-label="Home"
          >
            <div className="w-3.5 h-3.5 rounded-[4px] border-[1.8px] border-current" />
          </button>

          {/* 3. Back Button (Left Arrow) */}
          <button
            type="button"
            onClick={closeAskSuvix}
            className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
              isDarkMode ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-black/5 hover:text-zinc-950'
            }`}
            title="Close Assistant"
            aria-label="Back / Close"
          >
            <ChevronLeft size={17} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
};
