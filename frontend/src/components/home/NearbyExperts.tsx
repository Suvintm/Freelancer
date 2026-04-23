import { motion } from 'framer-motion';
import { MapPin, Star, ChevronRight } from 'lucide-react';

const EXPERTS = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    skills: ['Video Editor', 'Colorist'],
    distance: 1.2,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800',
    isOnline: true,
  },
  {
    id: 2,
    name: 'Marcus Chen',
    skills: ['Cinematographer', 'Drone'],
    distance: 2.5,
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
    isOnline: true,
  },
  {
    id: 3,
    name: 'Elena Rodriguez',
    skills: ['Photographer', 'Retoucher'],
    distance: 0.8,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=800',
    isOnline: false,
  },
  {
    id: 4,
    name: 'David Wilson',
    skills: ['Sound Designer', 'Mixer'],
    distance: 4.1,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800',
    isOnline: true,
  },
];

export const NearbyExperts = ({ paused }: { paused?: boolean }) => {
  return (
    <div className="relative w-full overflow-hidden space-y-3">
      {/* Header matching mobile app */}
      <div className="flex items-center justify-between px-6">
        <h3 className="text-[10px] font-black text-text-main tracking-[0.15em] opacity-90 uppercase">Experts Near You</h3>
        <div className="flex items-center gap-1 text-[9px] font-black text-text-muted hover:text-text-main cursor-pointer uppercase tracking-wider">
          See All <ChevronRight size={12} />
        </div>
      </div>

      <div className="relative overflow-hidden group">
        <motion.div 
          className="flex gap-4 w-max px-6"
          animate={paused ? {} : { x: [0, -800] }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "linear",
            repeatType: "loop"
          }}
        >
          {[...EXPERTS, ...EXPERTS].map((expert, idx) => (
            <div 
              key={`${expert.id}-${idx}`}
              className="relative w-[240px] h-[150px] rounded-[28px] overflow-hidden group/card cursor-pointer border border-white/10 shadow-2xl transition-all duration-500 hover:scale-[1.02]"
            >
              {/* Background Image */}
              <img 
                src={expert.image} 
                alt={expert.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" 
              />
              
              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              {/* Distance Badge */}
              <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-blue-500/80 backdrop-blur-md flex items-center gap-1 text-white">
                <MapPin size={10} fill="currentColor" />
                <span className="text-[9px] font-black">{expert.distance} KM</span>
              </div>

              {/* Online Dot */}
              {expert.isOnline && (
                <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white shadow-sm" />
              )}

              {/* Info Overlay */}
              <div className="absolute bottom-3 left-4 right-4">
                <div className="flex items-center gap-1 mb-1">
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  <span className="text-[10px] font-black text-white">{expert.rating}</span>
                </div>
                <h4 className="text-[15px] font-black text-white tracking-tight leading-none mb-1">{expert.name}</h4>
                <p className="text-[10px] text-white/60 font-bold truncate">
                  {expert.skills.join(' • ')}
                </p>
              </div>

              {/* Glass Glare */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
            </div>
          ))}
        </motion.div>

        {/* Edge Fades */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-page to-transparent pointer-events-none z-20" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-page to-transparent pointer-events-none z-20" />
      </div>
    </div>
  );
};
