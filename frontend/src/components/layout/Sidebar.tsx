import { ReactLenis }       from 'lenis/react';
import { Plus, ExternalLink, PlayCircle, Eye, Video, TrendingUp, Settings } from 'lucide-react';
import { useNavigate }      from 'react-router-dom';
import { useAuthStore }     from '../../store/useAuthStore';
import auth1                from '../../assets/auth/auth_1.png';



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
  const { user } = useAuthStore();

  const CHANNEL = {
    name:           user?.name || 'User',
    handle:         `@${user?.username || 'user'}`,
    avatar:         user?.profilePicture || auth1,
    subscribers:    '0',
    views:          '0',
    videos:         0,
    category:       user?.primaryRole?.category || 'Member',
    role:           user?.primaryRole?.subCategory || 'Member',
    bio:            user?.bio || 'Professional Creator · UI Designer · Lifestyle Blogger · Building in public 🚀',
    followers:      user?.followers || 0,
    following:      user?.following || 0,
  };

  const youtubeChannels = user?.youtubeProfile || [];
  const displayChannels = youtubeChannels.slice(0, 2);
  const extraChannelsCount = Math.max(0, youtubeChannels.length - 2);

  return (
    <ReactLenis className="w-full h-full flex flex-col overflow-y-auto scrollbar-hide">
      <div className="flex flex-col flex-1 px-4 py-5 gap-5">

        {/* ── 1. User Identity Card ─────────────────────────────────── */}
        <div className="rounded-2xl border border-border-main bg-container p-4 space-y-3">

          {/* Avatar + name + role */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={CHANNEL.avatar}
                alt={CHANNEL.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-border-main"
              />
              {/* Verified badge */}
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center border-2 border-container">
                <svg width="7" height="6" viewBox="0 0 7 6" fill="none">
                  <path d="M1 3l1.5 1.5L6 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-text-main font-display leading-tight truncate">
                {CHANNEL.name}
              </p>
              <p className="text-[12px] text-text-muted leading-tight mt-0.5 truncate">
                {CHANNEL.handle}
              </p>
            </div>
          </div>

          {/* Bio */}
          <p className="text-[12px] text-text-muted leading-relaxed line-clamp-2">
            {CHANNEL.bio}
          </p>

          {/* Social stats */}
          <div className="flex items-center justify-around py-2 border-y border-border-secondary">
            <StatBubble value={String(CHANNEL.videos)} label="Posts" />
            <div className="w-px h-6 bg-border-main" />
            <StatBubble value={CHANNEL.followers} label="Followers" />
            <div className="w-px h-6 bg-border-main" />
            <StatBubble value={String(CHANNEL.following)} label="Following" />
          </div>

          {/* View full profile */}
          <button
            onClick={() => navigate('/profile')}
            className="
              w-full h-8 rounded-lg border border-border-main
              text-[12px] font-semibold text-text-main
              hover:bg-border-secondary transition-colors
            "
          >
            View full profile
          </button>
        </div>

        {/* ── 2. YouTube Channel Overview (Providers only) ──────────── */}
        {user?.primaryRole?.group === 'PROVIDER' && youtubeChannels.length > 0 && (
          <div className="space-y-3">
            {displayChannels.map((channel) => (
              <div 
                key={channel.channel_id} 
                className="
                  relative overflow-hidden rounded-2xl border border-border-main bg-container 
                  hover:bg-border-secondary/30 transition-all duration-300 group
                "
              >
                {/* Subtle top indicator bar */}
                <div className="h-1 w-full bg-rose-600 opacity-50" />

                <div className="p-4 space-y-4">
                  {/* Header: Identity & Brand */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={channel.thumbnail_url || auth1}
                          alt={channel.channel_name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-border-main"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-border-main">
                          <svg width="10" height="8" viewBox="0 0 24 17" fill="#FF0000">
                            <path d="M23.5 2.9c-.3-1-1.1-1.8-2.1-2.1C19.5 0 12 0 12 0S4.5 0 2.6.8C1.6 1.1.8 2 .5 2.9 0 4.8 0 8.5 0 8.5s0 3.7.5 5.6c.3 1 1.1 1.8 2.1 2.1C4.5 17 12 17 12 17s7.5 0 9.4-.8c1-.3 1.8-1.1 2.1-2.1.5-1.9.5-5.6.5-5.6s0-3.7-.5-5.6z"/>
                            <path d="M9.5 12.1V4.9l6.3 3.6-6.3 3.6z" fill="white"/>
                          </svg>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-text-main leading-tight truncate group-hover:text-rose-500 transition-colors">
                          {channel.channel_name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            Connected
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => navigate(`/channel/${channel.channel_id}`)}
                      className="text-text-muted hover:text-text-main transition-colors p-1"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>

                  {/* Stats Grid: Modern Minimalist */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: <Eye size={12} />,        value: (channel as any).view_count || '0', label: 'Views'       },
                      { icon: <PlayCircle size={12} />,  value: channel.subscriber_count || '0',   label: 'Subs' },
                      { icon: <Video size={12} />,      value: channel.video_count || '0',        label: 'Videos'      },
                    ].map(({ icon, value, label }) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-text-muted">
                          {icon}
                          <span className="text-[9px] font-bold uppercase tracking-tight opacity-70">{label}</span>
                        </div>
                        <span className="text-[13px] font-bold text-text-main font-display">
                          {typeof value === 'number' ? value.toLocaleString() : value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Area */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      className="
                        flex-1 flex items-center justify-center gap-2 h-9 rounded-xl
                        bg-text-main text-container text-[11px] font-bold 
                        hover:opacity-90 transition-all active:scale-[0.98]
                      "
                      onClick={() => navigate(`/channel/${channel.channel_id}`)}
                    >
                      <TrendingUp size={13} />
                      Dashboard
                    </button>
                    <button
                      className="
                        w-9 h-9 rounded-xl border border-border-main flex items-center justify-center
                        text-text-muted hover:text-text-main hover:bg-border-secondary transition-all
                      "
                      title="Channel Settings"
                    >
                      <Settings size={14} />
                    </button>
                  </div>
                </div>

                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-rose-600/5 rounded-full blur-2xl group-hover:bg-rose-600/10 transition-colors" />
              </div>
            ))}

            {/* Extra channels indicator */}
            {extraChannelsCount > 0 && (
              <button 
                onClick={() => navigate('/profile')}
                className="
                  w-full h-11 rounded-2xl border-2 border-dashed border-border-main 
                  flex items-center justify-center gap-2 
                  text-[11px] font-bold text-text-muted hover:text-text-main hover:border-text-muted/50 
                  hover:bg-border-secondary/30 transition-all
                "
              >
                <Plus size={14} />
                View {extraChannelsCount} other accounts
              </button>
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
                className="
                  flex flex-col items-center gap-1.5 p-3
                  rounded-xl bg-container border border-border-main
                  cursor-pointer hover:bg-border-secondary transition-colors group
                "
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
        <p className="text-center text-[11px] text-text-muted pb-4">
          © 2024 SuviX Inc.
        </p>
      </div>
    </ReactLenis>
  );
};