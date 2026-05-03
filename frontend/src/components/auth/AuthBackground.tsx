import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ob1 from '../../assets/images/onboarding/onboarding_1.jpg';
import ob2 from '../../assets/images/onboarding/onboarding_2.jpg';
import ob3 from '../../assets/images/onboarding/onboarding_3.jpg';
import ob4 from '../../assets/images/onboarding/onboarding_4.jpg';

const ONBOARDING_DATA = [
  {
    title: "Scale Your\nContent",
    subtitle: "HIGH-FIDELITY VISUALS",
    description: "Join our elite network of professional video editors and blow up your brand with cinematic content.",
    image: ob1,
  },
  {
    title: "Promote with\nPower",
    subtitle: "CREATIVE ADVERTISING",
    description: "Run high-impact social media ads and grow your reach with top-tier creators and promoters.",
    image: ob2,
  },
  {
    title: "Premium Gear\n& Services",
    subtitle: "PROFESSIONAL RENTALS",
    description: "Rent top-tier professional equipment or provide specialized services to scale your creative business.",
    image: ob3,
  },
  {
    title: "Join the\nEcosystem",
    subtitle: "ELITE CREATOR NETWORK",
    description: "Unlock the full potential of your talent. Choose your path and start your journey with SuviX today.",
    image: ob4,
  }
];

export const AuthBackground = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % ONBOARDING_DATA.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 bg-black overflow-hidden select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          {/* Background Image with Parallax */}
          <motion.img
            src={ONBOARDING_DATA[current].image}
            alt=""
            className="w-full h-full object-cover"
            initial={{ x: 20 }}
            animate={{ x: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
          
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-12 lg:p-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="max-w-md space-y-4"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-black tracking-[0.2em] text-white/50 uppercase">
                  {ONBOARDING_DATA[current].subtitle}
                </span>
                <h2 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] whitespace-pre-line tracking-tighter">
                  {ONBOARDING_DATA[current].title}
                </h2>
              </div>
              <p className="text-sm lg:text-base text-zinc-300 font-medium leading-relaxed max-w-xs">
                {ONBOARDING_DATA[current].description}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      <div className="absolute bottom-12 left-12 lg:left-16 flex items-center gap-2 z-20">
        {ONBOARDING_DATA.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 transition-all duration-500 cursor-pointer rounded-full ${
              current === i ? 'w-8 bg-white' : 'w-2 bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
