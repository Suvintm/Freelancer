import { motion } from 'framer-motion';
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
    <div className="flex flex-col gap-4 overflow-hidden h-full">
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
        className="flex flex-col gap-4"
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
};

export const AuthBackground = () => {
  const content1 = (
    <>
      <div className="bg-[#FF6D4D] rounded-3xl p-8 aspect-square flex flex-col justify-end text-white shadow-sm shrink-0">
        <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tighter">41%</h2>
        <p className="text-[10px] lg:text-sm font-medium leading-tight opacity-90">recruiters say entry-level positions are hardest.</p>
      </div>
      <div className="rounded-3xl overflow-hidden shadow-sm aspect-[4/5] shrink-0">
        <img src={auth1} alt="Auth 1" className="w-full h-full object-cover" />
      </div>
    </>
  );

  const content2 = (
    <>
      <div className="rounded-3xl overflow-hidden shadow-sm aspect-[3/4] shrink-0">
        <img src={auth2} alt="Auth 2" className="w-full h-full object-cover" />
      </div>
      <div className="bg-[#4DCA88] rounded-3xl p-8 aspect-square flex flex-col justify-end text-white shadow-sm shrink-0">
        <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tighter">76%</h2>
        <p className="text-[10px] lg:text-sm font-medium leading-tight opacity-90">managers admit attracting right talent is challenge.</p>
      </div>
    </>
  );

  const content3 = (
    <>
      <div className="bg-blue-600 rounded-3xl p-8 aspect-square flex flex-col justify-end text-white shadow-sm shrink-0">
        <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tighter">10k+</h2>
        <p className="text-[10px] lg:text-sm font-medium leading-tight opacity-90">creators have joined SuviX brand system.</p>
      </div>
      <div className="rounded-3xl overflow-hidden shadow-sm aspect-[4/5] shrink-0">
        <img src={auth1} alt="Auth 1" className="w-full h-full object-cover" />
      </div>
      <div className="bg-[#9333EA] rounded-3xl p-8 aspect-square flex flex-col justify-end text-white shadow-sm shrink-0">
        <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tighter">94%</h2>
        <p className="text-[10px] lg:text-sm font-medium leading-tight opacity-90">of creators see audience growth within 30 days.</p>
      </div>
    </>
  );

  const teamCard = (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex items-center justify-center p-6 aspect-square shrink-0">
      <div className="flex -space-x-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-800 bg-zinc-800 overflow-hidden">
            <img src={auth1} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="flex gap-4 w-full h-[120%] -mt-[10%] px-4 lg:px-0">
        {/* Column 1 */}
        <div className="w-1/2 lg:w-1/3 h-full">
          <MarqueeColumn speed={45} offset={0}>
            {content1}
            {teamCard}
          </MarqueeColumn>
        </div>

        {/* Column 2 - Staggered by 25% */}
        <div className="w-1/2 lg:w-1/3 h-full">
          <MarqueeColumn speed={38} offset={-25}>
            {content2}
            <div className="rounded-3xl overflow-hidden shadow-sm aspect-square shrink-0">
              <img src={auth1} alt="Auth 1" className="w-full h-full object-cover" />
            </div>
          </MarqueeColumn>
        </div>

        {/* Column 3 - Only on Desktop, Staggered by 15% */}
        <div className="hidden lg:block lg:w-1/3 h-full">
          <MarqueeColumn speed={42} offset={-15}>
            {content3}
            {teamCard}
          </MarqueeColumn>
        </div>
      </div>
    </div>
  );
};
