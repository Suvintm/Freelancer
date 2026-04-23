import { motion } from 'framer-motion';
import { Rocket, Sparkles, Clock } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
}

export const PlaceholderPage = ({ title }: PlaceholderPageProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <div className="relative inline-block">
          <div className="absolute -top-4 -right-4 text-orange-500 animate-pulse">
            <Sparkles size={24} />
          </div>
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-orange-500/20 to-rose-500/20 flex items-center justify-center border border-orange-500/30">
            <Rocket size={48} className="text-orange-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl lg:text-5xl font-black text-text-main tracking-tight uppercase italic">
            {title}
          </h1>
          <div className="flex items-center justify-center gap-2 text-text-muted font-bold text-xs lg:text-sm uppercase tracking-[0.2em]">
            <Clock size={14} />
            <span>Still needs to be developed</span>
          </div>
        </div>

        <p className="max-w-md mx-auto text-text-muted font-medium text-sm lg:text-base leading-relaxed opacity-60">
          We are working hard to bring this feature to life. Stay tuned for updates as we continue to build the future of SuviX.
        </p>

        <div className="pt-8">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-border-main to-transparent mx-auto" />
        </div>
      </motion.div>
    </div>
  );
};

export default PlaceholderPage;
