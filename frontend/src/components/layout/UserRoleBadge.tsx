import React, { useState, useRef, useEffect } from 'react';
import { 
  Crown, 
  ChevronDown, 
  Video, 
  Briefcase, 
  Sparkles, 
  ShieldCheck, 
  User as UserIcon,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../../hooks/useUserRole';
import { useTheme } from '../../hooks/useTheme';
import type { AppRole } from '../../types/auth';

interface RoleMeta {
  title: string;
  tagline: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  iconFilled?: boolean;
  links: Array<{ label: string; path: string; icon: React.ComponentType<any> }>;
}

const ROLE_CONFIG: Record<AppRole, RoleMeta> = {
  creator: {
    title: 'Creator',
    tagline: 'Create · Collaborate · Grow',
    icon: Crown,
    iconFilled: true,
    links: [
      { label: 'Creator Profile', path: '/profile', icon: UserIcon },
      { label: 'YouTube Dashboard', path: '/youtube-dashboard', icon: Video },
      { label: 'Creator Tools', path: '/creator-tools', icon: Sparkles },
    ],
  },
  editor: {
    title: 'Editor',
    tagline: 'Cut · Polish · Deliver',
    icon: Video,
    iconFilled: false,
    links: [
      { label: 'Editor Profile', path: '/profile', icon: UserIcon },
      { label: 'Upload Portal', path: '/upload-portal', icon: Video },
      { label: 'Browse Jobs', path: '/jobs', icon: Briefcase },
    ],
  },
  brand: {
    title: 'Brand',
    tagline: 'Sponsor · Campaign · Scale',
    icon: Briefcase,
    iconFilled: false,
    links: [
      { label: 'Brand Profile', path: '/profile', icon: UserIcon },
      { label: 'Find Creators', path: '/explore', icon: Sparkles },
      { label: 'Messages & Briefs', path: '/communication-hub', icon: Briefcase },
    ],
  },
  user: {
    title: 'Client',
    tagline: 'Discover · Hire · Connect',
    icon: Sparkles,
    iconFilled: false,
    links: [
      { label: 'My Profile', path: '/profile', icon: UserIcon },
      { label: 'Explore Directory', path: '/explore', icon: Sparkles },
    ],
  },
  admin: {
    title: 'Admin',
    tagline: 'Manage · Monitor · Govern',
    icon: ShieldCheck,
    iconFilled: false,
    links: [
      { label: 'Platform Settings', path: '/settings', icon: UserIcon },
    ],
  },
};

export const UserRoleBadge: React.FC = () => {
  const { user, role } = useUserRole();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const config = ROLE_CONFIG[role] || ROLE_CONFIG.creator;
  const IconComponent = config.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Role Badge Pill (Exact match to reference image) ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 h-10 p-1 pr-3 rounded-full border transition-all cursor-pointer select-none group shadow-xs ${
          isDarkMode
            ? 'bg-[#18181B] hover:bg-[#202024] border-zinc-800/90 text-white'
            : 'bg-gradient-to-r from-zinc-100 via-zinc-100/90 to-zinc-50 hover:bg-zinc-150 border-zinc-200/90 text-zinc-900'
        } ${isOpen ? 'ring-2 ring-zinc-400/30 border-zinc-400/40' : ''}`}
        title={`Current Role: ${config.title}`}
      >
        {/* Left Dark Icon Box with White Crown/Icon */}
        <div className="w-8 h-8 rounded-xl bg-black dark:bg-black flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
          <IconComponent 
            size={15} 
            className={`text-white ${config.iconFilled ? 'fill-white' : ''}`} 
            strokeWidth={2.2} 
          />
        </div>

        {/* Middle: Role Title + Tagline */}
        <div className="flex flex-col text-left leading-none justify-center">
          <span className="text-[13px] font-bold text-zinc-900 dark:text-white leading-tight tracking-tight">
            {config.title}
          </span>
          <span className="text-[9.5px] font-medium text-zinc-500 dark:text-zinc-400 leading-none whitespace-nowrap mt-0.5">
            {config.tagline}
          </span>
        </div>

        {/* Right: Chevron Down */}
        <ChevronDown 
          size={14} 
          strokeWidth={2.5} 
          className={`text-zinc-500 dark:text-zinc-400 ml-1 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-zinc-800 dark:text-zinc-200' : 'group-hover:text-zinc-800 dark:group-hover:text-zinc-200'
          }`} 
        />
      </button>

      {/* ── Interactive Role Dropdown Menu ── */}
      {isOpen && (
        <div className={`absolute left-0 top-full mt-2 w-64 rounded-2xl border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ${
          isDarkMode ? 'bg-[#121215] border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200/90 text-zinc-800'
        }`}>
          {/* Role Header Banner */}
          <div className="flex items-center justify-between px-2.5 py-2 border-b border-zinc-100 dark:border-zinc-800/80 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center shrink-0">
                <IconComponent size={14} className={`text-white ${config.iconFilled ? 'fill-white' : ''}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                  {config.title} Account
                </p>
                <p className="text-[10px] text-zinc-400 font-medium">
                  {config.tagline}
                </p>
              </div>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Active
            </span>
          </div>

          {/* Quick Action Navigation Links */}
          <div className="space-y-0.5 py-1">
            {config.links.map((link) => {
              const LinkIcon = link.icon;
              return (
                <button
                  key={link.path}
                  onClick={() => {
                    setIsOpen(false);
                    navigate(link.path);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <LinkIcon size={14} className="text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                    <span>{link.label}</span>
                  </div>
                  <ArrowRight size={12} className="text-zinc-400 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                </button>
              );
            })}
          </div>

          {/* Footer: Manage / Settings */}
          <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-1.5 mt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/settings');
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
            >
              <span>Manage Role & Preferences</span>
              <ExternalLink size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
