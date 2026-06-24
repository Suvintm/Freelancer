import { useState } from 'react';
import { ReactLenis }       from 'lenis/react';
import { Plus, ExternalLink, TrendingUp, Settings, Sparkles, Globe, Briefcase } from 'lucide-react';
import { useNavigate }      from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useTheme }         from '../../hooks/useTheme';
import auth1                from '../../assets/auth/auth_1.png';
import defaultProfile       from '../../assets/defaultprofile.png';
import { AccountSwitcher } from '../profile/AccountSwitcher';



const HIGHLIGHTS = [
  { id: 1, label: 'New',      img: null,  isNew: true  },
  { id: 2, label: 'Garden',   img: auth1, isNew: false },
  { id: 3, label: 'Cameras',  img: auth1, isNew: false },
  { id: 4, label: 'Wildlife', img: auth1, isNew: false },
];

// ── Sub-components ──────────────────────────────────────────────────────────

function StatBubble({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[15px] font-bold font-display text-text-main tracking-tight">{value}</span>
      <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────────────────────

export const Sidebar = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { isDarkMode } = useTheme();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const isClientCategory = ['social_promoter', 'direct_client'].includes(user?.primaryRole?.categorySlug || '');

  const CHANNEL = {
    name:           user?.name || 'User',
    handle:         `@${user?.username || 'user'}`,
    avatar:         user?.profilePicture || defaultProfile,
    subscribers:    '0',
    views:          '0',
    videos:         0,
    category:       user?.primaryRole?.category || 'Member',
    role:           user?.primaryRole?.subCategory || 'Member',
    bio:            user?.bio || (isClientCategory 
                      ? 'Brand Sponsor looking to collaborate with top creators for video sponsorships and integrations.' 
                      : 'Professional Creator · UI Designer · Lifestyle Blogger · Building in public 🚀'),
    followers:      user?.followers || 0,
    following:      user?.following || 0,
  };

  const youtubeChannels = user?.youtubeProfile || [];

  return (
    <ReactLenis className="w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
      <div className="flex flex-col h-full gap-6 p-6">

        {/* ── 1. User Identity Card ─────────────────────────────────── */}
        <div className={`relative rounded-[32px] border transition-all duration-300 ${isDarkMode ? 'bg-black border-border-main shadow-xl lg:shadow-none' : 'bg-zinc-50/50 border-zinc-950 border-[1.5px] shadow-sm hover:shadow-md hover:-translate-y-0.5'} p-6 space-y-3`}>

          {/* Premium Plan Badge */}
          {user?.subscription && (user.subscription.tier !== 'free' || user.subscription.planTier) && (
            <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white animate-pulse">
              <Sparkles size={8} className="text-white fill-white" />
              <span>{user.subscription.tier || user.subscription.planTier || 'PREMIUM'}</span>
            </div>
          )}

          {/* Avatar + name + role */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={CHANNEL.avatar}
                  alt={CHANNEL.name}
                  className={`w-11 h-11 rounded-full object-cover border-2 ${isDarkMode ? 'border-border-main' : 'border-zinc-200'}`}
                />
                {/* Verified badge */}
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center border-2 border-container">
                  <svg width="7" height="6" viewBox="0 0 7 6" fill="none">
                    <path d="M1 3l1.5 1.5L6 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div 
                  className="flex items-center gap-1 cursor-pointer group"
                  onClick={() => setIsSwitcherOpen(true)}
                >
                  <p className="text-[14px] font-semibold text-text-main font-display leading-tight truncate">
                    {CHANNEL.name}
                  </p>
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="text-text-muted group-hover:text-text-main transition-colors"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                <p className="text-[12px] text-text-muted leading-tight mt-0.5 truncate">
                  {CHANNEL.handle}
                </p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="text-[12px] text-text-muted leading-relaxed line-clamp-2">
            {CHANNEL.bio}
          </p>

          {/* Social stats / Client info */}
          {isClientCategory ? (
            <div className={`flex flex-col gap-2.5 py-3 border-y text-left ${isDarkMode ? 'border-border-secondary' : 'border-zinc-200'}`}>
              {user?.website && (
                <a 
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-semibold text-[#7c42f8] hover:underline"
                >
                  <Globe size={13} className="shrink-0" />
                  <span className="truncate flex-1">{user.website}</span>
                  <ExternalLink size={10} className="opacity-60 shrink-0" />
                </a>
              )}
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Briefcase size={13} className="shrink-0" />
                <span className="font-semibold truncate flex-1">{CHANNEL.category} ({CHANNEL.role})</span>
              </div>
            </div>
          ) : (
            <div className={`flex items-center justify-around py-2 border-y ${isDarkMode ? 'border-border-secondary' : 'border-zinc-200'}`}>
              <StatBubble value={String(CHANNEL.videos)} label="Posts" />
              <div className={`w-px h-6 ${isDarkMode ? 'bg-border-main' : 'bg-zinc-200'}`} />
              <StatBubble value={String(CHANNEL.followers)} label="Followers" />
              <div className={`w-px h-6 ${isDarkMode ? 'bg-border-main' : 'bg-zinc-200'}`} />
              <StatBubble value={String(CHANNEL.following)} label="Following" />
            </div>
          )}

          {/* View full profile */}
          <button
            onClick={() => navigate('/profile')}
            className={`
              w-full h-8 rounded-lg border transition-all duration-300
              text-[12px] font-semibold
              ${isDarkMode 
                ? 'border-border-main text-text-main hover:bg-border-secondary' 
                : 'border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white hover:shadow-sm cursor-pointer'}
            `}
          >
            View full profile
          </button>
        </div>

        {/* ── 2. YouTube Channel Overview (YouTube Creators only) ──────────── */}
        {user?.primaryRole?.category === 'yt_influencer' && (
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-[0.12em] px-1 mb-1">
              Connected Channel
            </h4>

            {youtubeChannels.length > 0 ? (
              <>
                {/* Only show ONE YouTube account card */}
                {youtubeChannels.slice(0, 1).map((channel) => (
                  <div 
                    key={channel.channel_id} 
                    className={`
                      relative overflow-hidden rounded-[24px] border transition-all duration-300 group
                      ${isDarkMode 
                        ? 'bg-zinc-950/40 border-border-main hover:border-zinc-700 shadow-xl' 
                        : 'bg-white border-zinc-950 border-[1.5px] shadow-sm hover:shadow-md hover:-translate-y-0.5'}
                    `}
                  >
                    {/* Top YouTube accent stripe */}
                    <div className="h-[3px] w-full bg-[#FF0000] opacity-85" />

                    <div className="p-5 space-y-4">
                      {/* Header: Identity & Brand */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={channel.thumbnail_url || auth1}
                              alt={channel.channel_name}
                              className={`w-12 h-12 rounded-full object-cover border-2 ${isDarkMode ? 'border-border-main' : 'border-zinc-200'}`}
                            />
                            {/* YouTube Mini-Badge */}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#FF0000] rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-black">
                              <svg width="8" height="6" viewBox="0 0 24 17" fill="white">
                                <path d="M23.5 2.9c-.3-1-1.1-1.8-2.1-2.1C19.5 0 12 0 12 0S4.5 0 2.6.8C1.6 1.1.8 2 .5 2.9 0 4.8 0 8.5 0 8.5s0 3.7.5 5.6c.3 1 1.1 1.8 2.1 2.1C4.5 17 12 17 12 17s7.5 0 9.4-.8c1-.3 1.8-1.1 2.1-2.1.5-1.9.5-5.6.5-5.6s0-3.7-.5-5.6z"/>
                                <path d="M9.5 12.1V4.9l6.3 3.6-6.3 3.6z" fill="#FF0000"/>
                              </svg>
                            </div>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-text-main leading-tight truncate group-hover:text-rose-500 transition-colors">
                              {channel.channel_name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                Connected
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => navigate(`/channel/${channel.channel_id}`)}
                          className={`
                            p-1.5 rounded-lg border transition-all cursor-pointer text-text-muted hover:text-text-main
                            ${isDarkMode ? 'border-border-main hover:bg-border-secondary' : 'border-zinc-200 hover:border-zinc-950 hover:bg-zinc-50'}
                          `}
                          title="Open Channel"
                        >
                          <ExternalLink size={13} />
                        </button>
                      </div>

                      {/* Stats Grid: Clean pill container */}
                      <div className={`
                        grid grid-cols-3 gap-2 p-3 rounded-2xl border text-center
                        ${isDarkMode ? 'bg-zinc-900/30 border-border-secondary' : 'bg-zinc-50 border-zinc-100'}
                      `}>
                        {[
                          { value: channel.subscriber_count || 0, label: 'Subs' },
                          { value: channel.view_count || 0, label: 'Views' },
                          { value: channel.video_count || 0, label: 'Videos' },
                        ].map(({ value, label }) => {
                          let displayVal = '0';
                          const num = typeof value === 'string' ? parseInt(value, 10) || 0 : value;
                          if (num >= 1000000) {
                            displayVal = (num / 1000000).toFixed(1) + 'M';
                          } else if (num >= 1000) {
                            displayVal = (num / 1000).toFixed(1) + 'K';
                          } else {
                            displayVal = num.toString();
                          }
                          return (
                            <div key={label} className="flex flex-col items-center">
                              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider scale-90 origin-bottom">
                                {label}
                              </span>
                              <span className="text-[13px] font-bold text-text-main font-display mt-0.5">
                                {displayVal}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Action Area */}
                      <div className="flex items-center gap-2">
                        <button
                          className={`
                            flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-[11px] font-bold transition-all active:scale-[0.98] cursor-pointer
                            ${isDarkMode 
                              ? 'bg-white text-black hover:bg-zinc-100' 
                              : 'bg-zinc-950 text-white hover:bg-zinc-900 hover:shadow-sm'}
                          `}
                          onClick={() => navigate(`/channel/${channel.channel_id}`)}
                        >
                          <TrendingUp size={13} />
                          Dashboard
                        </button>
                        <button
                          className={`
                            w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer
                            ${isDarkMode 
                              ? 'border-border-main text-text-muted hover:text-text-main hover:bg-border-secondary' 
                              : 'border-zinc-200 text-zinc-950 hover:bg-zinc-100'}
                          `}
                          title="Channel Settings"
                        >
                          <Settings size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* If multiple channels, show "See all your channels" */}
                {youtubeChannels.length > 1 && (
                  <button 
                    onClick={() => navigate('/profile')}
                    className={`
                      w-full h-11 rounded-2xl border-2 border-dashed
                      flex items-center justify-center gap-2 cursor-pointer
                      text-[11px] font-bold transition-all
                      ${isDarkMode
                        ? 'border-border-main text-text-muted hover:text-text-main hover:border-text-muted/50 hover:bg-border-secondary/30'
                        : 'border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white hover:border-solid'}
                    `}
                  >
                    <Plus size={14} />
                    See all your channels
                  </button>
                )}
              </>
            ) : (
              /* No channels connected state: Styled like a dashed file-upload / input area */
              <div 
                onClick={() => navigate('/youtube-connect')}
                className={`
                  border-2 border-dashed rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300
                  ${isDarkMode 
                    ? 'border-border-main bg-black/40 hover:border-rose-500/50 hover:bg-rose-500/5' 
                    : 'border-zinc-950 bg-zinc-50/50 hover:bg-zinc-950/10 hover:shadow-sm'}
                `}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-zinc-900 text-rose-500' : 'bg-zinc-200 text-rose-600'}`}>
                  <svg width="20" height="15" viewBox="0 0 24 17" fill="currentColor">
                    <path d="M23.5 2.9c-.3-1-1.1-1.8-2.1-2.1C19.5 0 12 0 12 0S4.5 0 2.6.8C1.6 1.1.8 2 .5 2.9 0 4.8 0 8.5 0 8.5s0 3.7.5 5.6c.3 1 1.1 1.8 2.1 2.1C4.5 17 12 17 12 17s7.5 0 9.4-.8c1-.3 1.8-1.1 2.1-2.1.5-1.9.5-5.6.5-5.6s0-3.7-.5-5.6z"/>
                    <path d="M9.5 12.1V4.9l6.3 3.6-6.3 3.6z" fill="white"/>
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-text-main">No Channels Connected</p>
                  <p className="text-[10px] text-text-muted leading-relaxed max-w-[200px] mx-auto">
                    You don't have any channels. First, go and add your YT channel.
                  </p>
                </div>
                <button 
                  className={`
                    mt-1 px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer
                    ${isDarkMode 
                      ? 'bg-rose-600 text-white hover:bg-rose-700' 
                      : 'bg-zinc-950 text-white hover:bg-zinc-900'}
                  `}
                >
                  Connect Channel
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 3. Story highlights ───────────────────────────────────── */}
        <div>
          <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.1em] px-1 mb-3">
            Archive Collections
          </h4>
          <div className="grid grid-cols-2 gap-2.5">
            {HIGHLIGHTS.map((item) => (
              <div
                key={item.id}
                className={`
                  flex flex-col items-center gap-1.5 p-3
                  rounded-xl border border-border-main
                  cursor-pointer transition-colors group
                  ${isDarkMode ? 'bg-black' : 'bg-white shadow-lg border-zinc-100'}
                `}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border border-border-main group-hover:border-text-muted transition-colors bg-border-secondary flex items-center justify-center">
                  {item.isNew ? (
                    <Plus size={16} className="text-text-muted" />
                  ) : item.img ? (
                    <img src={item.img} alt={item.label} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <span className="text-[11px] font-semibold text-text-muted group-hover:text-text-main transition-colors">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />
        <div className="text-center space-y-2.5 pb-4">
          <div className="flex items-center justify-center gap-2.5 text-[10px] text-text-muted select-none">
            <button onClick={() => navigate('/about')} className="hover:text-text-main transition-colors font-semibold cursor-pointer">About</button>
            <span className="w-1 h-1 rounded-full bg-border-main" />
            <button onClick={() => navigate('/privacy')} className="hover:text-text-main transition-colors font-semibold cursor-pointer">Privacy</button>
            <span className="w-1 h-1 rounded-full bg-border-main" />
            <button onClick={() => navigate('/terms')} className="hover:text-text-main transition-colors font-semibold cursor-pointer">Terms</button>
          </div>
          <p className="text-[10px] text-text-muted opacity-70">
            © 2026 SuviX Inc.
          </p>
        </div>
      </div>

      <AccountSwitcher 
        isOpen={isSwitcherOpen} 
        onClose={() => setIsSwitcherOpen(false)} 
      />
    </ReactLenis>
  );
};