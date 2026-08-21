import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import LottieComponent from 'lottie-react';
import youtubeSuccessAnimation from '../../assets/lottie/youtube_animation.json';

// Handle ESM/CJS interop for lottie-react
const Lottie = (LottieComponent as unknown as { default: typeof LottieComponent })?.default || LottieComponent;

interface SuccessOverlayProps {
  isVisible: boolean;
  type: 'youtube' | 'success';
  title?: string;
  message: string;
}

export const SuccessOverlay = ({ isVisible, type, title, message }: SuccessOverlayProps) => {
  const isYoutube = type === 'youtube';

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

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            className="relative z-10 flex flex-col items-center text-center p-8 max-w-sm"
          >
            {isYoutube ? (
              <div className="w-36 h-36 mb-2 flex items-center justify-center relative z-10">
                <Lottie 
                  animationData={youtubeSuccessAnimation} 
                  loop={true} 
                  style={{ width: '100%', height: '100%' }} 
                />
              </div>
            ) : (
              <div className="relative mb-6">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full blur-2xl opacity-15 bg-green-600"
                />
                <div className="w-20 h-20 rounded-2xl bg-neutral-50 border border-neutral-200/80 shadow-sm flex items-center justify-center relative z-10">
                  <CheckCircle2 size={44} className="text-green-600" />
                </div>
              </div>
            )}

            <h2 className="text-2xl font-semibold text-neutral-900 mb-1.5 tracking-tight">
              {title || (isYoutube ? 'Channel Found' : 'Verified')}
            </h2>
            <p className="text-neutral-500 font-normal text-sm leading-relaxed">
              {message}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
