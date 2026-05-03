import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Youtube } from 'lucide-react';

interface SuccessOverlayProps {
  isVisible: boolean;
  type: 'youtube' | 'success';
  title?: string;
  message: string;
}

export const SuccessOverlay = ({ isVisible, type, title, message }: SuccessOverlayProps) => {
  const isYoutube = type === 'youtube';
  const iconColor = isYoutube ? '#FF0000' : '#00C853';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="flex flex-col items-center text-center p-8 max-w-sm"
          >
            <div className="relative mb-8">
              <motion.div
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full blur-3xl opacity-20"
                style={{ backgroundColor: iconColor }}
              />
              {isYoutube ? (
                <Youtube size={80} style={{ color: iconColor }} className="relative z-10" />
              ) : (
                <CheckCircle2 size={80} style={{ color: iconColor }} className="relative z-10" />
              )}
            </div>

            <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">
              {title || (isYoutube ? 'YouTube Linked!' : 'Success!')}
            </h2>
            <p className="text-zinc-400 font-normal text-base leading-relaxed">
              {message}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
