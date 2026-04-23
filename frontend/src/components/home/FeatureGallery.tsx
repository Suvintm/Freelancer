import { motion } from 'framer-motion';
import { Rocket, Megaphone, Camera, ChevronRight, Infinity as InfiniteIcon } from 'lucide-react';

const FEATURES = [
  {
    id: 'experts',
    title: 'Find Experts Nearby',
    desc: 'Collaborate with local creative talent today.',
    icon: Rocket,
    image: 'https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'brands',
    title: 'Promote Your Brand',
    desc: 'Connect with elite YouTube content creators.',
    icon: Megaphone,
    image: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'rentals',
    title: 'Rental Services',
    desc: 'Equip your project with professional gear.',
    icon: Camera,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
  },
];

export const FeatureGallery = ({ paused }: { paused?: boolean }) => {
  return (
    <div className="relative w-full overflow-hidden space-y-3">
      {/* Header matching mobile */}
      <div className="flex items-center justify-between px-2 lg:px-6">
        <h3 className="text-[9px] lg:text-[10px] font-black text-text-main tracking-[0.15em] opacity-90 uppercase">Discover SuviX</h3>
        <InfiniteIcon size={14} className="text-text-muted opacity-50" />
      </div>

      <div className="relative overflow-hidden group">
        <motion.div 
          className="flex gap-3 lg:gap-4 w-max px-2 lg:px-6"
          animate={paused ? {} : { x: [0, -1000] }}
          transition={{ 
            duration: 35, 
            repeat: Infinity, 
            ease: "linear",
            repeatType: "loop"
          }}
        >
          {[...FEATURES, ...FEATURES, ...FEATURES, ...FEATURES].map((feature, idx) => (
            <div 
              key={`${feature.id}-${idx}`}
              className="relative w-[280px] sm:w-[340px] h-[90px] lg:h-[100px] rounded-[20px] lg:rounded-[24px] overflow-hidden group/card cursor-pointer border border-white/10 shadow-2xl transition-transform duration-500 active:scale-95"
            >
              {/* Image Background */}
              <img 
                src={feature.image} 
                alt={feature.title} 
                className="absolute inset-0 w-full h-full object-cover" 
              />
              
              {/* Linear Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />

              {/* Content Alignment */}
              <div className="relative h-full px-4 lg:px-6 flex items-center gap-3 lg:gap-4 z-10">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-[10px] lg:rounded-[12px] bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
                  <feature.icon className="w-4 h-4 lg:w-[18px] lg:h-[18px]" strokeWidth={2.5} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-[12px] lg:text-[14px] font-black text-white tracking-tight leading-tight mb-0.5">{feature.title}</h4>
                  <p className="text-[9px] lg:text-[10px] text-white/70 font-bold tracking-tight truncate">
                    {feature.desc}
                  </p>
                </div>

                <ChevronRight size={14} className="text-white opacity-60" />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Edge Fades */}
        <div className="absolute inset-y-0 left-0 w-16 lg:w-32 bg-gradient-to-r from-page to-transparent pointer-events-none z-20" />
        <div className="absolute inset-y-0 right-0 w-16 lg:w-32 bg-gradient-to-l from-page to-transparent pointer-events-none z-20" />
      </div>
    </div>
  );
};
