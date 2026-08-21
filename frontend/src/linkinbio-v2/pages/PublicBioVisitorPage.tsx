import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { bioApiService } from '../services/bioApiService';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import { VisitorShareModal } from '../components/public/VisitorShareModal';
import { resolveBackgroundStyle } from '../utils/themeResolver';
import whiteBgLogo from '../../assets/whitebglogo.png';
import officialLogo from '../../assets/officiallogo.png';
import { 
  Share2, 
  Loader2, 
  AlertCircle
} from 'lucide-react';

export const PublicBioVisitorPage: React.FC = () => {
  const { username, slug } = useParams<{ username: string; slug?: string }>();
  
  const [publicData, setPublicData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Access Protection state (PIN / Age Gate)
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (!username) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    bioApiService.getPublicProfile(username, slug)
      .then((data) => {
        if (isMounted) {
          setPublicData(data);
          // Dynamically set page document title
          const title = data?.page?.title || `${username} • SuviX`;
          document.title = title;
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('[PublicBioVisitorPage] Fetch error:', err);
          setError(err?.response?.data?.message || 'Bio profile not found or unavailable');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [username, slug]);

  const page = publicData?.page;
  const blocks = page?.blocks || [];
  const theme = page?.theme;
  const protection = page?.settings?.advanced?.protection;
  const isPinProtected = protection?.type === 'pin' && Boolean(protection?.pinCode);
  const isAgeProtected = protection?.type === 'age';
  const requiresGate = (isPinProtected || isAgeProtected) && !isUnlocked;

  const handleVerifyPin = () => {
    if (pinInput.trim() === protection?.pinCode?.trim()) {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Single canonical background resolver with graceful fallback
  const resolvedBg = resolveBackgroundStyle(theme);
  const currentPublicUrl = `suvix.in/u/${username}${slug && slug !== 'main' ? `/${slug}` : ''}`;

  if (error) {
    return (
      <div 
        style={resolvedBg.containerStyle}
        className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-white font-sans selection:bg-white selection:text-slate-900 relative"
      >
        {resolvedBg.isImage && (
          <div 
            style={resolvedBg.bgImageLayerStyle}
            className="fixed inset-0 z-0 pointer-events-none"
          />
        )}
        {resolvedBg.overlayStyle.opacity ? (
          <div 
            style={resolvedBg.overlayStyle}
            className="fixed inset-0 z-0 pointer-events-none"
          />
        ) : null}
        <div className="w-full max-w-md p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/20 text-center flex flex-col items-center shadow-2xl relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4 text-amber-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black tracking-tight mb-1">Page Not Found</h2>
          <p className="text-sm text-white/80 mb-6 leading-relaxed">
            The requested bio page for <strong className="text-white">@{username}</strong> is either private, unpublished, or does not exist.
          </p>
          <Link
            to="/"
            className="w-full py-3 rounded-2xl bg-white text-slate-900 font-bold text-xs shadow-md hover:bg-slate-100 transition-all text-center no-underline"
          >
            Go to SuviX Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={resolvedBg.containerStyle}
      className="min-h-screen w-full flex flex-col items-center justify-between text-white font-sans selection:bg-white selection:text-slate-900 relative overflow-x-hidden"
    >
      {/* Background Wallpaper Image Layer with Blur */}
      {resolvedBg.isImage && (
        <div 
          style={resolvedBg.bgImageLayerStyle}
          className="fixed inset-0 z-0 pointer-events-none"
        />
      )}

      {/* Background Overlay Tint Layer */}
      {resolvedBg.overlayStyle.opacity ? (
        <div 
          style={resolvedBg.overlayStyle}
          className="fixed inset-0 z-0 pointer-events-none"
        />
      ) : null}

      {/* ── TOP HEADER: SuviX White BG Logo Image + "Join SuviX →" (Spacious Desktop Container) ── */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between z-20 shrink-0 relative">
        <Link 
          to="/" 
          className="flex items-center hover:opacity-85 transition-opacity"
        >
          <img 
            src={whiteBgLogo} 
            alt="SuviX" 
            className="h-7 sm:h-8 w-auto object-contain" 
          />
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsShareOpen(true)}
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white transition-all shadow-xs cursor-pointer border border-white/10"
            title="Share Page"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <Link
            to="/register"
            className="px-4 py-2 rounded-full bg-white text-slate-900 font-bold text-xs shadow-sm hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-1.5 no-underline"
          >
            <span>Join SuviX</span>
            <span className="text-sm font-bold">→</span>
          </Link>
        </div>
      </header>

      {/* ── CENTER FEED: DESKTOP ELEVATED GLASS CONTAINER / MOBILE RESPONSIVE STREAM ── */}
      <main className="w-full max-w-lg md:max-w-xl lg:max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 z-10 flex-1 flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <span className="text-xs font-semibold text-white/80">Loading bio profile...</span>
          </div>
        ) : requiresGate ? (
          /* ── PIN CODE / AGE GATE UNLOCK MODAL ── */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm p-6 sm:p-8 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/20 text-center flex flex-col items-center shadow-2xl text-white"
          >
            {isAgeProtected ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3 text-lg font-black border border-rose-500/30">
                  18+
                </div>
                <h3 className="text-lg font-black mb-1">Age Verification</h3>
                <p className="text-xs text-white/80 mb-5 leading-relaxed">
                  {protection?.warningMessage || 'This creator page contains content intended for audiences aged 18 and older.'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsUnlocked(true)}
                  className="w-full py-2.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs shadow-md hover:bg-slate-100 transition-all cursor-pointer"
                >
                  I am 18 or older • Continue
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-3 border border-white/20">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-lg font-black mb-1">Protected Bio Page</h3>
                <p className="text-xs text-white/80 mb-4 leading-relaxed">
                  {protection?.warningMessage || 'Enter the 4-digit passcode provided by the creator to view this profile.'}
                </p>

                <div className="w-full mb-3">
                  <input
                    type="password"
                    maxLength={10}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleVerifyPin();
                    }}
                    placeholder="Enter Passcode"
                    className="w-full py-2.5 px-3 rounded-xl bg-white/10 border border-white/20 text-center text-sm font-bold tracking-widest text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  {pinError && (
                    <span className="text-[11px] font-semibold text-rose-400 mt-1 block">
                      Incorrect passcode. Please try again.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleVerifyPin}
                  className="w-full py-2.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs shadow-md hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Unlock Profile
                </button>
              </>
            )}
          </motion.div>
        ) : (
          <div className="w-full rounded-3xl md:bg-black/15 md:backdrop-blur-xl md:border md:border-white/15 md:p-8 md:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] flex flex-col items-center space-y-2.5 transition-all">
            {blocks.map((block: any, idx: number) => (
              <motion.div
                key={block.id || idx}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05, ease: 'easeOut' }}
                className="w-full"
              >
                <BlockRenderer 
                  block={block}
                  theme={theme}
                  pageId={publicData?.pageId}
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* ── BOTTOM FOOTER: Created with SuviX ── */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col items-center justify-center z-20 shrink-0 text-center">
        <Link
          to="/link-in-bio"
          className="flex flex-col items-center group transition-all no-underline"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <img 
              src={officialLogo} 
              alt="SuviX" 
              className="w-4 h-4 object-contain brightness-0 invert" 
            />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">
            Created with SuviX
          </span>
          <span className="text-[10px] text-white/70 tracking-tight">
            Connect. Collaborate. Grow.
          </span>
        </Link>
      </footer>

      {/* Share Modal */}
      <VisitorShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        pageTitle={publicData?.page?.title || `${username} • SuviX Bio`}
        url={currentPublicUrl}
      />

    </div>
  );
};

export default PublicBioVisitorPage;
