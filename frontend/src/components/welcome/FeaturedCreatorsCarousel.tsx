import {
  Users,
  Play,
  Heart,
  UserPlus,
  Check,
  MoreHorizontal,
  Globe,
} from 'lucide-react';

import creatorBg from '../../assets/creatorbg.png';

interface SocialLink {
  type: 'youtube' | 'instagram' | 'linkedin' | 'tiktok' | 'x' | 'spotify' | 'globe';
}

interface CreatorCardData {
  id: string;
  name: string;
  username: string;
  category: string;
  image: string;
  scriptNote: string;
  bio: string;
  socials: SocialLink[];
  extraSocialsCount: number;
}

const LANGUAGE_BADGES = [
  { id: 'all', label: 'All', active: true },
  { id: 'tamil', label: 'தமிழ்', active: false },
  { id: 'kannada', label: 'ಕನ್ನಡ', active: false },
  { id: 'hindi', label: 'हिन्दी', active: false },
  { id: 'telugu', label: 'తెలుగు', active: false },
  { id: 'malayalam', label: 'മലയാളം', active: false },
];

const CREATORS: CreatorCardData[] = [
  {
    id: 'rohan-d',
    name: 'Rohan D',
    username: '@rohandiaries',
    category: 'Cinema',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    scriptNote: 'Stories\nbeyond\nScreens',
    bio: 'Actor | Storyteller | Traveler',
    socials: [{ type: 'youtube' }, { type: 'instagram' }, { type: 'x' }],
    extraSocialsCount: 2,
  },
  {
    id: 'meera-s',
    name: 'Meera S',
    username: '@meeramusic',
    category: 'Music',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    scriptNote: 'Music\nHeals\nAlways',
    bio: 'Singer | Songwriter | Live Performer',
    socials: [{ type: 'youtube' }, { type: 'instagram' }, { type: 'spotify' }],
    extraSocialsCount: 1,
  },
  {
    id: 'arjun-k',
    name: 'Arjun K',
    username: '@arjunkodes',
    category: 'Tech',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
    scriptNote: 'Build\nLearn\nShare',
    bio: 'Tech Creator | Educator | Developer',
    socials: [{ type: 'youtube' }, { type: 'instagram' }, { type: 'linkedin' }],
    extraSocialsCount: 2,
  },
  {
    id: 'ananya-r',
    name: 'Ananya R',
    username: '@foodwithananya',
    category: 'Food',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    scriptNote: 'Good\nFood\nHappier\nPeople',
    bio: 'Food | Lifestyle | Cultural Stories',
    socials: [{ type: 'youtube' }, { type: 'instagram' }, { type: 'globe' }],
    extraSocialsCount: 1,
  },
  {
    id: 'karan-v',
    name: 'Karan V',
    username: '@karan.travels',
    category: 'Travel',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    scriptNote: 'Explore\nCreate\nInspire',
    bio: 'Travel | Photography | Adventure',
    socials: [{ type: 'youtube' }, { type: 'instagram' }, { type: 'x' }],
    extraSocialsCount: 2,
  },
  {
    id: 'elena-v',
    name: 'Elena V',
    username: '@elenavisions',
    category: 'Design',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
    scriptNote: 'Design\na better\ntomorrow',
    bio: 'UI/UX | Visual Design | Creator Life',
    socials: [{ type: 'youtube' }, { type: 'instagram' }, { type: 'globe' }],
    extraSocialsCount: 1,
  },
];

// Compact branded social icons helper
const renderSocialIcon = (type: SocialLink['type']) => {
  switch (type) {
    case 'youtube':
      return (
        <div className="w-4.5 h-4.5 rounded-full bg-[#FF0000] flex items-center justify-center shadow-2xs shrink-0" title="YouTube">
          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </div>
      );
    case 'instagram':
      return (
        <div className="w-4.5 h-4.5 rounded-full bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] flex items-center justify-center shadow-2xs shrink-0" title="Instagram">
          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-none stroke-current stroke-2">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
          </svg>
        </div>
      );
    case 'linkedin':
      return (
        <div className="w-4.5 h-4.5 rounded-full bg-[#0077B5] flex items-center justify-center shadow-2xs shrink-0" title="LinkedIn">
          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.67a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
          </svg>
        </div>
      );
    case 'x':
      return (
        <div className="w-4.5 h-4.5 rounded-full bg-zinc-900 border border-zinc-700/80 flex items-center justify-center shadow-2xs shrink-0" title="X (Twitter)">
          <svg viewBox="0 0 24 24" className="w-2 h-2 fill-white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      );
    case 'spotify':
      return (
        <div className="w-4.5 h-4.5 rounded-full bg-[#1DB954] flex items-center justify-center shadow-2xs shrink-0" title="Spotify">
          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.625.625 0 0 1-.86.208c-2.355-1.439-5.32-1.764-8.814-.966a.625.625 0 1 1-.278-1.219c3.824-.875 7.102-.505 9.744 1.117.297.182.39.57.208.86zm1.226-2.724a.782.782 0 0 1-1.077.257c-2.697-1.658-6.809-2.137-9.998-1.17a.782.782 0 1 1-.453-1.498c3.645-1.106 8.196-.57 11.27 1.334a.782.782 0 0 1 .258 1.077zm.105-2.835C14.692 8.92 9.36 8.742 6.273 9.68a.938.938 0 1 1-.544-1.795c3.543-1.076 9.44-.868 13.197 1.362a.937.937 0 1 1-.909 1.642z" />
          </svg>
        </div>
      );
    case 'globe':
      return (
        <div className="w-4.5 h-4.5 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shadow-2xs shrink-0" title="Website">
          <Globe className="w-2.5 h-2.5 text-zinc-300" />
        </div>
      );
    default:
      return null;
  }
};

// Reusable single Creator Card Component
const CreatorCard: React.FC<{ creator: CreatorCardData }> = ({ creator }) => {
  return (
    <div className="w-[220px] xs:w-[235px] sm:w-[250px] shrink-0 flex flex-col select-none py-1">
      {/* Clean Card: NO BLACK BORDER, Sleek Rounded Dark Style with Soft Elevation */}
      <div className="relative rounded-[20px] sm:rounded-[22px] overflow-hidden flex flex-col justify-between h-full bg-zinc-950 text-white border-0 shadow-[0_8px_26px_rgba(0,0,0,0.22)]">
        
        {/* Card Top: Photo Container with Overlays */}
        <div className="relative w-full h-[145px] xs:h-[150px] sm:h-[158px] overflow-hidden bg-zinc-900">
          <img
            src={creator.image}
            alt={creator.name}
            loading="lazy"
            draggable="false"
            className="w-full h-full object-cover object-center select-none pointer-events-none"
          />

          {/* Gradient Fade into card body */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-black/30 pointer-events-none" />

          {/* Top Pill Category Tag */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-semibold tracking-wide bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-xs">
              {creator.category}
            </span>
          </div>

          {/* Top Right More Menu Button */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <div
              className="w-5.5 h-5.5 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/10"
            >
              <MoreHorizontal size={12} />
            </div>
          </div>

          {/* Floating Handwritten Script on Photo */}
          <div className="absolute bottom-2 right-2.5 z-10 text-right rotate-[-4deg] pointer-events-none">
            <span className="font-['Caveat'] text-[12.5px] sm:text-[14px] font-bold italic tracking-tight leading-tight block text-zinc-100 drop-shadow-md">
              {creator.scriptNote.split('\n').map((line, lIdx) => (
                <span key={lIdx} className="block leading-none">
                  {line}
                </span>
              ))}
            </span>
          </div>
        </div>

        {/* Card Bottom: Info & Follow CTA */}
        <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1">
          <div>
            {/* Name + Verified Checkmark Badge */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="text-[13.5px] sm:text-[15px] font-black text-white tracking-tight leading-tight truncate">
                {creator.name}
              </h3>
              <div
                className="w-3.5 h-3.5 rounded-full bg-white text-zinc-950 flex items-center justify-center shrink-0"
                title="Verified Creator"
              >
                <Check size={8} strokeWidth={3.5} />
              </div>
            </div>

            {/* Username */}
            <p className="text-[10px] sm:text-[11px] text-zinc-400 font-normal mb-1 truncate">
              {creator.username}
            </p>

            {/* Bio / Description */}
            <p className="text-[11px] sm:text-xs text-zinc-300 font-normal leading-snug line-clamp-1 mb-2.5">
              {creator.bio}
            </p>
          </div>

          <div>
            {/* Social Media Links Row */}
            <div className="flex items-center gap-1.5 mb-2.5">
              {creator.socials.map((social, sIdx) => (
                <div key={sIdx}>
                  {renderSocialIcon(social.type)}
                </div>
              ))}

              {/* Extra socials counter */}
              {creator.extraSocialsCount > 0 && (
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800">
                  +{creator.extraSocialsCount}
                </span>
              )}
            </div>

            {/* Follow CTA Button */}
            <div
              className="w-full py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 bg-white text-zinc-950 shadow-2xs"
            >
              <UserPlus size={12} />
              <span>Follow</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

interface FeaturedCreatorsCarouselProps {
  className?: string;
}

export const FeaturedCreatorsCarousel: React.FC<FeaturedCreatorsCarouselProps> = ({ className = '' }) => {
  return (
    <section className={`relative w-full py-5 sm:py-7 lg:py-9 bg-white overflow-hidden select-none font-sans ${className}`}>
      
      {/* ── AMBIENT BACKGROUND GRAPHIC CONTAINER ── */}
      <div className="absolute top-0 right-0 w-full h-[260px] sm:h-[320px] lg:h-[360px] pointer-events-none select-none z-0 overflow-hidden">
        <img
          src={creatorBg}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover sm:object-contain object-right opacity-90 sm:opacity-95 select-none pointer-events-none"
        />
        {/* Soft edge gradients to blend seamlessly into solid white page */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent w-full sm:w-[55%]" />
        <div className="absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-white via-white/80 to-transparent" />
      </div>

      {/* ── 1. COMPACT TOP HEADER SPLIT (Centered max-w-7xl) ── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 sm:gap-6">
          
          {/* Left Block: Eyebrow, Main Title, Subtitle, Language Badges */}
          <div className="flex-1 max-w-2xl text-left">
            {/* Top Eyebrow */}
            <span className="text-[9.5px] sm:text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500 mb-1.5 sm:mb-2 block">
              CREATORS WITHOUT BORDERS
            </span>

            {/* Main Headline: Different Languages. Bigger Stories. */}
            <h2 className="text-[24px] xs:text-[28px] sm:text-[36px] lg:text-[42px] font-black text-zinc-950 tracking-[-0.035em] leading-[1.06] mb-2 sm:mb-2.5">
              Different Languages.<br />
              <span className="relative inline-block font-['Instrument_Serif',Playfair_Display,Georgia,serif] italic font-normal text-zinc-950 tracking-normal text-[1.10em] pt-0.5">
                Bigger Stories.
                {/* Purple-to-pink gradient underline brush stroke */}
                <svg
                  viewBox="0 0 200 18"
                  className="absolute -bottom-1 left-0 w-full text-purple-500 fill-none stroke-current stroke-[3] stroke-linecap-round pointer-events-none"
                >
                  <path d="M4 10 C 50 16, 140 14, 196 6" stroke="url(#svx-creators-grad)" />
                  <defs>
                    <linearGradient id="svx-creators-grad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h2>

            {/* Subtitle Description */}
            <p className="text-[11.5px] sm:text-[13px] text-zinc-600 font-normal leading-relaxed max-w-xl mb-3.5 sm:mb-4.5">
              Discover creators from different languages, cultures and communities who are creating, sharing and growing with SuviX.
            </p>

            {/* Language Badges (All active, Inactive with black text, black border & white bg, non-interactive) */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 pointer-events-none select-none">
              {LANGUAGE_BADGES.map((badge) => (
                <span
                  key={badge.id}
                  className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-bold text-[11px] sm:text-xs whitespace-nowrap shrink-0 ${
                    badge.active
                      ? 'bg-zinc-950 text-white border border-zinc-950 shadow-xs'
                      : 'bg-white text-zinc-950 border border-zinc-950 shadow-2xs'
                  }`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>

          {/* Right Block: 3 Compact Stats Highlight Cluster */}
          <div className="flex lg:flex-col items-center lg:items-start justify-between sm:justify-start gap-3 sm:gap-4.5 lg:gap-3.5 pt-1 sm:pt-2 shrink-0 bg-white/70 lg:bg-transparent backdrop-blur-xs lg:backdrop-blur-none p-2.5 sm:p-0 rounded-xl border border-zinc-100 lg:border-none shadow-2xs lg:shadow-none">
            {/* Stat 1: 2M+ Creators worldwide */}
            <div className="flex items-center gap-2 sm:gap-2.5 text-left">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Users size={14} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-zinc-950 tracking-tight leading-tight">2M+</div>
                <div className="text-[9px] sm:text-[10px] text-zinc-500 font-medium leading-tight">Creators worldwide</div>
              </div>
            </div>

            {/* Stat 2: 100M+ Stories shared */}
            <div className="flex items-center gap-2 sm:gap-2.5 text-left">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Play size={12} className="fill-current ml-0.5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-zinc-950 tracking-tight leading-tight">100M+</div>
                <div className="text-[9px] sm:text-[10px] text-zinc-500 font-medium leading-tight">Stories shared</div>
              </div>
            </div>

            {/* Stat 3: A brighter creative tomorrow */}
            <div className="flex items-center gap-2 sm:gap-2.5 text-left">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Heart size={12} className="fill-current" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-zinc-950 tracking-tight leading-tight">A brighter</div>
                <div className="text-[9px] sm:text-[10px] text-zinc-500 font-medium leading-tight">creative tomorrow</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── 2. FULL-BLEED EDGE-TO-EDGE CONTINUOUS INFINITE MARQUEE (NO GAP ON EITHER SIDE, TOUCHES BOTH ENDS) ── */}
      <div className="relative w-full overflow-hidden pointer-events-none select-none py-1">
        <div className="animate-continuous-marquee flex gap-3.5 sm:gap-4.5">
          {/* Set 1 */}
          {CREATORS.map((creator, index) => (
            <CreatorCard key={`set1-${creator.id}-${index}`} creator={creator} />
          ))}
          {/* Set 2 (Seamless infinite duplicate) */}
          {CREATORS.map((creator, index) => (
            <CreatorCard key={`set2-${creator.id}-${index}`} creator={creator} />
          ))}
        </div>
      </div>

      {/* ── 3. BOTTOM SUBTEXT ── */}
      <div className="mt-3 sm:mt-4 text-center">
        <span className="text-[10.5px] sm:text-[11.5px] text-zinc-500 font-medium">
          Creators from every language. A bigger, brighter tomorrow.
        </span>
      </div>

    </section>
  );
};

