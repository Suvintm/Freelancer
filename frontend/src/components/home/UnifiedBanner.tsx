import { useState, useEffect } from 'react';
import { motion, type PanInfo } from 'framer-motion';
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

export const UnifiedBanner = ({ className }: { className?: string }) => {
  const [index, setIndex] = useState(0);
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

  const getPosition = (idx: number) => {
    const diff = idx - index;
    if (diff === 0) return 'center';
    if (diff === 1 || diff === -(BANNERS.length - 1)) return 'right';
    if (diff === -1 || diff === BANNERS.length - 1) return 'left';
    return 'hidden';
  };

  const variants = {
    center: { x: '0%', scale: 1, opacity: 1, zIndex: 30, filter: 'blur(0px)', borderRadius: '24px' },
    left: { x: '-70%', scale: 0.65, opacity: 0.3, zIndex: 20, filter: 'blur(3px)', borderRadius: '48px' },
    right: { x: '70%', scale: 0.65, opacity: 0.3, zIndex: 20, filter: 'blur(3px)', borderRadius: '48px' },
    hidden: { x: '0%', scale: 0.5, opacity: 0, zIndex: 10, filter: 'blur(6px)', borderRadius: '48px' }
  };

  return (
    <div className={`relative w-full overflow-hidden select-none group py-2 flex justify-center items-center ${className || 'h-[220px] sm:h-[280px]'}`}>
      
      {/* Container for slides */}
      <div className="relative w-full max-w-[800px] h-full flex justify-center items-center">
        {BANNERS.map((banner, i) => {
          const position = getPosition(i);
          return (
            <motion.div
              key={banner.id}
              initial={false}
              animate={position}
              variants={variants}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              drag={position === 'center' ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragStart={() => setDragging(true)}
              onDragEnd={onDragEnd}
              onClick={() => {
                if (position === 'left') prev();
                if (position === 'right') next();
              }}
              className={`absolute w-[80%] max-w-[500px] h-full overflow-hidden shadow-2xl ${position === 'center' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
            >
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              
              <motion.div 
                animate={{ opacity: position === 'center' ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 space-y-1.5 pointer-events-none"
              >
                <span className="inline-block text-[10px] font-bold text-white/90 uppercase tracking-widest border border-white/30 rounded-md px-2 py-0.5 bg-white/20 backdrop-blur-md">
                  {banner.tag}
                </span>
                <h2 className="text-lg sm:text-2xl font-semibold text-white leading-tight tracking-tight drop-shadow-md">
                  {banner.title}
                </h2>
                <p className="text-[12px] sm:text-[13px] text-zinc-300 font-medium max-w-sm leading-relaxed hidden sm:block drop-shadow-sm">
                  {banner.description}
                </p>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation Controls */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 lg:px-6 pointer-events-none z-40">
        <button
          onClick={prev}
          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 pointer-events-auto"
          aria-label="Previous"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={next}
          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 pointer-events-auto"
          aria-label="Next"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1.5 z-40">
        {BANNERS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};