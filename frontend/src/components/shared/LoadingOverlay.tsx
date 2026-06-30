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
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-xl"
        >
          <div className="flex flex-col items-center">
            {theme === 'youtube' ? (
              <div className="w-40 h-40 mb-6 flex items-center justify-center">
                <Lottie 
                  animationData={youtubeLoaderAnimation} 
                  loop={true} 
                  style={{ width: '100%', height: '100%' }} 
                />
              </div>
            ) : (
              <div className="flex gap-4 mb-8">
                {GOOGLE_COLORS.map((color, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -12, 0],
                      scale: [0.9, 1.2, 0.9],
                      opacity: [0.4, 1, 0.4]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
            
            <h2 className="text-xl font-semibold text-white mb-2 tracking-tight">
              {message}
            </h2>
            <p className="text-zinc-500 font-medium text-[10px] tracking-wider uppercase">
              Please wait while we secure your session
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
