import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const BANNERS = [
  {
    id: 1,
    tag:         'Featured',
    title:       'Unlock Your Creative Potential',
    description: 'Join the elite community of content creators and brands building the future.',
    image:       'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1600',
  },
  {
    id: 2,
    tag:         'Equipment',
    title:       'Professional Rental Gear',
    description: 'Access top-tier equipment for your next project — delivered to your door.',
    image:       'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1600',
  },
  {
    id: 3,
    tag:         'Network',
    title:       'Collaborate with Experts',
    description: 'Find editors, promoters, and creators near you in seconds.',
    image:       'https://images.unsplash.com/photo-1524666041070-9d87656c25bb?auto=format&fit=crop&q=80&w=1600',
  },
];

const AUTO_INTERVAL = 4800;
const DRAG_THRESHOLD = 50;

export const UnifiedBanner = () => {
  const [index, setIndex]     = useState(0);
  const [dragging, setDragging] = useState(false);

  const prev = () => setIndex((i) => (i - 1 + BANNERS.length) % BANNERS.length);
  const next = () => setIndex((i) => (i + 1) % BANNERS.length);

  useEffect(() => {
    if (dragging) return;
    const id = setInterval(next, AUTO_INTERVAL);
    return () => clearInterval(id);
  }, [dragging]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    setDragging(false);
    const { x: ox } = info.offset;
    const { x: vx } = info.velocity;
    if (ox < -DRAG_THRESHOLD || vx < -500) next();
    else if (ox > DRAG_THRESHOLD || vx > 500) prev();
  };

  return (
    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden select-none group bg-zinc-900">

      {/* Slides */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={index}
          initial={{ x: '100%', opacity: 0.7 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0.7 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32, opacity: { duration: 0.15 } }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragStart={() => setDragging(true)}
          onDragEnd={onDragEnd}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          <img
            src={BANNERS[index].image}
            alt={BANNERS[index].title}
            className="w-full h-full object-cover pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 space-y-1.5 pointer-events-none">
            <span className="inline-block text-[10px] font-bold text-white/70 uppercase tracking-widest border border-white/20 rounded px-2 py-0.5 bg-white/10 backdrop-blur-sm">
              {BANNERS[index].tag}
            </span>
            <h2 className="text-lg sm:text-2xl font-bold text-white leading-tight tracking-tight max-w-lg font-display">
              {BANNERS[index].title}
            </h2>
            <p className="text-[12px] sm:text-[13px] text-white/65 font-medium max-w-md leading-relaxed">
              {BANNERS[index].description}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Arrow controls — visible on hover */}
      <button
        onClick={prev}
        className="
          absolute left-3 top-1/2 -translate-y-1/2 z-10
          w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm
          flex items-center justify-center text-white
          opacity-0 group-hover:opacity-100 transition-opacity
          hover:bg-black/70
        "
        aria-label="Previous"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={next}
        className="
          absolute right-3 top-1/2 -translate-y-1/2 z-10
          w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm
          flex items-center justify-center text-white
          opacity-0 group-hover:opacity-100 transition-opacity
          hover:bg-black/70
        "
        aria-label="Next"
      >
        <ChevronRight size={16} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none">
        {BANNERS.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/35'
            }`}
          />
        ))}
      </div>
    </div>
  );
};