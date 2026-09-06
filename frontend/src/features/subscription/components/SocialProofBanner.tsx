import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, Users } from 'lucide-react';

interface SocialProofBannerProps {
  role?: string;
  isDarkMode?: boolean;
}

const HIGHLIGHTS = [
  {
    icon: Users,
    text: 'Trusted by 1,400+ creators and media teams',
  },
  {
    icon: ShieldCheck,
    text: 'Bank-grade 256-bit encryption & RBI compliant checkout',
  },
  {
    icon: Zap,
    text: 'Instant entitlement unlock & automated GST invoicing',
  },
];

export const SocialProofBanner: React.FC<SocialProofBannerProps> = ({
  role: _role,
  isDarkMode = false,
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % HIGHLIGHTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = HIGHLIGHTS[index];
  const Icon = current.icon;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] transition-all duration-300 select-none bg-black border border-zinc-800 text-zinc-400"
    >
      <Icon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      <span className="truncate font-medium tracking-tight">{current.text}</span>
    </div>
  );
};
