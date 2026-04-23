import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';

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

const AUTO_SCROLL_MS = 4500;
const DRAG_THRESHOLD = 50;

export const UnifiedBanner = () => {
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-scroll logic (Right to Left)
  useEffect(() => {
    if (isDragging) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % BANNERS.length);
    }, AUTO_SCROLL_MS);
    return () => clearInterval(timer);
  }, [isDragging]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    setIsDragging(false);
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -DRAG_THRESHOLD || velocity < -500) {
      setIndex((prev) => (prev + 1) % BANNERS.length);
    } else if (offset > DRAG_THRESHOLD || velocity > 500) {
      setIndex((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
    }
  };

  return (
    <div className="relative w-full aspect-[16/9] rounded-[28px] overflow-hidden group touch-pan-y select-none">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={index}
          custom={index}
          initial={{ x: '100%', opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0.5 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={onDragEnd}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          <img 
            src={BANNERS[index].image} 
            alt={BANNERS[index].title} 
            className="w-full h-full object-cover pointer-events-none" 
          />
          
          {/* Gradient Overlay (App Style) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Content */}
          <div className="absolute bottom-8 left-8 right-8 space-y-2 pointer-events-none">
            <h2 className="text-xl lg:text-3xl font-black text-white tracking-tighter leading-tight uppercase">
              {BANNERS[index].title}
            </h2>
            <p className="text-[11px] lg:text-sm text-white/70 font-bold max-w-md line-clamp-2">
              {BANNERS[index].description}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Pagination Dots (App Style) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none">
        {BANNERS.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === index ? 'bg-white w-4' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
