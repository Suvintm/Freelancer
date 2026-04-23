import { motion } from 'framer-motion';
import { Youtube, PlayCircle, ArrowUpRight, Globe, Heart } from 'lucide-react';

interface Props {
  data: {
    name: string;
    subscribers: string;
    videos: number;
    avatar: string;
    username: string;
    followers: string;
    following: string;
    location: string;
  };
  onViewFull: () => void;
}

export const YTCreatorHome = ({ data, onViewFull }: Props) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-container border border-border-main rounded-[40px] overflow-hidden shadow-2xl dark:shadow-none group"
    >
      {/* 1. NATIVE YT BANNER (Linear Gradient) */}
      <div className="h-28 bg-gradient-to-br from-[#FF0000] via-[#990000] to-black relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <Youtube size={80} fill="white" stroke="none" />
        </div>
        
        {/* Floating Role Chip */}
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
          <p className="text-[9px] font-black text-white uppercase tracking-widest">YT Partner</p>
        </div>
      </div>

      {/* 2. OVERLAPPING AVATAR SECTION */}
      <div className="px-6 -mt-10 relative z-10 flex items-end justify-between">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-container overflow-hidden shadow-xl bg-border-secondary">
            <img src={data.avatar} alt={data.name} className="w-full h-full object-cover" />
          </div>
          <div className="absolute bottom-1 right-1 bg-red-500 p-1.5 rounded-full border-2 border-container text-white shadow-lg">
            <Youtube size={10} fill="currentColor" stroke="none" />
          </div>
        </div>

        {/* Mini Actions */}
        <div className="flex gap-2 mb-2">
          <button className="p-2.5 bg-border-secondary rounded-full border border-border-main hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Heart size={14} className="text-red-500" />
          </button>
          <button className="p-2.5 bg-border-secondary rounded-full border border-border-main hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Globe size={14} className="text-blue-500" />
          </button>
        </div>
      </div>

      {/* 3. PROFILE INFO */}
      <div className="px-6 pt-4 pb-6 space-y-5">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-black text-text-main text-lg tracking-tighter uppercase leading-none">{data.name}</h3>
            <VerifiedDecagram size={16} color="#FF3040" />
          </div>
          <p className="text-[11px] font-bold text-text-muted mt-1 uppercase tracking-tight">{data.username}</p>
        </div>

        {/* Role Chip */}
        <div className="inline-flex items-center px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">YouTube Creator</span>
        </div>

        {/* NATIVE STATS ROW */}
        <div className="grid grid-cols-3 gap-1 border-y border-border-main/50 py-4">
          <div className="text-center">
            <p className="text-[13px] font-black text-text-main">{data.followers}</p>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-0.5">Followers</p>
          </div>
          <div className="text-center border-x border-border-main/50">
            <p className="text-[13px] font-black text-text-main">{data.following}</p>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-0.5">Following</p>
          </div>
          <div className="text-center">
            <p className="text-[13px] font-black text-text-main">{data.videos}</p>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-0.5">Videos</p>
          </div>
        </div>

        {/* YT MILESTONE BADGES (Small) */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-border-secondary border-2 border-container flex items-center justify-center shadow-md">
                <PlayCircle size={14} className={i === 1 ? 'text-zinc-400' : i === 2 ? 'text-amber-500' : 'text-blue-400'} fill="currentColor" />
              </div>
            ))}
          </div>
          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">3 Milestones Unlocked</p>
        </div>

        {/* MAIN CTA */}
        <button 
          onClick={onViewFull}
          className="w-full py-4 bg-text-main text-container rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-red-600 transition-all transform active:scale-95 shadow-xl shadow-red-500/10"
        >
          View Full Channel Analytics
          <ArrowUpRight size={14} strokeWidth={3} />
        </button>
      </div>
    </motion.div>
  );
};

function VerifiedDecagram({ size, color }: { size: number, color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M23,12L20.56,9.22L20.9,5.54L17.29,4.72L15.4,1.54L12,3L8.6,1.54L6.71,4.72L3.1,5.53L3.44,9.21L1,12L3.44,14.78L3.1,18.47L6.71,19.29L8.6,22.47L12,21L15.4,22.46L17.29,19.28L20.9,18.46L20.56,14.79L23,12M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z" />
    </svg>
  );
}
