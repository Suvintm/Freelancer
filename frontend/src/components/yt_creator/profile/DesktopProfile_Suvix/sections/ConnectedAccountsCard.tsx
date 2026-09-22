/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

interface ConnectedAccountsCardProps {
  user: any;
}

// ── 1. YouTube Official Badge: Red rounded-rect with white play triangle ─────────
const YouTubeAppIcon: React.FC<{ className?: string }> = ({ className = "w-[22px] h-[16px]" }) => (
  <svg viewBox="0 0 24 17" className={`${className} shrink-0`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M23.498 2.617a2.983 2.983 0 0 0-2.101-2.113C19.544 0 12 0 12 0S4.456 0 2.603.504A2.983 2.983 0 0 0 .502 2.617C0 4.482 0 8.5 0 8.5s0 4.018.502 5.883a2.983 2.983 0 0 0 2.101 2.113C4.456 17 12 17 12 17s7.544 0 9.397-.504a2.983 2.983 0 0 0 2.101-2.113C24 12.518 24 8.5 24 8.5s0-4.018-.502-5.883z"
      fill="#FF0000"
    />
    <polygon points="9.6 12.14 15.82 8.5 9.6 4.86" fill="#FFFFFF" />
  </svg>
);

// ── 2. Instagram Official Multi-Stop Gradient Camera Icon ───────────────────────
const InstagramAppIcon: React.FC<{ className?: string }> = ({ className = "w-[20px] h-[20px]" }) => {
  const gradientId = "ig-gradient-connected-badge";
  return (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f09433" />
          <stop offset="25%" stopColor="#e6683c" />
          <stop offset="50%" stopColor="#dc2743" />
          <stop offset="75%" stopColor="#cc2366" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke={`url(#${gradientId})`} strokeWidth="2.2" />
      <circle cx="12" cy="12" r="4.3" stroke={`url(#${gradientId})`} strokeWidth="2.2" />
      <circle cx="17.2" cy="6.8" r="1.3" fill={`url(#${gradientId})`} />
    </svg>
  );
};

// ── 3. TikTok Official Chromatic Aberration 3D Icon (Cyan, Red & Black) ─────────
const TikTokAppIcon: React.FC<{ className?: string }> = ({ className = "w-[19px] h-[19px]" }) => (
  <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Cyan Offset Layer */}
    <path
      d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 1 0 6.34 6.34V8.5a8.27 8.27 0 0 0 4.84 1.56V6.69z"
      fill="#25F4EE"
      transform="translate(-0.8, -0.6)"
    />
    {/* Red Offset Layer */}
    <path
      d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 1 0 6.34 6.34V8.5a8.27 8.27 0 0 0 4.84 1.56V6.69z"
      fill="#FE2C55"
      transform="translate(0.8, 0.6)"
    />
    {/* Center Black Glyph */}
    <path
      d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 1 0 6.34 6.34V8.5a8.27 8.27 0 0 0 4.84 1.56V6.69z"
      fill="#000000"
    />
  </svg>
);

// ── 4. X (Twitter) Official Vector Mark ──────────────────────────────────────────
const XAppIcon: React.FC<{ className?: string }> = ({ className = "w-[17px] h-[17px]" }) => (
  <svg viewBox="0 0 24 24" className={`${className} shrink-0 text-black dark:text-white`} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// ── 5. Spotify Official Green Circle + Sound Waves ──────────────────────────────
const SpotifyAppIcon: React.FC<{ className?: string }> = ({ className = "w-[20px] h-[20px]" }) => (
  <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#1ED760" />
    <path
      d="M16.89 15.63c-.19 0-.38-.06-.54-.17-2.31-1.41-5.22-1.73-8.65-.95-.41.09-.82-.16-.91-.57-.09-.41.16-.82.57-.91 3.79-.86 7.02-.5 9.65 1.11.36.22.48.7.26 1.06-.11.26-.35.43-.38.43zm1.18-2.61c-.24 0-.47-.09-.65-.24-2.64-1.63-6.67-2.1-9.79-1.15-.5.15-1.03-.13-1.18-.63-.15-.5.13-1.03.63-1.18 3.58-1.09 8.04-.56 11.08 1.31.44.27.58.85.31 1.29-.12.38-.55.6-.4.6zm.13-2.73c-3.17-1.88-8.4-2.06-11.43-1.14-.59.18-1.22-.16-1.4-.75-.18-.59.16-1.22.75-1.4 3.49-1.06 9.28-.85 12.92 1.31.53.31.7 1 .39 1.53-.25.43-.72.64-1.23.45z"
      fill="#000000"
    />
  </svg>
);

export const ConnectedAccountsCard: React.FC<ConnectedAccountsCardProps> = ({ user }) => {
  const navigate = useNavigate();

  // Dynamic account counts from linked channels / profiles
  const ytCount = Array.isArray(user?.youtubeProfile) && user.youtubeProfile.length > 0 
    ? user.youtubeProfile.length 
    : 2;
  const instaCount = Array.isArray(user?.instagramAccounts) && user.instagramAccounts.length > 0 
    ? user.instagramAccounts.length 
    : 1;

  const accounts = [
    {
      id: 'youtube',
      name: 'YouTube',
      count: ytCount,
      label: ytCount === 1 ? 'Account' : 'Accounts',
      icon: YouTubeAppIcon,
      action: () => navigate('/youtube-dashboard'),
    },
    {
      id: 'instagram',
      name: 'Instagram',
      count: instaCount,
      label: instaCount === 1 ? 'Account' : 'Account',
      icon: InstagramAppIcon,
      action: () => navigate('/reels'),
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      count: 1,
      label: 'Account',
      icon: TikTokAppIcon,
      action: () => navigate('/connect-socials'),
    },
    {
      id: 'x',
      name: 'X (Twitter)',
      count: 1,
      label: 'Account',
      icon: XAppIcon,
      action: () => navigate('/connect-socials'),
    },
    {
      id: 'spotify',
      name: 'Spotify',
      count: 1,
      label: 'Account',
      icon: SpotifyAppIcon,
      action: () => navigate('/connect-socials'),
    },
  ];

  return (
    <div className="w-full bg-[#F8F9FA] dark:bg-[#121215] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
      
      {/* Left Text Block */}
      <div className="shrink-0">
        <h3 className="text-xs sm:text-[13px] font-bold text-zinc-900 dark:text-white tracking-tight leading-tight">
          Connected Accounts
        </h3>
        <p className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-medium leading-none">
          Manage all your creator accounts in one place.
        </p>
      </div>

      {/* Right Horizontal App Divs List */}
      <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-hide py-0.5">
        {accounts.map((acc) => {
          const Icon = acc.icon;
          return (
            <button
              key={acc.id}
              type="button"
              onClick={acc.action}
              className="flex items-center gap-2.5 h-[42px] px-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#18181B] hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer shadow-2xs group shrink-0"
              title={`${acc.name}: ${acc.count} ${acc.label}`}
            >
              <Icon />
              
              <div className="flex flex-col text-left leading-none">
                <span className="text-[13px] font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  {acc.count}
                </span>
                <span className="text-[9.5px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {acc.label}
                </span>
              </div>
            </button>
          );
        })}

        {/* Connect More Button */}
        <button
          type="button"
          onClick={() => navigate('/connect-socials')}
          className="flex items-center gap-1.5 h-[42px] px-3.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent hover:bg-white dark:hover:bg-zinc-850 hover:border-zinc-400 transition-all cursor-pointer group shrink-0 text-zinc-800 dark:text-zinc-200"
        >
          <Plus size={14} strokeWidth={2.2} className="text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
          <span className="text-xs font-bold leading-none">
            Connect More
          </span>
        </button>
      </div>

    </div>
  );
};
