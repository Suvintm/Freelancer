import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import logo from '../assets/whitebglogo.png';

// Assets
import onboarding1 from '../assets/images/onboarding/onboarding_1.jpg';
import onboarding2 from '../assets/images/onboarding/onboarding_2.jpg';
import onboarding3 from '../assets/images/onboarding/onboarding_3.jpg';
import onboarding4 from '../assets/images/onboarding/onboarding_4.jpg';

const ONBOARDING_DATA = [
  {
    title: "Scale Your\nContent",
    subtitle: "HIGH-FIDELITY VISUALS",
    description: "Join our elite network of professional video editors and blow up your brand with cinematic content.",
    image: onboarding1,
  },
  {
    title: "Promote with\nPower",
    subtitle: "CREATIVE ADVERTISING",
    description: "Run high-impact social media ads and grow your reach with top-tier creators and promoters.",
    image: onboarding2,
  },
  {
    title: "Premium Gear\n& Services",
    subtitle: "PROFESSIONAL RENTALS",
    description: "Rent top-tier professional equipment or provide specialized services to scale your creative business.",
    image: onboarding3,
  },
  {
    title: "Join the\nEcosystem",
    subtitle: "ELITE CREATOR NETWORK",
    description: "Unlock the full potential of your talent. Choose your path and start your journey with SuviX today.",
    image: onboarding4,
  }
];

export default function Welcome() {
  const [activeSlide, setActiveSlide] = useState(0);

  const handleNext = () => {
    setActiveSlide(prev => (prev + 1) % ONBOARDING_DATA.length);
  };



  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white font-sans">
      {/* 🌌 SPECTRAL AURA ENGINE */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{
            backgroundColor: ["#4f46e5", "#7c3aed", "#db2777", "#4f46e5"],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 opacity-20 blur-[120px]"
        />
        <div className="absolute inset-0 bg-black" />
        <AnimatePresence>
          <motion.img
            key={activeSlide}
            src={ONBOARDING_DATA[activeSlide].image}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* 💎 LOGO IDENTITY */}
      <header className="absolute top-0 left-0 right-0 z-30 p-8 md:p-12">
        <motion.img 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          src={logo} 
          alt="SuviX" 
          className="h-12 md:h-16 w-auto" 
        />
      </header>

      {/* 🔮 ELITE WEB NEXUS COMMAND CENTER */}
      <div className="relative z-20 flex h-full items-end justify-center px-6 pb-12 md:pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative w-full max-w-6xl overflow-hidden rounded-[40px] border border-white/10 bg-black/40 p-8 backdrop-blur-3xl md:p-16"
        >
          {/* Subtle Inner Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              {/* Progress Bar (Streaming Platform Style) */}
              <div className="mb-8 flex gap-3">
                {ONBOARDING_DATA.map((_, i) => (
                  <motion.div
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    className="h-1 cursor-pointer rounded-full bg-white/20"
                    animate={{ 
                      width: activeSlide === i ? 48 : 24,
                      backgroundColor: activeSlide === i ? "#FFFFFF" : "rgba(255,255,255,0.2)"
                    }}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="mb-4 text-xs font-black tracking-[0.3em] text-white/50 uppercase">
                    {ONBOARDING_DATA[activeSlide].subtitle}
                  </p>
                  <h1 className="mb-6 whitespace-pre-line text-5xl font-black leading-[1.1] tracking-tighter text-white md:text-7xl xl:text-8xl">
                    {ONBOARDING_DATA[activeSlide].title}
                  </h1>
                  <p className="max-w-xl text-lg leading-relaxed text-white/60 md:text-xl">
                    {ONBOARDING_DATA[activeSlide].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row lg:flex-col lg:min-w-[320px]">
              {activeSlide < ONBOARDING_DATA.length - 1 ? (
                <Button 
                  onClick={handleNext}
                  className="group relative flex h-16 w-full items-center justify-between overflow-hidden rounded-2xl bg-white px-8 text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="text-lg font-black uppercase tracking-tight">Continue</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white group-hover:translate-x-1 transition-transform">
                    <ChevronRight size={24} strokeWidth={3} />
                  </div>
                </Button>
              ) : (
                <>
                  <Link to="/role-selection" className="flex-1">
                    <Button 
                      className="group relative flex h-16 w-full items-center justify-between overflow-hidden rounded-2xl bg-white px-8 text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="text-lg font-black uppercase tracking-tight">Get Started</span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white group-hover:translate-x-1 transition-transform">
                        <ChevronRight size={24} strokeWidth={3} />
                      </div>
                    </Button>
                  </Link>
                  <Link to="/login" className="flex-1">
                    <Button 
                      variant="outline"
                      className="h-16 w-full rounded-2xl border-white/10 bg-white/5 text-lg font-black uppercase tracking-tight text-white backdrop-blur-xl hover:bg-white/10 transition-all"
                    >
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Industrial Grid Overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]">
        <div className="h-full w-full" style={{ 
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', 
          backgroundSize: '32px 32px' 
        }} />
      </div>
    </div>
  );
}
