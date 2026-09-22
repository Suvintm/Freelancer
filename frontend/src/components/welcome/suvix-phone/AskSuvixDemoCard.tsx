// ─────────────────────────────────────────────────────────────────────────────
// ASK SUVIX DEMO CARD — Interactive Demo of the Ask SuviX Original UI
// Exactly matches the mobile app design reference (light theme with dark AI cards)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import {
  Paperclip,
  Send,
  Menu,
  Crown,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import asksuvixWhiteBg from '../../../assets/asksuvixwhitebg.png';
import officialLogo from '../../../assets/officiallogo.png';

interface MessageItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isInitial?: boolean;
}

export function AskSuvixDemoCard() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat body when new message arrives or typing changes
  useEffect(() => {
    if (messages.length > 0 || isTyping) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const submitQuestion = (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isTyping) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: '9:41 AM',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Exactly 3 seconds (3000ms) answering / analyzing animation as requested
    setTimeout(() => {
      setIsTyping(false);
      const aiReply: MessageItem = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: 'To use this feature, please first onboard to SuviX via the buttons below!',
        timestamp: '9:41 AM',
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 3000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuestion(inputText);
  };

  return (
    // Smartphone Chassis Outer Frame (Authentic Phone Aspect Ratio ~9:19.5, Lenis Scroll Protected)
    <div
      data-lenis-prevent="true"
      className="relative w-[240px] sm:w-[285px] md:w-[295px] h-[495px] sm:h-[590px] md:h-[610px] m-0 rounded-[34px] sm:rounded-[42px] p-[3px] sm:p-[3.5px] bg-gradient-to-b from-[#3a3d52] via-[#1c1e28] to-[#0c0e14] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.12),inset_0_1px_2px_rgba(255,255,255,0.3)] flex flex-col shrink-0 select-none"
    >
      {/* Edge Antenna Bands & Buttons Silhouettes */}
      <div className="absolute -left-[2px] top-20 w-[2px] h-9 bg-zinc-600/80 rounded-l-sm" />
      <div className="absolute -left-[2px] top-32 w-[2px] h-9 bg-zinc-600/80 rounded-l-sm" />
      <div className="absolute -right-[2px] top-24 w-[2px] h-12 bg-zinc-600/80 rounded-r-sm" />

      {/* Smartphone Display Screen (Inner) */}
      <div className="relative w-full h-full rounded-[30px] sm:rounded-[38px] overflow-hidden flex flex-col justify-between bg-[#F8F9FD] text-zinc-900 border border-black/10">
        {/* 3D Curved Glass Specular Highlight Arc */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-[30px] sm:rounded-[38px] border border-white/40 pointer-events-none z-30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]"
        />

        {/* Samsung Galaxy Edge Tactile Indicator Pill on Left Edge */}
        <div
          aria-hidden="true"
          className="hidden sm:flex absolute left-0.5 top-1/2 -translate-y-1/2 z-30 pointer-events-none items-center justify-center"
        >
          <div className="w-0.5 h-8 rounded-full bg-black/15 border border-white/20 shadow-[0_0_6px_rgba(0,0,0,0.1)]" />
        </div>

        {/* Iridescent Light Wave Background Image */}
        <img
          src={asksuvixWhiteBg}
          alt="Ask SuviX Background"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-90 z-0"
        />

        {/* Dynamic Island / Front Camera Capsule */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center">
          <div className="h-3.5 px-2 rounded-full flex items-center justify-between gap-1.5 bg-black border border-white/15 shadow-[0_2px_6px_rgba(0,0,0,0.6)] text-white">
            {/* Camera Lens */}
            <div className="w-1.5 h-1.5 rounded-full bg-[#05070e] border border-white/20 flex items-center justify-center relative shadow-inner">
              <div className="w-0.5 h-0.5 rounded-full bg-[#1e40af]" />
            </div>
            {/* Earpiece slit */}
            <div className="w-2 h-0.5 rounded-full bg-zinc-800" />
            {/* Green Active LED */}
            <div className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
          </div>
        </div>

        {/* Top Header Row (Matches reference UI) */}
        <div className="relative z-20 pt-5 pb-1 px-3 flex items-center justify-between gap-2 shrink-0">
          {/* Hamburger Menu Button */}
          <button
            type="button"
            className="w-6 h-6 flex items-center justify-center text-zinc-900 hover:text-black transition-colors cursor-pointer"
            aria-label="Open Menu"
          >
            <Menu size={16} strokeWidth={2.6} className="text-zinc-900" />
          </button>

          {/* SuviX Logo & Tagline */}
          <div className="flex flex-col items-center justify-center leading-none">
            <div className="flex items-center gap-1">
              <div className="w-4.5 h-4.5 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-black p-0.5 shadow-xs">
                <img
                  src={officialLogo}
                  alt="SuviX"
                  className="w-full h-full object-cover scale-110"
                />
              </div>
              <span className="text-[14px] font-black tracking-tight text-zinc-950 font-sans leading-none">
                SuviX
              </span>
            </div>
            <span className="text-[5.5px] font-bold tracking-[0.16em] text-zinc-500 uppercase mt-0.5">
              YOUR AI CO-PILOT
            </span>
          </div>

          {/* Upgrade Pill Button */}
          <button
            type="button"
            className="h-6 px-2 rounded-full bg-white/95 hover:bg-white border border-zinc-200/90 shadow-xs flex items-center gap-1 text-zinc-900 transition-all cursor-pointer active:scale-95"
          >
            <Crown size={9} className="text-zinc-900 fill-zinc-900" />
            <span className="text-[8.5px] font-bold text-zinc-900">Upgrade</span>
          </button>
        </div>

        {/* Scrollable Chat Container (Scrollbar Hidden & Scroll Isolated to Phone Only) */}
        <div
          data-lenis-prevent="true"
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="relative z-10 flex-1 min-h-0 px-2.5 pt-1 pb-2 space-y-2 overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* Hero Greeting Section (Matches reference UI exactly) */}
          <div className="text-center pt-1 pb-1.5 px-1 select-none shrink-0">
            <p className="text-[10px] font-semibold text-zinc-600 flex items-center justify-center gap-1">
              <span>Hello there!</span>
              <span>👋</span>
            </p>
            <h2 className="text-[17px] sm:text-[21px] md:text-[23px] font-black text-zinc-950 tracking-tight leading-[1.12] mt-0.5">
              How can I help<br />you today?
            </h2>
            <p className="text-[7.5px] sm:text-[8.5px] text-zinc-500 font-normal leading-relaxed max-w-[190px] sm:max-w-[220px] mx-auto mt-0.5 sm:mt-1">
              Ask anything about content, growth, brand opportunities, analytics, earnings or just get advice.
            </p>
          </div>

          {/* Default Initial AI Message (Shown by default, "only with ai msg") */}
          <div className="w-full flex items-start gap-1.5">
            {/* AI Avatar */}
            <div className="w-5.5 h-5.5 rounded-full overflow-hidden shrink-0 shadow-sm flex items-center justify-center p-0 bg-black mt-0.5 border border-black/10">
              <img
                src={officialLogo}
                alt="SuviX AI"
                className="w-full h-full object-cover scale-115"
              />
            </div>

            {/* Dark AI Greeting Card */}
            <div className="p-2.5 rounded-[18px] rounded-tl-[4px] bg-[#12131A] text-white shadow-xl border border-white/5 space-y-1.5 flex-1 max-w-[88%]">
              {/* Title & Beta Badge */}
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[11px] font-bold text-white tracking-tight">
                  Hi! I'm SuviX
                </span>
                <span className="px-1.5 py-0.5 rounded-[4px] bg-[#8B5CF6] text-white text-[6.5px] font-bold uppercase tracking-wider leading-none shadow-xs">
                  BETA
                </span>
              </div>

              {/* Description */}
              <p className="text-[8.5px] text-zinc-300 leading-relaxed font-normal">
                Your AI co-pilot for the creator economy. Ask me anything about content ideas, brand opportunities, analytics, earnings, or just get advice.
              </p>

              {/* Closing note & Timestamp */}
              <div className="flex items-end justify-between pt-0.5">
                <span className="text-[8.5px] text-zinc-200 font-medium">
                  Let's grow together! ✨
                </span>
                <span className="text-[7.5px] text-zinc-500 font-normal">
                  9:41 AM
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Messages (User Bubbles & AI Response Cards) */}
          {messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="w-full flex items-end justify-end gap-1.5">
                  <div className="px-3 py-1.5 rounded-[16px] rounded-br-[4px] bg-white text-zinc-950 text-[10px] font-medium border border-zinc-200/90 shadow-xs leading-relaxed max-w-[82%]">
                    <p className="break-words">{msg.text}</p>
                    <div className="text-right text-[7.5px] text-zinc-400 font-normal mt-0.5">
                      {msg.timestamp}
                    </div>
                  </div>
                  {/* User Profile Avatar */}
                  <div className="w-5.5 h-5.5 rounded-full bg-zinc-900 flex items-center justify-center text-white shrink-0 shadow-xs mb-0.5">
                    <User size={11} strokeWidth={2.2} />
                  </div>
                </div>
              );
            }

            // AI Response: Exactly Black Div with Onboard Message & Buttons
            return (
              <div key={msg.id} className="w-full flex items-start gap-1.5">
                {/* AI Avatar */}
                <div className="w-5.5 h-5.5 rounded-full overflow-hidden shrink-0 shadow-sm flex items-center justify-center p-0 bg-black mt-0.5 border border-black/10">
                  <img
                    src={officialLogo}
                    alt="SuviX AI"
                    className="w-full h-full object-cover scale-115"
                  />
                </div>

                {/* Black Div Message Card */}
                <div className="p-2.5 rounded-[18px] rounded-tl-[4px] bg-[#12131A] text-white shadow-2xl border border-white/10 space-y-2 flex-1 max-w-[88%]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10.5px] font-bold text-white flex items-center gap-1">
                      <span>Unlock Ask SuviX AI</span>
                      <span>🚀</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[6.5px] font-bold uppercase tracking-wider">
                      GET ACCESS
                    </span>
                  </div>

                  <p className="text-[8.5px] text-zinc-300 leading-relaxed font-normal">
                    {msg.text}
                  </p>

                  {/* Beautiful Action Buttons: Sign Up, Log In, Choose Role */}
                  <div className="pt-1 space-y-1">
                    {/* 1. Sign Up Free Button */}
                    <Link
                      to="/signup"
                      className="w-full py-1.5 px-3 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 text-[9px] font-bold text-center shadow-md transition-all active:scale-95 block"
                    >
                      Sign Up Free →
                    </Link>

                    {/* 2. Log In Button */}
                    <Link
                      to="/login"
                      className="w-full py-1.5 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-[9px] font-semibold text-center transition-colors border border-white/15 active:scale-95 block"
                    >
                      Log In
                    </Link>

                    {/* 3. Choose Role Button */}
                    <Link
                      to="/role-selection"
                      className="w-full py-1.5 px-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[9px] font-bold text-center shadow-md transition-all active:scale-95 block"
                    >
                      Choose Role 🎯
                    </Link>
                  </div>

                  <div className="text-right text-[7.5px] text-zinc-500 font-normal pt-0.5">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {/* 3-Second Analyzing / Answering Animation ("SuviX is thinking...") */}
          {isTyping && (
            <div className="w-full flex items-start gap-1.5">
              <div className="w-5.5 h-5.5 rounded-full overflow-hidden shrink-0 shadow-sm flex items-center justify-center p-0 bg-black mt-0.5 border border-black/10">
                <img
                  src={officialLogo}
                  alt="SuviX AI"
                  className="w-full h-full object-cover scale-115"
                />
              </div>

              <div className="p-2.5 rounded-[16px] rounded-tl-[4px] bg-[#12131A] text-white shadow-xl border border-white/5 space-y-1 min-w-[120px]">
                {/* 3 Bouncing Dots */}
                <div className="flex items-center gap-1.5 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" />
                </div>
                <p className="text-[8.5px] text-zinc-300 font-medium">
                  SuviX is thinking...
                </p>
              </div>
            </div>
          )}

          {/* Anchor for automatic smooth scrolling */}
          <div ref={chatEndRef} />
        </div>

        {/* Bottom Area: Tagline & Floating Input Pill Capsule */}
        <div className="relative z-20 px-2.5 pb-2 pt-0.5 space-y-1 shrink-0">
          {/* Tagline on Right: "SAME PEOPLE. BIGGER POSSIBILITIES." (From reference image) */}
          <div className="w-full flex justify-end pr-1 select-none">
            <div className="text-right leading-none">
              <div className="w-3.5 h-[1.5px] bg-zinc-400 ml-auto mb-0.5" />
              <div className="text-[5.5px] font-bold text-zinc-500 tracking-wider uppercase leading-tight">
                SAME PEOPLE.
              </div>
              <div className="text-[6px] font-black text-zinc-900 tracking-wider uppercase leading-tight">
                BIGGER
              </div>
              <div className="text-[5.5px] font-bold text-zinc-500 tracking-wider uppercase leading-tight">
                POSSIBILITIES.
              </div>
            </div>
          </div>

          {/* Floating Dark Input Capsule */}
          <form
            onSubmit={handleSend}
            className="relative w-full rounded-full bg-[#12131A] p-1 pl-2.5 pr-1 flex items-center gap-1.5 shadow-2xl border border-black/10"
          >
            <button
              type="button"
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Attach"
            >
              <Paperclip size={12} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything..."
              className="w-full flex-1 bg-transparent outline-none text-[10px] text-white placeholder:text-zinc-400 font-normal py-0.5"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all cursor-pointer ${
                inputText.trim() && !isTyping
                  ? 'bg-white text-zinc-950 hover:scale-105 active:scale-95'
                  : 'bg-white/20 text-zinc-400 cursor-not-allowed'
              }`}
              aria-label="Send Message"
            >
              <Send size={9} className="translate-x-[-0.5px] fill-current" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
