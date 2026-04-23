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

  const handleNext = () => {
    if (activeSlide < ONBOARDING_DATA.length - 1) {
      setActiveSlide(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeSlide > 0) {
      setActiveSlide(prev => prev - 1);
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
        {/* Gradient Overlay for Readability - Now pinned to Background */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
      </div>

      {/* Header / Logo */}
      <header className="absolute top-0 left-0 right-0 z-20 p-6 md:p-16">
        <motion.img 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          src={logo} 
          alt="SuviX" 
          className="h-12 md:h-20 lg:h-24 w-auto brightness-0 invert" 
        />
      </header>

      <div className="relative z-10 h-full w-full overflow-hidden">

        <motion.div 
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={(_, info) => {
            const swipe = info.offset.x;
            const velocity = info.velocity.x;
            if (swipe < -100 || velocity < -500) handleNext();
            else if (swipe > 100 || velocity > 500) handleBack();
          }}
          animate={{ x: `-${activeSlide * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex h-full cursor-grab active:cursor-grabbing"
        >
          {ONBOARDING_DATA.map((slide, i) => (
            <div key={i} className="relative h-full w-full flex-shrink-0 flex flex-col justify-end">
              <div className="mx-auto w-full max-w-7xl px-8 pb-32 md:px-16 md:pb-48">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between">
                  <div className="max-w-2xl">
                    {/* Progress Indicator */}
                    <div className="mb-6 flex gap-2 md:mb-8">
                      {ONBOARDING_DATA.map((_, dotIndex) => (
                        <motion.div
                          key={dotIndex}
                          animate={{ 
                            width: activeSlide === dotIndex ? 40 : 8,
                            backgroundColor: activeSlide === dotIndex ? "#FFFFFF" : "rgba(255,255,255,0.2)"
                          }}
                          className="h-2 rounded-full"
                        />
                      ))}
                    </div>

                    <h1 className="mb-4 whitespace-pre-line text-4xl font-black leading-tight tracking-tighter md:mb-6 md:text-7xl lg:text-8xl font-display">
                      {slide.title}
                    </h1>
                    <p className="mb-8 max-w-lg text-base leading-relaxed text-zinc-400 md:mb-12 md:text-xl font-sans">
                      {slide.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 md:min-w-[280px] md:gap-4">
                    {i < ONBOARDING_DATA.length - 1 ? (
                      <>
                        <Button 
                          size="lg" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNext();
                          }}
                          className="group flex items-center justify-between md:size-xl"
                        >
                          Next
                          <div className="ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:translate-x-1 md:h-10 md:w-10">
                            <ChevronRight size={20} className="md:size-6" strokeWidth={3} />
                          </div>
                        </Button>
                        <Link to="/login" className="w-full">
                          <Button 
                            variant="ghost" 
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-sm text-zinc-500 hover:text-white md:text-base"
                          >
                            I have an account
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col gap-3 md:gap-4"
                      >
                        <Link to="/role-selection">
                          <Button size="lg" className="w-full md:size-xl" onClick={(e) => e.stopPropagation()}>
                            Join Now
                          </Button>
                        </Link>
                        <Link to="/login">
                          <Button size="lg" variant="outline" className="w-full md:size-xl" onClick={(e) => e.stopPropagation()}>
                            Already have an account? Login
                          </Button>
                        </Link>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
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
