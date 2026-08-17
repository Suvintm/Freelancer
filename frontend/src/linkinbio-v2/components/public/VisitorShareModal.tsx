import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import officialLogo from '../../../assets/officiallogo.png';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  MessageCircle, 
  Twitter, 
  Linkedin, 
  Send
} from 'lucide-react';

interface VisitorShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageTitle: string;
  url: string;
}

export const VisitorShareModal: React.FC<VisitorShareModalProps> = ({
  isOpen,
  onClose,
  pageTitle,
  url,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  if (!isOpen) return null;

  const fullUrl = url.startsWith('http') ? url : `https://${url}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTo = (platform: 'whatsapp' | 'twitter' | 'linkedin' | 'telegram') => {
    const text = encodeURIComponent(`Check out ${pageTitle} on SuviX:`);
    const encodedUrl = encodeURIComponent(fullUrl);

    let shareLink = '';
    switch (platform) {
      case 'whatsapp':
        shareLink = `https://api.whatsapp.com/send?text=${text}%20${encodedUrl}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${encodedUrl}&text=${text}`;
        break;
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <AnimatePresence>
      <div 
        data-lenis-prevent="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden select-none font-sans"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-40"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', duration: 0.28 }}
          className="relative z-50 w-full max-w-sm rounded-2xl bg-white dark:bg-[#111114] border border-slate-200 dark:border-zinc-800 shadow-2xl p-5 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
                <Share2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Share this Page
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="py-4 space-y-4">
            
            {/* Quick URL Copy Bar */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <span className="flex-1 px-2 text-xs font-mono text-slate-600 dark:text-zinc-300 truncate">
                {url}
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Social Share Grid */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
                Share to Apps
              </span>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleShareTo('whatsapp')}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-zinc-800 hover:border-emerald-300 text-slate-700 dark:text-zinc-300 hover:text-emerald-600 flex flex-col items-center gap-1 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-semibold">WhatsApp</span>
                </button>

                <button
                  onClick={() => handleShareTo('twitter')}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-sky-50 dark:hover:bg-sky-950/30 border border-slate-200 dark:border-zinc-800 hover:border-sky-300 text-slate-700 dark:text-zinc-300 hover:text-sky-500 flex flex-col items-center gap-1 transition-all cursor-pointer"
                >
                  <Twitter className="w-4 h-4 text-sky-500" />
                  <span className="text-[10px] font-semibold">Twitter</span>
                </button>

                <button
                  onClick={() => handleShareTo('linkedin')}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200 dark:border-zinc-800 hover:border-blue-300 text-slate-700 dark:text-zinc-300 hover:text-blue-600 flex flex-col items-center gap-1 transition-all cursor-pointer"
                >
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  <span className="text-[10px] font-semibold">LinkedIn</span>
                </button>

                <button
                  onClick={() => handleShareTo('telegram')}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 hover:bg-sky-50 dark:hover:bg-sky-950/30 border border-slate-200 dark:border-zinc-800 hover:border-sky-300 text-slate-700 dark:text-zinc-300 hover:text-sky-400 flex flex-col items-center gap-1 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4 text-sky-400" />
                  <span className="text-[10px] font-semibold">Telegram</span>
                </button>
              </div>
            </div>

            {/* QR Code Toggle Section with Pure Vector SVG Pattern */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
              {showQrCode ? (
                <div className="flex flex-col items-center p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200 relative w-36 h-36 flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-full h-full text-black fill-current">
                      {/* 3 Corner Anchor Squares */}
                      <rect x="15" y="15" width="55" height="55" rx="8" fill="black" />
                      <rect x="23" y="23" width="39" height="39" rx="5" fill="white" />
                      <rect x="31" y="31" width="23" height="23" rx="3" fill="black" />

                      <rect x="130" y="15" width="55" height="55" rx="8" fill="black" />
                      <rect x="138" y="23" width="39" height="39" rx="5" fill="white" />
                      <rect x="146" y="31" width="23" height="23" rx="3" fill="black" />

                      <rect x="15" y="130" width="55" height="55" rx="8" fill="black" />
                      <rect x="23" y="138" width="39" height="39" rx="5" fill="white" />
                      <rect x="31" y="146" width="23" height="23" rx="3" fill="black" />

                      {/* Vector Data Dots */}
                      <circle cx="85" cy="25" r="4.5" />
                      <circle cx="102" cy="25" r="4.5" />
                      <circle cx="119" cy="25" r="4.5" />
                      <circle cx="85" cy="42" r="4.5" />
                      <circle cx="119" cy="42" r="4.5" />
                      <circle cx="95" cy="58" r="4.5" />
                      <circle cx="108" cy="58" r="4.5" />

                      <circle cx="25" cy="85" r="4.5" />
                      <circle cx="42" cy="85" r="4.5" />
                      <circle cx="58" cy="85" r="4.5" />
                      <circle cx="25" cy="102" r="4.5" />
                      <circle cx="58" cy="102" r="4.5" />
                      <circle cx="35" cy="119" r="4.5" />
                      <circle cx="50" cy="119" r="4.5" />

                      <circle cx="148" cy="75" r="4.5" />
                      <circle cx="165" cy="75" r="4.5" />
                      <circle cx="182" cy="75" r="4.5" />
                      <circle cx="148" cy="95" r="4.5" />
                      <circle cx="182" cy="95" r="4.5" />
                      <circle cx="148" cy="115" r="4.5" />
                      <circle cx="165" cy="115" r="4.5" />
                      <circle cx="182" cy="115" r="4.5" />

                      <circle cx="75" cy="148" r="4.5" />
                      <circle cx="95" cy="148" r="4.5" />
                      <circle cx="125" cy="148" r="4.5" />
                      <circle cx="165" cy="148" r="4.5" />
                      <circle cx="85" cy="165" r="4.5" />
                      <circle cx="105" cy="165" r="4.5" />
                      <circle cx="148" cy="165" r="4.5" />
                      <circle cx="182" cy="165" r="4.5" />
                      <circle cx="75" cy="182" r="4.5" />
                      <circle cx="115" cy="182" r="4.5" />
                      <circle cx="135" cy="182" r="4.5" />
                      <circle cx="165" cy="182" r="4.5" />

                      {/* Center Official Logo Badge */}
                      <circle cx="100" cy="100" r="22" fill="white" />
                      <image 
                        href={officialLogo} 
                        x="82" 
                        y="82" 
                        width="36" 
                        height="36" 
                        preserveAspectRatio="xMidYMid meet"
                      />
                    </svg>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 mt-2">
                    Scan with any phone camera
                  </span>
                  <button
                    onClick={() => setShowQrCode(false)}
                    className="text-[10.5px] font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 mt-1 cursor-pointer"
                  >
                    Hide QR Code
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowQrCode(true)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Show QR Code</span>
                </button>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
