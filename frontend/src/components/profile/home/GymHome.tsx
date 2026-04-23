import { motion } from 'framer-motion';
import { Dumbbell, MapPin, Star, ArrowUpRight } from 'lucide-react';

interface Props {
  data: {
    name: string;
    location: string;
    rating: number;
    avatar: string;
  };
  onViewFull: () => void;
}

export const GymHome = ({ data, onViewFull }: Props) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-container border border-border-main rounded-[32px] space-y-4 shadow-xl dark:shadow-none group"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <img src={data.avatar} alt={data.name} className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 p-0.5" />
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1 rounded-full text-white ring-2 ring-container">
            <Dumbbell size={10} fill="currentColor" />
          </div>
        </div>
        <div>
          <h3 className="font-black text-text-main text-[15px] leading-tight">{data.name}</h3>
          <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">Fitness Center</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-page/50 rounded-2xl border border-border-main/50">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={12} className="text-text-muted" />
            <span className="text-[10px] font-black text-text-muted uppercase">Location</span>
          </div>
          <p className="text-sm font-black text-text-main truncate">{data.location}</p>
        </div>
        <div className="p-3 bg-page/50 rounded-2xl border border-border-main/50">
          <div className="flex items-center gap-2 mb-1">
            <Star size={12} className="text-text-muted fill-amber-500 stroke-amber-500" />
            <span className="text-[10px] font-black text-text-muted uppercase">Rating</span>
          </div>
          <p className="text-sm font-black text-text-main">{data.rating}/5.0</p>
        </div>
      </div>

      <button 
        onClick={onViewFull}
        className="w-full py-3 bg-text-main text-container rounded-2xl font-black text-xs uppercase tracking-tighter flex items-center justify-center gap-2 group-hover:bg-emerald-500 transition-colors"
      >
        View Full Profile
        <ArrowUpRight size={14} strokeWidth={3} />
      </button>
    </motion.div>
  );
};
