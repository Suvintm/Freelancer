import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Play } from 'lucide-react';
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
    description: "Join our elite network of professional video editors and blow up your brand with high-fidelity visuals.",
    image: onboarding1,
  },
  {
    title: "Promote with\nPower",
    description: "Run high-impact social media ads and grow your reach with top-tier creators and promoters.",
    image: onboarding2,
  },
  {
    title: "Premium Gear\n& Services",
    description: "Rent top-tier professional equipment or provide specialized services to scale your creative business.",
    image: onboarding3,
  },
  {
    title: "Join the\nEcosystem",
    description: "Unlock the full potential of your talent. Choose your path and start your journey with SuviX today.",
    image: onboarding4,
  }
];

export default function Welcome() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLastSlide, setIsLastSlide] = useState(false);

  useEffect(() => {
    setIsLastSlide(activeSlide === ONBOARDING_DATA.length - 1);
  }, [activeSlide]);

  const handleNext = () => {
    if (activeSlide < ONBOARDING_DATA.length - 1) {
      setActiveSlide(prev => prev + 1);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white">
      {/* Background Images Layer */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeSlide}
            src={ONBOARDING_DATA[activeSlide].image}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full w-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* Header / Logo */}
      <header className="absolute top-0 left-0 right-0 z-20 p-10 md:p-16">
        <motion.img 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          src={logo} 
          alt="SuviX" 
          className="h-14 md:h-20 lg:h-24 w-auto brightness-0 invert" 
        />
      </header>

      {/* Main Content Section */}
      <div className="relative z-10 flex h-full flex-col justify-end">
        {/* Gradient Overlay for Readability */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/80 to-transparent" />

        <div className="relative mx-auto w-full max-w-7xl px-8 pb-16 md:px-16 md:pb-24">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              {/* Progress Indicator */}
              <div className="mb-8 flex gap-2">
                {ONBOARDING_DATA.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      width: activeSlide === i ? 40 : 8,
                      backgroundColor: activeSlide === i ? "#FFFFFF" : "rgba(255,255,255,0.2)"
                    }}
                    className="h-2 rounded-full"
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
                  <h1 className="mb-6 whitespace-pre-line text-5xl font-black tracking-tighter md:text-7xl lg:text-8xl font-display">
                    {ONBOARDING_DATA[activeSlide].title}
                  </h1>
                  <p className="mb-12 max-w-lg text-lg leading-relaxed text-zinc-400 md:text-xl font-sans">
                    {ONBOARDING_DATA[activeSlide].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-4 min-w-[280px]">
              {!isLastSlide ? (
                <>
                  <Button 
                    size="xl" 
                    onClick={handleNext}
                    className="group flex items-center justify-between"
                  >
                    Next
                    <div className="ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:translate-x-1">
                      <ChevronRight size={24} strokeWidth={3} />
                    </div>
                  </Button>
                  <Button variant="ghost" className="text-zinc-500 hover:text-white">
                    I have an account
                  </Button>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col gap-4"
                  >
                    <Button size="xl" className="w-full">
                      New User? Get Started
                    </Button>
                    <Button size="xl" variant="outline" className="w-full">
                      Already have an account? Login
                    </Button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Ticks (Industrial Aesthetic) */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-10">
        <div className="h-full w-full" style={{ 
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} />
      </div>
    </div>
  );
}
