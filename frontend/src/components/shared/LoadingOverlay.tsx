import { motion, AnimatePresence } from 'framer-motion';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  theme?: 'google' | 'youtube';
}

const GOOGLE_COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];
const YOUTUBE_COLORS = ['#FF0000', '#FF0000', '#FF0000', '#FF0000'];

export const LoadingOverlay = ({ 
  isVisible, 
  message = "Authenticating...", 
  theme = 'google' 
}: LoadingOverlayProps) => {
  const currentColors = theme === 'youtube' ? YOUTUBE_COLORS : GOOGLE_COLORS;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-xl"
        >
          <div className="flex flex-col items-center">
            <div className="flex gap-4 mb-8">
              {currentColors.map((color, i) => (
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
