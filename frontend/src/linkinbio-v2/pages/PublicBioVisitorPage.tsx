import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { bioApiService } from '../services/bioApiService';
import { STARTER_TEMPLATES } from '../registry/templateRegistry';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import { VisitorShareModal } from '../components/public/VisitorShareModal';
import type { BioPage } from '../types/page.types';
import type { Theme } from '../types/theme.types';
import officialLogo from '../../assets/officiallogo.png';
import { 
  Share2, 
  Sparkles, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

export const PublicBioVisitorPage: React.FC = () => {
  const { username = 'alexmorgan', slug } = useParams<{ username: string; slug?: string }>();
  
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [publicData, setPublicData] = useState<{
    pageId: string;
    creator: {
      username: string;
      name: string;
      avatarUrl?: string;
      bio?: string;
      isVerified?: boolean;
    };
    page: Partial<BioPage>;
  } | null>(null);

  // Fallback template for offline / mock testing
  const fallbackTemplate = STARTER_TEMPLATES[0];

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    bioApiService.getPublicProfile(username, slug)
      .then((data) => {
        if (isMounted && data) {
          setPublicData(data);
          // Fire non-blocking view tracking impression
          if (data.pageId) {
            bioApiService.trackView(data.pageId);
          }
        }
      })
      .catch((err) => {
        console.warn('[PublicBioVisitorPage] Using local fallback profile:', err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [username, slug]);

  const blocks = (publicData?.page?.blocks || fallbackTemplate.defaultBlocks || []).filter(
    (b: any) => b.isVisible !== false
  );
  const theme: Theme = (publicData?.page?.theme as Theme) || fallbackTemplate.defaultTheme;

  // Background styling computation
  const getThemeBackgroundStyle = (themeObj: Theme): React.CSSProperties => {
    const bg = themeObj?.background;
    if (!bg) return { backgroundColor: '#09090b' };

    switch (bg.type) {
      case 'solid':
        return { backgroundColor: bg.value || '#09090b' };
      case 'gradient':
        return { backgroundImage: bg.value || 'linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #000000 100%)' };
      case 'image':
        return {
          backgroundImage: `url(${bg.value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        };
      default:
        return { backgroundColor: '#09090b' };
    }
  };

  const backgroundStyle = getThemeBackgroundStyle(theme);
  const currentPublicUrl = `suvix.me/${username}${slug && slug !== 'main' ? `/${slug}` : ''}`;
  const creatorName = publicData?.creator?.name || username;

  return (
    <div 
      style={backgroundStyle}
      className="min-h-screen w-full flex flex-col items-center justify-between text-slate-900 dark:text-zinc-100 font-sans selection:bg-sky-500 selection:text-white relative overflow-x-hidden"
    >
      {/* ── TOP FLOATING VISITOR ACTION BAR ── */}
      <header className="w-full max-w-md mx-auto px-4 pt-4 pb-2 flex items-center justify-between z-20 shrink-0">
        {/* Creator Brand Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xs">
          <img 
            src={publicData?.creator?.avatarUrl || officialLogo} 
            alt={creatorName} 
            className="w-4 h-4 rounded-full object-cover" 
          />
          <span className="text-[11px] font-bold tracking-tight text-slate-900 dark:text-white">
            @{username}
          </span>
          <CheckCircle2 className="w-3 h-3 text-sky-500" />
        </div>

        {/* Share Button */}
        <button
          onClick={() => setIsShareOpen(true)}
          className="p-2 rounded-full bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 text-slate-900 dark:text-white hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
          title="Share Page"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </header>

      {/* ── CENTER FEED: RENDERED BLOCKS STREAM ── */}
      <main className="w-full max-w-md mx-auto px-4 py-4 space-y-3.5 z-10 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
          </div>
        ) : (
          blocks.map((block: any, idx: number) => (
            <motion.div
              key={block.id || idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04, ease: 'easeOut' }}
            >
              <BlockRenderer 
                block={block}
                theme={theme}
              />
            </motion.div>
          ))
        )}
      </main>

      {/* ── BOTTOM FLOATING BRANDING PILL ── */}
      <footer className="w-full max-w-md mx-auto px-4 py-6 flex flex-col items-center justify-center z-20 shrink-0">
        <Link
          to="/link-in-bio"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/30 dark:bg-black/40 backdrop-blur-md border border-white/30 dark:border-white/15 text-[11px] font-semibold text-slate-800 dark:text-zinc-200 hover:text-slate-950 dark:hover:text-white transition-all shadow-xs hover:scale-105"
        >
          <img 
            src={officialLogo} 
            alt="SuviX" 
            className="w-3.5 h-3.5 rounded-full" 
          />
          <span>Created with <strong>SuviX Bio</strong></span>
          <Sparkles className="w-3 h-3 text-amber-500" />
        </Link>
      </footer>

      {/* Share Modal */}
      <VisitorShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        pageTitle={publicData?.page?.title || 'Creator Bio'}
        url={currentPublicUrl}
      />

    </div>
  );
};

export default PublicBioVisitorPage;
