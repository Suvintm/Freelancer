import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Eye, Database, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export default function PrivacyPolicy() {
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
              Privacy Policy <Shield className="text-rose-500" size={28} />
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
          At SuviX, accessible from our web and mobile applications, the privacy of our visitors is one of our primary priorities. This Privacy Policy document outlines the types of information we collect, record, and how we use it.
        </p>

        {/* 1. Information We Collect */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-900 text-rose-500' : 'bg-rose-50 text-rose-600'}`}>
              <Database size={20} />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-wide">1. Information We Collect</h2>
          </div>
          <div className={`space-y-3 text-xs sm:text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            <p>We collect information you provide directly to us when setting up profiles, executing contracts, or connecting accounts:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Credentials:</strong> Name, email address, password, phone numbers, and profile details.</li>
              <li><strong>YouTube Integrations:</strong> If you connect your YouTube account, we fetch channel metadata, subscriber figures, views, and thumbnail assets via secure Google OAuth.</li>
              <li><strong>Transactions:</strong> Information regarding payment accounts and payouts to process editor deliverables.</li>
            </ul>
          </div>
        </motion.section>

        {/* 2. Google AdSense & Cookies */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-900 text-blue-500' : 'bg-blue-50 text-blue-600'}`}>
              <Eye size={20} />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-wide">2. Cookies and Third-Party Advertising</h2>
          </div>
          <div className={`space-y-3 text-xs sm:text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            <p>We use standard analytics tools and cookies to optimize user experience. Additionally:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Google DoubleClick DART Cookie:</strong> Google is one of the third-party vendors on our site. It uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet.</li>
              <li><strong>Our Advertising Partners:</strong> Third-party ad servers or ad networks use technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on SuviX, which are sent directly to users' browsers. They automatically receive your IP address when this occurs.</li>
            </ul>
            <p className="mt-2">
              You can choose to disable cookies through your individual browser options or manage personalized ad preferences via Google's Ad Settings page.
            </p>
          </div>
        </motion.section>

        {/* 3. Security */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-900 text-green-500' : 'bg-green-50 text-green-600'}`}>
              <Globe size={20} />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-wide">3. Contact Us</h2>
          </div>
          <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            If you have any questions or suggestions regarding our Privacy Policy, please contact our Compliance Officer at <span className="text-rose-500 font-semibold">privacy@suvix.app</span>.
          </p>
        </motion.section>
      </div>
    </div>
  );
}
