import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Smartphone, 
  Zap, 
  Globe, 
  Download,
  Scan,
  CheckCircle2,
  MoreVertical,
  QrCode,
  ChevronRight
} from 'lucide-react';
import defaultProfile from '../../../assets/defaultprofile.png';
import officialLogo from '../../../assets/officiallogo.png';
import { bioApiService } from '../../services/bioApiService';

interface BioQrCodeCardProps {
  username?: string;
  name?: string;
  avatarUrl?: string;
  slug?: string;
}

export const BioQrCodeCard: React.FC<BioQrCodeCardProps> = ({
  username = 'suvix',
  name = 'SuviX Official',
  avatarUrl,
  slug = 'main',
}) => {
  const [copied, setCopied] = useState(false);
  const [qrSvgData, setQrSvgData] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(true);

  const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
  const localUrl = `/u/${username}${slug === 'main' ? '' : `/${slug}`}`;
  const brandedUrl = `suvix.in/u/${username}${slug === 'main' ? '' : `/${slug}`}`;
  const shareableUrl = isLocalhost 
    ? `${window.location.origin}${localUrl}` 
    : `https://${brandedUrl}`;

  const displayAvatar = avatarUrl || officialLogo || defaultProfile;

  // Auto-fetch real server SVG or generate in background if not cached yet
  useEffect(() => {
    setIsLoadingQr(true);
    bioApiService.getQrStatus()
      .then((status) => {
        if (status?.qrSvg) {
          setQrSvgData(status.qrSvg);
          setTimeout(() => setIsLoadingQr(false), 1400);
        } else {
          // Auto-generate in background without blocking UI
          bioApiService.generateQr({ slug })
            .then((res) => {
              if (res?.qrSvg) {
                setQrSvgData(res.qrSvg);
              }
              setTimeout(() => setIsLoadingQr(false), 1400);
            })
            .catch(() => {
              setIsLoadingQr(false);
            });
        }
      })
      .catch(() => {
        setTimeout(() => setIsLoadingQr(false), 1500);
      });
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name} • Link in Bio`,
          text: `Check out my link-in-bio page!`,
          url: shareableUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQr = () => {
    try {
      // Create high-resolution 1024x1024 canvas for crisp print & digital sharing
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw pure white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1024, 1024);

      // 2. Get active QR SVG string
      const svgEl = document.querySelector('#suvix-bio-qr-svg-container svg') || document.getElementById('suvix-bio-qr-svg');
      const svgString = svgEl ? svgEl.outerHTML : (qrSvgData || '');

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URLObj = window.URL || window.webkitURL || window;
      const blobUrl = URLObj.createObjectURL(svgBlob);

      const qrImg = new Image();
      qrImg.onload = () => {
        // Draw QR Code
        ctx.drawImage(qrImg, 40, 40, 944, 944);
        URLObj.revokeObjectURL(blobUrl);

        // 3. Draw Center Circular White Shield (WhatsApp / Instagram style)
        const centerX = 512;
        const centerY = 512;
        const shieldRadius = 115;

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, shieldRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.restore();

        // 4. Draw Center Official Brand Logo inside the Shield
        const logoImg = new Image();
        logoImg.onload = () => {
          const logoSize = shieldRadius * 1.75;
          ctx.drawImage(
            logoImg,
            centerX - logoSize / 2,
            centerY - logoSize / 2,
            logoSize,
            logoSize
          );

          // Trigger download
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `${username}_suvix_bio_qr.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        };
        logoImg.src = officialLogo;
      };
      qrImg.src = blobUrl;
    } catch {
      // Fallback SVG download
      const svgBlob = new Blob([
        qrSvgData || document.getElementById('suvix-bio-qr-svg')?.outerHTML || ''
      ], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = `${username}_bio_qr.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobUrl);
    }
  };

  return (
    <div className="relative overflow-hidden w-full bg-transparent p-2 sm:p-3 rounded-2xl font-sans transition-all duration-200">
      
      {/* Background High-Opacity Organic Glow Blob */}
      <div 
        className="absolute -left-10 -top-10 w-80 h-80 rounded-full pointer-events-none blur-3xl opacity-85 dark:opacity-45 transition-opacity"
        style={{
          background: 'radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.48) 0%, rgba(52, 211, 153, 0.35) 45%, rgba(16, 185, 129, 0.15) 70%, transparent 85%)'
        }}
      />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        
        {/* ── LEFT SUB-COLUMN (5 cols): Modern Framed QR Showcase Card ── */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[215px] rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-3.5 flex flex-col items-center shadow-xs">
            
            {/* User Profile Header */}
            <div className="w-full flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-emerald-500/20 p-0.5 bg-white dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                  <img 
                    src={displayAvatar} 
                    alt={name} 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {name}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white shrink-0" />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate">
                    @{username}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[9px] font-semibold border border-emerald-200/60 dark:border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
                <button 
                  className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
                  title="Options"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Framed QR Box with 4 Animated Glowing Emerald Scanner Brackets */}
            <div className="relative w-full aspect-square bg-white rounded-xl p-3 flex items-center justify-center my-1.5 border border-slate-100 dark:border-zinc-800/60 shadow-2xs">
              
              {/* 4 Green Corner Scanner Frame Brackets with Simultaneous Pulse and Green Glow */}
              <motion.div 
                animate={{
                  opacity: [0.75, 1, 0.75],
                  scale: [1, 1.06, 1],
                  filter: [
                    'drop-shadow(0 0 2px rgba(16, 185, 129, 0.4))',
                    'drop-shadow(0 0 8px rgba(16, 185, 129, 0.95))',
                    'drop-shadow(0 0 2px rgba(16, 185, 129, 0.4))'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute top-1 left-1 w-4 h-4 border-t-[2.5px] border-l-[2.5px] border-emerald-500 rounded-tl-md pointer-events-none z-10" 
              />

              <motion.div 
                animate={{
                  opacity: [0.75, 1, 0.75],
                  scale: [1, 1.06, 1],
                  filter: [
                    'drop-shadow(0 0 2px rgba(16, 185, 129, 0.4))',
                    'drop-shadow(0 0 8px rgba(16, 185, 129, 0.95))',
                    'drop-shadow(0 0 2px rgba(16, 185, 129, 0.4))'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute top-1 right-1 w-4 h-4 border-t-[2.5px] border-r-[2.5px] border-emerald-500 rounded-tr-md pointer-events-none z-10" 
              />

              <motion.div 
                animate={{
                  opacity: [0.75, 1, 0.75],
                  scale: [1, 1.06, 1],
                  filter: [
                    'drop-shadow(0 0 2px rgba(16, 185, 129, 0.4))',
                    'drop-shadow(0 0 8px rgba(16, 185, 129, 0.95))',
                    'drop-shadow(0 0 2px rgba(16, 185, 129, 0.4))'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute bottom-1 left-1 w-4 h-4 border-b-[2.5px] border-l-[2.5px] border-emerald-500 rounded-bl-md pointer-events-none z-10" 
              />

              <motion.div 
                animate={{
                  opacity: [0.75, 1, 0.75],
                  scale: [1, 1.06, 1],
                  filter: [
                    'drop-shadow(0 0 2px rgba(16, 185, 129, 0.4))',
                    'drop-shadow(0 0 8px rgba(16, 185, 129, 0.95))',
                    'drop-shadow(0 0 2px rgba(16, 185, 129, 0.4))'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute bottom-1 right-1 w-4 h-4 border-b-[2.5px] border-r-[2.5px] border-emerald-500 rounded-br-md pointer-events-none z-10" 
              />

              {/* QR Code Matrix Area with WhatsApp/Instagram style Center Shield */}
              <div className="relative w-full h-full flex items-center justify-center">
                {qrSvgData ? (
                  <div 
                    id="suvix-bio-qr-svg-container"
                    className="w-full h-full flex items-center justify-center relative [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: qrSvgData }}
                  />
                ) : (
                  <svg 
                    id="suvix-bio-qr-svg"
                    viewBox="0 0 200 200" 
                    className="w-full h-full text-black fill-current"
                  >
                    {/* Top-Left Corner */}
                    <rect x="16" y="16" width="48" height="48" rx="8" fill="black" />
                    <rect x="24" y="24" width="32" height="32" rx="4" fill="white" />
                    <rect x="32" y="32" width="16" height="16" rx="2" fill="black" />

                    {/* Top-Right Corner */}
                    <rect x="136" y="16" width="48" height="48" rx="8" fill="black" />
                    <rect x="144" y="24" width="32" height="32" rx="4" fill="white" />
                    <rect x="152" y="32" width="16" height="16" rx="2" fill="black" />

                    {/* Bottom-Left Corner */}
                    <rect x="16" y="136" width="48" height="48" rx="8" fill="black" />
                    <rect x="24" y="144" width="32" height="32" rx="4" fill="white" />
                    <rect x="32" y="152" width="16" height="16" rx="2" fill="black" />

                    {/* Modern Smooth Data Matrix Dots */}
                    <circle cx="85" cy="24" r="4.5" />
                    <circle cx="105" cy="24" r="4.5" />
                    <circle cx="115" cy="38" r="4.5" />
                    <circle cx="90" cy="52" r="4.5" />
                    <circle cx="75" cy="75" r="4.5" />
                    <circle cx="95" cy="75" r="4.5" />
                    <circle cx="125" cy="75" r="4.5" />
                    <circle cx="145" cy="75" r="4.5" />
                    <circle cx="165" cy="75" r="4.5" />
                    <circle cx="35" cy="95" r="4.5" />
                    <circle cx="55" cy="95" r="4.5" />
                    <circle cx="145" cy="95" r="4.5" />
                    <circle cx="165" cy="95" r="4.5" />
                    <circle cx="35" cy="115" r="4.5" />
                    <circle cx="55" cy="115" r="4.5" />
                    <circle cx="145" cy="115" r="4.5" />
                    <circle cx="165" cy="115" r="4.5" />
                    <circle cx="75" cy="130" r="4.5" />
                    <circle cx="105" cy="130" r="4.5" />
                    <circle cx="125" cy="130" r="4.5" />
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
                  </svg>
                )}

                {/* Center Official Brand Logo Shield (WhatsApp / Instagram style) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="w-10 h-10 rounded-full bg-white ring-4 ring-white shadow-md flex items-center justify-center overflow-hidden p-0.5">
                    <img 
                      src={officialLogo} 
                      alt="SuviX Official" 
                      className="w-full h-full object-contain rounded-full" 
                    />
                  </div>
                </div>

                {/* Up and Down Scanning Laser Line Animation when QR is Loading */}
                {isLoadingQr && (
                  <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-lg">
                    {/* Glowing Emerald Scanning Laser Bar */}
                    <motion.div
                      animate={{
                        top: ['0%', '94%', '0%'],
                      }}
                      transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="absolute left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_12px_3px_rgba(16,185,129,0.9)] z-30"
                    >
                      {/* Laser Beam Soft Gradient Trail */}
                      <div className="w-full h-7 -mt-3.5 bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent pointer-events-none" />
                    </motion.div>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Status Text with Scanning animation during Loading */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium mt-1">
              {isLoadingQr ? (
                <motion.div 
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"
                >
                  <Scan className="w-3 h-3 text-emerald-500 animate-spin" />
                  <span>Scanning...</span>
                </motion.div>
              ) : (
                <div className="flex items-center gap-1 text-slate-400 dark:text-zinc-500">
                  <Scan className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Scan to view your bio page</span>
                </div>
              )}
            </div>

          </div>

          {/* ── Action Buttons Suite below the Square QR Card ── */}
          <div className="w-full max-w-[215px] flex items-center gap-1.5 mt-3">
            <button
              onClick={handleShare}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Share Link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-semibold border border-slate-200 dark:border-zinc-700 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Copy Link"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadQr}
              className="p-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Download Vector QR"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <a
              href={shareableUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              title="Open Live Public Link"
            >
              <QrCode className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* ── RIGHT SUB-COLUMN (7 cols): Information & Feature Highlights ── */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-2">
          
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200/80 dark:border-emerald-800/50">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
              <span>Instant QR Sharing</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mt-1.5">
              Your Personalized <span className="text-emerald-500">Bio</span> QR Code
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mt-1">
              Connect your in-person audience to your digital world in a single scan. Place it on product packaging, event banners, business cards, or livestream overlays.
            </p>
          </div>

          {/* Feature Highlight Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="px-3 py-2 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-sky-500 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                Universal Mobile Support
              </span>
            </div>

            <div className="px-3 py-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                Auto-Synced to Live Bio
              </span>
            </div>
          </div>

          {/* Redirects To Row */}
          <div className="pt-1 text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 font-sans">
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Redirects to:</span>
            <span className="font-bold text-slate-900 dark:text-zinc-100 font-mono">
              https://{brandedUrl}
            </span>
          </div>

          {/* Bottom Promotional Banner Card */}
          <div className="mt-2 p-2.5 sm:p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  One Scan. Endless Opportunities.
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight truncate">
                  Let people discover everything you create with SuviX.
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>

        </div>

      </div>
    </div>
  );
};

export default BioQrCodeCard;
