import { ReactLenis }       from 'lenis/react';
import { Plus, ExternalLink, PlayCircle, Eye, Video, TrendingUp } from 'lucide-react';
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
    channelName:    user?.name || 'User Channel',
    channelAvatar:  user?.profilePicture || auth1,
    subscribers:    '0',
    views:          '0',
    videos:         0,
    category:       user?.role || 'Member',
    role:           user?.role || 'Member',
    bio:            'Professional Creator · UI Designer · Lifestyle Blogger · Building in public 🚀',
    followers:      '0',
    following:      0,
  };

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

        {/* ── 2. YouTube Channel Overview ──────────────────────────── */}
        <div className="rounded-2xl border border-border-main bg-container overflow-hidden">

          {/* Channel header strip */}
          <div className="h-14 bg-gradient-to-r from-red-600/90 to-red-700 relative flex items-end px-3 pb-2.5">
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
                backgroundSize: '8px 8px',
              }}
            />
            <div className="flex items-center gap-2 relative z-10">
              <svg width="16" height="11" viewBox="0 0 24 17" fill="white">
                <path d="M23.5 2.9c-.3-1-1.1-1.8-2.1-2.1C19.5 0 12 0 12 0S4.5 0 2.6.8C1.6 1.1.8 2 .5 2.9 0 4.8 0 8.5 0 8.5s0 3.7.5 5.6c.3 1 1.1 1.8 2.1 2.1C4.5 17 12 17 12 17s7.5 0 9.4-.8c1-.3 1.8-1.1 2.1-2.1.5-1.9.5-5.6.5-5.6s0-3.7-.5-5.6z"/>
                <path d="M9.5 12.1V4.9l6.3 3.6-6.3 3.6z" fill="red"/>
              </svg>
              <span className="text-white text-[11px] font-bold tracking-wide">YouTube</span>
            </div>
          </div>

          <div className="p-3 space-y-3">
            {/* Channel identity */}
            <div className="flex items-center gap-2.5">
              <img
                src={CHANNEL.channelAvatar}
                alt={CHANNEL.channelName}
                className="w-9 h-9 rounded-lg object-cover border border-border-main"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-text-main leading-tight truncate font-display">
                  {CHANNEL.channelName}
                </p>
                <span className="inline-block text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded mt-0.5">
                  {CHANNEL.category}
                </span>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="shrink-0 text-text-muted hover:text-text-main transition-colors"
                aria-label="Open channel"
              >
                <ExternalLink size={14} />
              </button>
            </div>

            {/* Channel stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <Eye size={13} />,        value: CHANNEL.views,               label: 'Views'       },
                { icon: <PlayCircle size={13} />,  value: CHANNEL.subscribers,         label: 'Subscribers' },
                { icon: <Video size={13} />,        value: String(CHANNEL.videos),      label: 'Videos'      },
              ].map(({ icon, value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-border-secondary"
                >
                  <span className="text-text-muted">{icon}</span>
                  <span className="text-[13px] font-bold text-text-main font-display leading-none">{value}</span>
                  <span className="text-[10px] text-text-muted leading-none">{label}</span>
                </div>
              ))}
            </div>

            {/* Analytics quick-link */}
            <button
              className="
                w-full flex items-center justify-center gap-1.5 h-8 rounded-lg
                bg-rose-500/10 hover:bg-rose-500/15 text-rose-500
                text-[12px] font-semibold transition-colors
              "
              onClick={() => navigate('/profile')}
            >
              <TrendingUp size={13} />
              View channel details
            </button>
          </div>
        </div>

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