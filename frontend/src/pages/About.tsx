import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Target, Users, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export default function About() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-[80vh] py-8 px-4 sm:px-6 lg:px-8 font-sans ${isDarkMode ? 'text-zinc-100' : 'text-zinc-950'}`}>
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Navigationn & Header */}
        <div className="flex flex-col space-y-4">
          <button 
            onClick={() => navigate(-1)}
            className={`self-start flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
              isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>
          
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase italic flex items-center gap-3">
              About SuviX <Sparkles className="text-rose-500 animate-pulse" size={28} />
            </h1>
            <p className={`text-sm sm:text-base font-medium uppercase tracking-[0.15em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              The Professional Creator & Editor Network
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className={`h-px w-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

        {/* Vision Section */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-900 text-rose-500' : 'bg-rose-50 text-rose-600'}`}>
              <Target size={20} />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-wide">Our Mission</h2>
          </div>
          <p className={`text-sm sm:text-base leading-relaxed font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-650'}`}>
            SuviX is a next-generation collaborative marketplace bridging the gap between professional video editors, designers, and top-tier YouTube creators. We empower creators to scale their content strategy with robust analytics, seamless communication channels, and secure payment layers.
          </p>
        </motion.section>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`p-6 rounded-[24px] border ${
              isDarkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200 shadow-sm'
            } space-y-3`}
          >
            <div className={`p-2 rounded-xl inline-block ${isDarkMode ? 'bg-zinc-900 text-blue-500' : 'bg-blue-50 text-blue-600'}`}>
              <Users size={18} />
            </div>
            <h3 className="font-bold text-base uppercase tracking-wider">Expert Matching</h3>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Find specialized cinematic editors, VFX wizards, colorists, and thumbnail designers vetted for productivity and quality delivery.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`p-6 rounded-[24px] border ${
              isDarkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200 shadow-sm'
            } space-y-3`}
          >
            <div className={`p-2 rounded-xl inline-block ${isDarkMode ? 'bg-zinc-900 text-green-500' : 'bg-green-50 text-green-600'}`}>
              <ShieldCheck size={18} />
            </div>
            <h3 className="font-bold text-base uppercase tracking-wider">Secure Escrow</h3>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Initiate payments with confidence. Milestone payments guarantee that editors get paid fairly and creators receive exactly what was ordered.
            </p>
          </motion.div>
        </div>

        {/* Company Info */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`p-6 sm:p-8 rounded-[32px] border ${
            isDarkMode ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          } space-y-4`}
        >
          <h3 className="font-bold text-sm uppercase tracking-[0.15em]">Company Profile</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
            <div>
              <p className={`text-[10px] uppercase font-bold tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Founded</p>
              <p className="text-sm font-bold mt-1">2026</p>
            </div>
            <div>
              <p className={`text-[10px] uppercase font-bold tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Headquarters</p>
              <p className="text-sm font-bold mt-1">Global / Remote</p>
            </div>
            <div>
              <p className={`text-[10px] uppercase font-bold tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Target Platform</p>
              <p className="text-sm font-bold mt-1">YouTube Content</p>
            </div>
            <div>
              <p className={`text-[10px] uppercase font-bold tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Status</p>
              <p className="text-sm font-bold mt-1 text-rose-500 flex items-center gap-1.5 justify-center sm:justify-start">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" /> Active
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
