import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Smartphone, 
  Zap, 
  Globe, 
  Download 
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

  const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
  const localUrl = `/u/${username}${slug === 'main' ? '' : `/${slug}`}`;
  const brandedUrl = `suvix.in/u/${username}${slug === 'main' ? '' : `/${slug}`}`;
  const shareableUrl = isLocalhost 
    ? `${window.location.origin}${localUrl}` 
    : `https://${brandedUrl}`;

  const displayAvatar = avatarUrl || officialLogo || defaultProfile;

  // Auto-fetch real server SVG or generate in background if not cached yet
  useEffect(() => {
    bioApiService.getQrStatus()
      .then((status) => {
        if (status?.qrSvg) {
          setQrSvgData(status.qrSvg);
        } else {
          // Auto-generate in background without blocking UI
          bioApiService.generateQr({ slug })
            .then((res) => {
              if (res?.qrSvg) {
                setQrSvgData(res.qrSvg);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
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
  };

  return (
    <div className="w-full bg-white dark:bg-[#111114] p-3 sm:p-4 rounded-2xl font-sans transition-all duration-200 shadow-xs border border-slate-200/80 dark:border-zinc-800/80">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        
        {/* ── LEFT SUB-COLUMN (4.5 cols): Always-Active Vector QR Showcase ── */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[185px] rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 p-3 flex flex-col items-center shadow-xs">
            
            {/* User Profile Header with circular avatar */}
            <div className="w-full flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-zinc-700 bg-white dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                  <img 
                    src={displayAvatar} 
                    alt={name} 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                    {name}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono truncate">
                    @{username}
                  </span>
                </div>
              </div>

              <span 
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" 
                title="Live Active QR" 
              />
            </div>

            {/* Always-Ready Vector QR Canvas */}
            <div className="w-full aspect-square bg-white rounded-xl p-2.5 flex items-center justify-center shadow-xs relative group overflow-hidden">
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

                  {/* Center Official Logo Shield */}
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
              )}
            </div>

            {/* ── CARD BOTTOM ACTIONS: Always-Unlocked Share / Copy / Download Suite ── */}
            <div className="w-full mt-2 pt-2 border-t border-slate-200/60 dark:border-zinc-800/80 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 w-full">
                <button
                  onClick={handleShare}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-xs"
                  title="Share link"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Share</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-medium border border-slate-200 dark:border-zinc-700 transition-all cursor-pointer"
                  title="Copy link"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadQr}
                  className="p-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400 transition-colors flex items-center justify-center border border-slate-200 dark:border-zinc-700 cursor-pointer"
                  title="Download Vector QR"
                >
                  <Download className="w-3 h-3" />
                </button>

                <a
                  href={shareableUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400 transition-colors flex items-center justify-center border border-slate-200 dark:border-zinc-700 cursor-pointer"
                  title="Open Live Public Link"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* ── RIGHT SUB-COLUMN (7 cols): Information & Feature Highlights ── */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-2.5">
          
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] font-semibold tracking-wide border border-slate-200 dark:border-zinc-700">
                <Sparkles className="w-3 h-3 text-sky-500" />
                <span>Instant QR Sharing</span>
              </div>
            </div>

            <h2 
              style={{ fontFamily: '"Bubblegum Sans", cursive, sans-serif', fontWeight: 400 }}
              className="text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-wide leading-tight"
            >
              Your Personalized Bio QR Code
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mt-0.5">
              Connect your in-person audience to your digital world in a single scan. Place it on product packaging, event banners, business cards, or livestream overlays.
            </p>
          </div>

          {/* Feature Highlight Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                Universal Mobile Support
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                Auto-Synced to Live Bio
              </span>
            </div>
          </div>

          {/* Current URL Tag */}
          <div className="pt-0.5 text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 font-mono">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>Redirects to:</span>
            <span className="font-semibold text-slate-800 dark:text-zinc-200">
              https://{brandedUrl}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default BioQrCodeCard;
