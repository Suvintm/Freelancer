import { motion } from 'framer-motion';
import { ArrowLeft, Scale, Edit3, ShieldAlert, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export default function TermsAndConditions() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-[80vh] py-8 px-4 sm:px-6 lg:px-8 font-sans ${isDarkMode ? 'text-zinc-100' : 'text-zinc-950'}`}>
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Header */}
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
              Terms & Conditions <Scale className="text-rose-500" size={28} />
            </h1>
            <p className={`text-sm sm:text-base font-medium uppercase tracking-[0.15em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Last Updated: June 23, 2026
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className={`h-px w-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

        {/* Introduction */}
        <p className={`text-sm sm:text-base leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-650'}`}>
          Welcome to SuviX. These terms and conditions outline the rules and regulations for the use of SuviX's website and application platform. By accessing this platform, we assume you accept these terms and conditions in full. Do not continue to use SuviX if you do not agree to all terms stated here.
        </p>

        {/* Section 1: User Account Obligations */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-900 text-rose-500' : 'bg-rose-50 text-rose-600'}`}>
              <Edit3 size={20} />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-wide">1. User Accounts & Verification</h2>
          </div>
          <div className={`space-y-3 text-xs sm:text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-650'}`}>
            <p>To use most features on SuviX, you must register for an account and provide accurate details. Specifically:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must maintain the security of your password and credentials.</li>
              <li>Connected YouTube profiles must belong to or be authorized by you.</li>
              <li>Unauthorized uploads, botting, or video manipulation is strictly prohibited.</li>
            </ul>
          </div>
        </motion.section>

        {/* Section 2: Intellectual Property */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-900 text-blue-500' : 'bg-blue-50 text-blue-600'}`}>
              <Award size={20} />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-wide">2. Content & Licensing Rights</h2>
          </div>
          <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-650'}`}>
            Video deliverables produced by editors on SuviX remain the property of the editor until full payment has been released by the creator. Once milestones are approved and payout is finalized, copyright transfer is completed automatically to the creator.
          </p>
        </motion.section>

        {/* Section 3: Liability */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-900 text-green-500' : 'bg-green-50 text-green-600'}`}>
              <ShieldAlert size={20} />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-wide">3. Limitation of Liability</h2>
          </div>
          <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-650'}`}>
            SuviX is not responsible for YouTube strikes, demonetization, or loss of analytics performance. Users are solely responsible for compliance with YouTube's guidelines and community policies when uploading video projects.
          </p>
        </motion.section>
      </div>
    </div>
  );
}
