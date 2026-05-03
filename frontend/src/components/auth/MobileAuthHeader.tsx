import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import logo from '../../assets/darklogo.png';
import auth1 from '../../assets/auth/auth_1.png';
import auth2 from '../../assets/auth/auth_2.png';

const MarqueeColumn = ({ 
  children, 
  speed = 30, 
  reverse = false,
  offset = 0
}: { 
  children: React.ReactNode, 
  speed?: number, 
  reverse?: boolean,
  offset?: number
}) => {
  return (
    <div className="flex flex-col gap-3 overflow-hidden h-full">
      <motion.div
        animate={{ 
          y: reverse 
            ? [`${offset - 50}%`, `${offset}%`] 
            : [`${offset}%`, `${offset - 50}%`] 
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex flex-col gap-3"
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
};

interface MobileAuthHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  actionLabel: string;
  actionLink: string;
}

export const MobileAuthHeader = ({ title, subtitle, actionLabel, actionLink }: MobileAuthHeaderProps) => {
  const content1 = (
    <>
      <div className="rounded-2xl overflow-hidden aspect-[4/5] shrink-0 border border-zinc-800/50">
        <img src={auth1} alt="" className="w-full h-full object-cover grayscale-[0.2]" />
      </div>
      <div className="bg-[#FF6D4D] rounded-2xl p-6 aspect-square flex flex-col justify-end text-white shrink-0">
        <h2 className="text-3xl font-bold tracking-tighter">41%</h2>
        <p className="text-[10px] font-bold leading-tight opacity-90 uppercase">hardest roles</p>
      </div>
      <div className="rounded-2xl overflow-hidden aspect-square shrink-0 border border-zinc-800/50">
        <img src={auth2} alt="" className="w-full h-full object-cover grayscale-[0.2]" />
      </div>
    </>
  );

  const content2 = (
    <>
      <div className="bg-[#4DCA88] rounded-2xl p-6 aspect-square flex flex-col justify-end text-white shrink-0">
        <h2 className="text-3xl font-bold tracking-tighter">76%</h2>
        <p className="text-[10px] font-bold leading-tight opacity-90 uppercase">talent gap</p>
      </div>
      <div className="rounded-2xl overflow-hidden aspect-[3/4] shrink-0 border border-zinc-800/50">
        <img src={auth1} alt="" className="w-full h-full object-cover grayscale-[0.2]" />
      </div>
      <div className="bg-blue-600 rounded-2xl p-6 aspect-square flex flex-col justify-end text-white shrink-0">
        <h2 className="text-3xl font-bold tracking-tighter">10k+</h2>
        <p className="text-[10px] font-bold leading-tight opacity-90 uppercase">creators</p>
      </div>
    </>
  );

  return (
    <div className="lg:hidden relative w-full h-[45vh] overflow-hidden bg-zinc-950 border-b border-zinc-800/50">
      {/* Background Marquee */}
      <div className="absolute inset-0 flex gap-3 px-4 py-4 opacity-40 grayscale-[0.5]">
        <div className="w-1/2 h-full">
          <MarqueeColumn speed={40} offset={0}>
            {content1}
          </MarqueeColumn>
        </div>
        <div className="w-1/2 h-full">
          <MarqueeColumn speed={35} reverse offset={-20}>
            {content2}
          </MarqueeColumn>
        </div>
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black z-10" />
      
      {/* Top Navigation Overlay */}
      <div className="absolute top-0 inset-x-0 z-20 p-6 flex items-center justify-between">
        <img src={logo} alt="SuviX" className="h-8" />
        <Link 
          to={actionLink}
          className="px-4 py-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
        >
          {actionLabel}
        </Link>
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-8 pb-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-zinc-400 text-sm font-medium">
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};
