import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BANNERS = [
  {
    id: 1,
    title: 'Unlock Your Creative Potential',
    description: 'Join the elite community of content creators and brands.',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1600',
  },
  {
    id: 2,
    title: 'Professional Rental Gear',
    description: 'Access top-tier equipment for your next masterpiece.',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1600',
  },
  {
    id: 3,
    title: 'Collaborate with Experts',
    description: 'Find editors, promoters, and creators near you.',
    image: 'https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&q=80&w=1600',
  },
];

export const UnifiedBanner = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full aspect-[21/9] lg:aspect-[16/6] rounded-[24px] lg:rounded-[48px] overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div
          key={BANNERS[index].id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img 
            src={BANNERS[index].image} 
            alt={BANNERS[index].title} 
            className="w-full h-full object-cover" 
          />
          
          {/* Gradient Overlay (App Style) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Content */}
          <div className="absolute bottom-6 lg:bottom-12 left-6 lg:left-12 right-6 lg:right-12 space-y-2 lg:space-y-4">
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg lg:text-4xl font-black text-white tracking-tighter"
            >
              {BANNERS[index].title}
            </motion.h2>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[10px] lg:text-base text-white/70 font-bold max-w-xl"
            >
              {BANNERS[index].description}
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full transition-all duration-300 ${
              i === index ? 'bg-white w-4 lg:w-6' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Glass Navigation arrows (Desktop only) */}
      <div className="hidden lg:flex absolute inset-y-0 left-0 right-0 items-center justify-between px-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <button 
          onClick={(e) => { e.stopPropagation(); setIndex(prev => (prev - 1 + BANNERS.length) % BANNERS.length); }}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-white/20 transition-all"
        >
          ←
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setIndex(prev => (prev + 1) % BANNERS.length); }}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-white/20 transition-all"
        >
          →
        </button>
      </div>
    </div>
  );
};
