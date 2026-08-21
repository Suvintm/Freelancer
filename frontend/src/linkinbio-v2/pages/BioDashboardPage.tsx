import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ReactLenis } from 'lenis/react';
import type { BioPageSummary } from '../types/page.types';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { AnalyticsTeaser } from '../components/dashboard/AnalyticsTeaser';
import { BioPageGrid } from '../components/dashboard/BioPageGrid';
import { EmptyBioState } from '../components/dashboard/EmptyBioState';
import { TriDeviceShowcase } from '../components/dashboard/TriDeviceShowcase';
import { BioQrCodeCard } from '../components/dashboard/BioQrCodeCard';
import { TemplatePickerModal } from '../components/templates/TemplatePickerModal';
import { bioApiService } from '../services/bioApiService';
import { ExternalLink, HelpCircle, Plus, Loader2 } from 'lucide-react';

interface BioDashboardPageProps {
  username?: string;
  onNavigateToEditor?: (pageId: string) => void;
  onOpenTemplatePicker?: () => void;
}

export const BioDashboardPage: React.FC<BioDashboardPageProps> = ({
  username: propUsername,
  onNavigateToEditor,
  onOpenTemplatePicker,
}) => {
  const navigate = useNavigate();
  const authUser = useSelector(selectUser);

  // Derive real logged-in creator profile from Redux session cache
  const username = authUser?.username || authUser?.name?.toLowerCase().replace(/\s+/g, '') || propUsername || 'creator';
  const displayName = authUser?.name || (authUser as any)?.profile?.display_name || username || 'SuviX Creator';
  const avatarUrl = authUser?.profilePicture || (authUser as any)?.profile_picture || (authUser as any)?.avatarUrl || (authUser as any)?.profile?.avatar_url || '';
  const userBio = (authUser as any)?.bio || (authUser as any)?.profile?.bio || 'Building digital products, sharing knowledge and exploring the world of tech.';

  const [pages, setPages] = useState<BioPageSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [overviewData, setOverviewData] = useState<{
    totalViews: number;
    totalClicks: number;
    averageCtr: number;
    viewsTrend: string;
    clicksTrend: string;
    topLink?: { title: string; clicks: number } | null;
  }>({
    totalViews: 0,
    totalClicks: 0,
    averageCtr: 0,
    viewsTrend: '+18% this week',
    clicksTrend: '+24% this week',
    topLink: null,
  });

  // Fetch real database pages and real analytics overview on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      bioApiService.getPages().catch(() => []),
      bioApiService.getAnalyticsOverview().catch(() => null),
    ]).then(([serverPages, overview]) => {
      if (!isMounted) return;

      if (Array.isArray(serverPages) && serverPages.length > 0) {
        setPages(serverPages.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          description: p.description || '',
          status: p.status,
          isActive: p.isPrimary ?? false,
          templateId: p.templateId || 'suvix-signature-olive',
          thumbnailUrl: '',
          draftBlocks: p.draftBlocks,
          draftTheme: p.draftTheme,
          publishedSnapshot: p.publishedSnapshot,
          viewCount: p.viewCount || 0,
          clickCount: p.clickCount || 0,
          ctr: p.viewCount ? +((p.clickCount / p.viewCount) * 100).toFixed(1) : 0,
          publishedAt: p.publishedAt,
          updatedAt: p.updatedAt,
        })));
      } else {
        setPages([]);
      }

      if (overview) {
        setOverviewData(overview);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute aggregate metrics (or fallback to real server overview)
  const totalViews = overviewData.totalViews || pages.reduce((acc, p) => acc + (p.viewCount || 0), 0);
  const totalClicks = overviewData.totalClicks || pages.reduce((acc, p) => acc + (p.clickCount || 0), 0);
  const averageCtr = overviewData.averageCtr || (pages.length > 0 ? +(totalClicks / (totalViews || 1) * 100).toFixed(1) : 0);

  const topLink = overviewData.topLink || (pages.length > 0 ? {
    title: 'YouTube Channel',
    clicks: totalClicks > 0 ? Math.round(totalClicks * 0.4) : 0,
  } : null);

  // Actions
  const handleSetActive = async (targetId: string) => {
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        isActive: page.id === targetId,
      }))
    );
    try {
      await bioApiService.setPrimaryPage(targetId);
    } catch (err) {
      console.warn('[BioDashboardPage] Set primary error:', err);
    }
  };

  const handleDuplicate = async (targetId: string) => {
    if (pages.length >= 4) return;
    const target = pages.find((p) => p.id === targetId);
    if (!target) return;

    try {
      const created = await bioApiService.createPage({
        templateId: target.templateId,
        title: `${target.title} (Copy)`,
        slug: `${target.slug}-copy`,
        description: target.description,
      });

      if (created) {
        setPages((prev) => [
          ...prev,
          {
            id: created.id,
            slug: created.slug,
            title: created.title,
            description: created.description || '',
            status: created.status,
            isActive: false,
            templateId: created.templateId || 'suvix-signature-olive',
            thumbnailUrl: '',
            viewCount: 0,
            clickCount: 0,
            ctr: 0,
            updatedAt: created.updatedAt,
          },
        ]);
      }
    } catch (err) {
      console.warn('[BioDashboardPage] Duplicate error:', err);
    }
  };

  const handleDelete = async (targetId: string) => {
    const isTargetActive = pages.find((p) => p.id === targetId)?.isActive;
    const remaining = pages.filter((p) => p.id !== targetId);

    if (isTargetActive && remaining.length > 0) {
      remaining[0].isActive = true;
    }

    setPages(remaining);

    try {
      await bioApiService.deletePage(targetId);
    } catch (err) {
      console.warn('[BioDashboardPage] Delete error:', err);
    }
  };

  const handleCreateNew = () => {
    setIsTemplatePickerOpen(true);
    onOpenTemplatePicker?.();
  };

  const handleEditPage = (pageId: string) => {
    if (onNavigateToEditor) {
      onNavigateToEditor(pageId);
    } else {
      navigate(`/link-in-bio/studio/${pageId}`);
    }
  };

  const handleTemplatePicked = async (templateId: string, title: string, slug: string) => {
    try {
      const newPage = await bioApiService.createPage({
        templateId,
        title,
        slug,
      });

      if (newPage) {
        setPages((prev) => [
          ...prev,
          {
            id: newPage.id,
            slug: newPage.slug,
            title: newPage.title,
            description: newPage.description || '',
            status: newPage.status,
            isActive: newPage.isPrimary ?? false,
            templateId,
            thumbnailUrl: '',
            viewCount: 0,
            clickCount: 0,
            ctr: 0,
            updatedAt: newPage.updatedAt,
          },
        ]);

        if (onNavigateToEditor) {
          onNavigateToEditor(newPage.id);
        } else {
          navigate(`/link-in-bio/studio/${newPage.id}`);
        }
      }
    } catch (err) {
      console.warn('[BioDashboardPage] Create from template error:', err);
    }
  };

  const activePage = pages.find((p) => p.isActive) || pages[0];
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
  const primaryPath = `/u/${username}${activePage && activePage.slug !== 'main' ? `/${activePage.slug}` : ''}`;
  const brandedUrl = `suvix.in${primaryPath}`;
  const liveHref = isLocalhost ? primaryPath : `https://${brandedUrl}`;

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-black text-slate-900 dark:text-zinc-100 font-sans px-4 sm:px-6 lg:px-8 pt-4 pb-2 transition-colors duration-200 overflow-hidden">
      
      {/* ── FIXED TOP HEADER ROW ── */}
      <div className="shrink-0 w-full mb-5">
        <div className="relative w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left Side: Create Page Button */}
          <div className="flex items-center justify-start sm:w-[220px]">
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all font-sans font-semibold text-xs shadow-xs active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Page</span>
            </button>
          </div>

          {/* Centered Heading */}
          <h1 
            style={{ fontFamily: '"Bubblegum Sans", cursive, sans-serif', fontWeight: 400 }}
            className="text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-wide text-center"
          >
            Link in Bio
          </h1>

          {/* Right Primary URL Capsule */}
          <div className="flex items-center justify-center sm:justify-end sm:w-[220px]">
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 shadow-xs">
              <div className="flex flex-col text-left sm:text-right">
                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                  Primary Link
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-zinc-200 font-mono truncate max-w-[140px]">
                  {brandedUrl}
                </span>
              </div>

              <a
                href={liveHref}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 transition-colors flex items-center justify-center shadow-xs cursor-pointer"
                title="Open Live Public Link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2-COLUMN SPLIT: Left Column (Lenis Smooth Scroll) + Right Column (Fixed Stationary) ── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch overflow-hidden">
        
        {/* Left Column (7 cols): Smooth Lenis Scroller */}
        <ReactLenis
          root={false}
          options={{ lerp: 0.1, duration: 1.1, smoothWheel: true }}
          className="xl:col-span-7 h-full overflow-y-auto no-scrollbar"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-6 pr-1 pb-16"
          >
            {/* Top Shareable Bio QR Code Card */}
            <BioQrCodeCard 
              username={username}
              name={displayName}
              avatarUrl={avatarUrl}
              slug={activePage?.slug || 'main'}
            />

            {isLoading ? (
              <div className="w-full py-12 flex items-center justify-center gap-2 text-slate-400 text-sm">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading your creator dashboard...</span>
              </div>
            ) : (
              <>
                <AnalyticsTeaser
                  totalViews={totalViews}
                  totalClicks={totalClicks}
                  averageCtr={averageCtr}
                  viewsTrend={overviewData.viewsTrend}
                  clicksTrend={overviewData.clicksTrend}
                  topLink={topLink}
                  onViewDetailedAnalytics={() => navigate('/link-in-bio/analytics')}
                />

                {pages.length === 0 ? (
                  <EmptyBioState onCreateClick={handleCreateNew} />
                ) : (
                  <BioPageGrid
                    pages={pages}
                    maxPages={4}
                    username={username}
                    onCreateNew={handleCreateNew}
                    onEdit={handleEditPage}
                    onSetActive={handleSetActive}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                )}
              </>
            )}

            {/* Footer Support Strip */}
            <div className="pt-6 border-t border-slate-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-zinc-500">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700 dark:text-zinc-400">Pro Tip:</span>
                <span>Your SuviX bio links update automatically in real-time with 0 downtime.</span>
              </div>

              <div className="flex items-center gap-4 text-slate-500 dark:text-zinc-400">
                <button className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Help & Documentation
                </button>
                <span>•</span>
                <span className="font-mono">v2.0</span>
              </div>
            </div>
          </motion.div>
        </ReactLenis>

        {/* Right Column (5 cols): 3D Tri-Device Showcase Hero with SuviX Signature Olive Center Phone */}
        <div className="xl:col-span-5 h-full flex flex-col items-center justify-center overflow-hidden p-0 sm:p-2 select-none">
          <TriDeviceShowcase 
            username={username}
            displayName={displayName}
            avatarUrl={avatarUrl}
            bio={userBio}
            primaryPage={activePage}
          />
        </div>

      </div>

      {/* Level 2: Template Picker & Creation Modal */}
      <TemplatePickerModal
        isOpen={isTemplatePickerOpen}
        username={username}
        onClose={() => setIsTemplatePickerOpen(false)}
        onCreatePage={handleTemplatePicked}
      />

    </div>
  );
};

export default BioDashboardPage;
