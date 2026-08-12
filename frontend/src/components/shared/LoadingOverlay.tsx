import { motion, AnimatePresence } from 'framer-motion';
import LottieComponent from 'lottie-react';
import youtubeLoaderAnimation from '../../assets/lottie/youtube_loader.json';

// Handle ESM/CJS interop for lottie-react
const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  theme?: 'google' | 'youtube';
}

const GOOGLE_COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];

export const LoadingOverlay = ({ 
  isVisible, 
  message = "Authenticating...", 
  theme = 'google' 
}: LoadingOverlayProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/95 backdrop-blur-xl"
        >
          {/* Subtle Ambient Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
            {theme === 'youtube' ? (
              <div className="w-36 h-36 sm:w-44 sm:h-44 mb-4 flex items-center justify-center">
                <Lottie 
                  animationData={youtubeLoaderAnimation} 
                  loop={true} 
                  style={{ width: '100%', height: '100%' }} 
                />
              </div>
            ) : (
              <div className="flex gap-3 mb-6">
                {GOOGLE_COLORS.map((color, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -10, 0],
                      scale: [0.9, 1.15, 0.9],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.18,
                      ease: "easeInOut"
                    }}
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
            
            <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight mb-1.5">
              {message}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 font-normal leading-relaxed">
              {theme === 'youtube' 
                ? 'Retrieving channel details and verifying creator permissions...'
                : 'Securing your connection and verifying your identity...'}
            </p>

            {/* Minimalist Progress Bar */}
            <div className="w-44 h-1 bg-neutral-200 rounded-full overflow-hidden mt-5 relative">
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.3, ease: 'easeInOut' }}
                className="w-1/2 h-full bg-blue-600 rounded-full"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
