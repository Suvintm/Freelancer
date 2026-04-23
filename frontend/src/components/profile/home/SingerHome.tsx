import { motion } from 'framer-motion';
import { Music, Headphones, Disc, ArrowUpRight } from 'lucide-react';

interface Props {
  data: {
    name: string;
    listeners: string;
    recentTrack: string;
    avatar: string;
  };
  onViewFull: () => void;
}

export const SingerHome = ({ data, onViewFull }: Props) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-container border border-border-main rounded-[32px] space-y-4 shadow-xl dark:shadow-none group"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <img src={data.avatar} alt={data.name} className="w-14 h-14 rounded-full object-cover border-2 border-violet-500 p-0.5" />
          <div className="absolute -bottom-1 -right-1 bg-violet-500 p-1 rounded-full text-white ring-2 ring-container">
            <Music size={10} fill="currentColor" />
          </div>
        </div>
        <div>
          <h3 className="font-black text-text-main text-[15px] leading-tight">{data.name}</h3>
          <p className="text-[11px] font-bold text-violet-500 uppercase tracking-widest">Professional Singer</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-page/50 rounded-2xl border border-border-main/50">
          <div className="flex items-center gap-2 mb-1">
            <Headphones size={12} className="text-text-muted" />
            <span className="text-[10px] font-black text-text-muted uppercase">Listeners</span>
          </div>
          <p className="text-sm font-black text-text-main">{data.listeners}</p>
        </div>
        <div className="p-3 bg-page/50 rounded-2xl border border-border-main/50">
          <div className="flex items-center gap-2 mb-1">
            <Disc size={12} className="text-text-muted" />
            <span className="text-[10px] font-black text-text-muted uppercase">Latest</span>
          </div>
          <p className="text-sm font-black text-text-main truncate">{data.recentTrack}</p>
        </div>
      </div>

      <button 
        onClick={onViewFull}
        className="w-full py-3 bg-text-main text-container rounded-2xl font-black text-xs uppercase tracking-tighter flex items-center justify-center gap-2 group-hover:bg-violet-500 transition-colors"
      >
        View Full Profile
        <ArrowUpRight size={14} strokeWidth={3} />
      </button>
    </motion.div>
  );
};
