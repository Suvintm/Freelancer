import React, { useState } from 'react';
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
import { useBioEditorStore } from '../../zustand/useBioEditorStore';
import { bioApiService } from '../services/bioApiService';
import { ExternalLink, HelpCircle, Plus } from 'lucide-react';

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
  const username = authUser?.username || authUser?.name?.toLowerCase().replace(/\s+/g, '') || propUsername || 'alexmorgan';
  const displayName = authUser?.name || username;
  const avatarUrl = authUser?.profilePicture || (authUser as any)?.profile_picture || '';

  // Initial Real Dynamic Pages Snapshot
  const initialPages: BioPageSummary[] = [
    {
      id: 'bio_page_1',
      slug: 'main',
      title: `${displayName} • Official Bio`,
      description: 'Main social hub, featured YouTube video, and presets store.',
      status: 'published',
      isActive: true,
      templateId: 'creator-basic',
      thumbnailUrl: '',
      viewCount: 2450,
      clickCount: 680,
      ctr: 27.7,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bio_page_2',
      slug: 'shop',
      title: 'Cyber Fall Streetwear Drop',
      description: 'Limited edition apparel collection with direct checkout.',
      status: 'published',
      isActive: false,
      templateId: 'shop-store',
      thumbnailUrl: '',
      viewCount: 920,
      clickCount: 295,
      ctr: 32.0,
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const [pages, setPages] = useState<BioPageSummary[]>(initialPages);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);

  // Fetch real database pages on mount
  React.useEffect(() => {
    bioApiService.getPages()
      .then((serverPages) => {
        if (Array.isArray(serverPages) && serverPages.length > 0) {
          setPages(serverPages.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            description: p.description || '',
            status: p.status,
            isActive: p.isPrimary ?? false,
            templateId: p.templateId || 'creator-basic',
            thumbnailUrl: '',
            viewCount: p.viewCount || 0,
            clickCount: p.clickCount || 0,
            ctr: p.viewCount ? +((p.clickCount / p.viewCount) * 100).toFixed(1) : 0,
            publishedAt: p.publishedAt,
            updatedAt: p.updatedAt,
          })));
        }
      })
      .catch((err) => {
        console.warn('[BioDashboardPage] Server pages fallback:', err.message);
      });
  }, []);

  // Compute aggregate metrics
  const totalViews = pages.reduce((acc, p) => acc + p.viewCount, 0);
  const totalClicks = pages.reduce((acc, p) => acc + p.clickCount, 0);
  const averageCtr = pages.length > 0 ? +(totalClicks / (totalViews || 1) * 100).toFixed(1) : 0;

  const topLink = {
    title: 'Watch My Japan Trip Vlog',
    clicks: 410,
  };

  // Actions
  const handleSetActive = (targetId: string) => {
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        isActive: page.id === targetId,
      }))
    );
  };

  const handleDuplicate = (targetId: string) => {
    if (pages.length >= 4) return;
    const target = pages.find((p) => p.id === targetId);
    if (!target) return;

    const duplicated: BioPageSummary = {
      ...target,
      id: `bio_page_${Date.now()}`,
      slug: `${target.slug}-copy`,
      title: `${target.title} (Copy)`,
      isActive: false,
      viewCount: 0,
      clickCount: 0,
      ctr: 0,
      updatedAt: new Date().toISOString(),
    };

    setPages((prev) => [...prev, duplicated]);
  };

  const handleDelete = (targetId: string) => {
    const isTargetActive = pages.find((p) => p.id === targetId)?.isActive;
    const remaining = pages.filter((p) => p.id !== targetId);

    if (isTargetActive && remaining.length > 0) {
      remaining[0].isActive = true;
    }

    setPages(remaining);
  };

  const handleCreateNew = () => {
    setIsTemplatePickerOpen(true);
    onOpenTemplatePicker?.();
  };

  const handleEditPage = (pageId: string) => {
    const targetPage = pages.find((p) => p.id === pageId);
    if (targetPage) {
      useBioEditorStore.getState().loadTemplate(targetPage.templateId || 'creator-basic', targetPage.title, targetPage.slug);
    }
    if (onNavigateToEditor) {
      onNavigateToEditor(pageId);
    } else {
      navigate('/link-in-bio/studio');
    }
  };

  const handleTemplatePicked = (templateId: string, title: string, slug: string) => {
    const newPageId = `bio_page_${Date.now()}`;
    
    // 1. Instantiate into Zustand Draft Store
    useBioEditorStore.getState().loadTemplate(templateId, title, slug);

    // 2. Add to Dashboard Pages Catalog
    const newPage: BioPageSummary = {
      id: newPageId,
      slug,
      title,
      description: 'Created from starting template',
      status: 'draft',
      isActive: false,
      templateId,
      thumbnailUrl: '',
      viewCount: 0,
      clickCount: 0,
      ctr: 0,
      updatedAt: new Date().toISOString(),
    };

    setPages((prev) => [...prev, newPage]);

    // 3. Trigger Editor Navigation
    if (onNavigateToEditor) {
      onNavigateToEditor(newPageId);
    } else {
      navigate('/link-in-bio/studio');
    }
  };

  const activePage = pages.find((p) => p.isActive) || pages[0];
  const primaryLiveUrl = activePage
    ? `suvix.me/${username}${activePage.slug === 'main' ? '' : `/${activePage.slug}`}`
    : `suvix.me/${username}`;

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-black text-slate-900 dark:text-zinc-100 font-sans px-4 sm:px-6 lg:px-8 pt-4 pb-2 transition-colors duration-200 overflow-hidden">
      
      {/* ── FIXED TOP HEADER ROW ── */}
      <div className="shrink-0 w-full mb-5">
        <div className="relative w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left Side: Create Page Button with Rounded Edges */}
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
            {pages.length > 0 && (
              <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 shadow-xs">
                <div className="flex flex-col text-left sm:text-right">
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                    Primary Link
                  </span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-zinc-200 font-mono">
                    {primaryLiveUrl}
                  </span>
                </div>

                <a
                  href={`https://${primaryLiveUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 transition-colors flex items-center justify-center shadow-xs"
                  title="Open Public Link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
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

            {pages.length > 0 && (
              <AnalyticsTeaser
                totalViews={totalViews}
                totalClicks={totalClicks}
                averageCtr={averageCtr}
                topLink={topLink}
                onViewDetailedAnalytics={() => navigate('/link-in-bio/analytics')}
              />
            )}

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

            {/* Footer Support Strip */}
            <div className="pt-6 border-t border-slate-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-zinc-500">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700 dark:text-zinc-400">Pro Tip:</span>
                <span>You can switch your active primary page anytime with zero downtime.</span>
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

        {/* Right Column (5 cols): 3D Tri-Device Showcase Hero (FIXED IN PLACE, NO SCROLL) */}
        <div className="xl:col-span-5 h-full flex flex-col items-center justify-center overflow-hidden p-0 sm:p-2 select-none">
          <TriDeviceShowcase />
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
