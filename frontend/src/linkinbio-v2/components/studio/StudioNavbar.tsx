import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../store/slices/authSlice';
import { useBioEditorStore } from '../../../zustand/useBioEditorStore';
import { UnsavedChangesModal } from './UnsavedChangesModal';
import { PublishSuccessModal } from './PublishSuccessModal';
import { 
  ArrowLeft, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Undo2, 
  Redo2, 
  Eye, 
  Check, 
  Copy, 
  Globe, 
  Pencil, 
  CheckCircle2, 
  Save,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface StudioNavbarProps {
  onPublish?: () => void;
}

export const StudioNavbar: React.FC<StudioNavbarProps> = ({
  onPublish,
}) => {
  const navigate = useNavigate();
  const authUser = useSelector(selectUser);
  const username = authUser?.username || authUser?.name?.toLowerCase().replace(/\s+/g, '') || 'suvintm';
  
  const page = useBioEditorStore((s) => s.page);
  const previewDevice = useBioEditorStore((s) => s.previewDevice);
  const isPreviewMode = useBioEditorStore((s) => s.isPreviewMode);
  const isSaving = useBioEditorStore((s) => s.isSaving);
  const hasUnsavedChanges = useBioEditorStore((s) => s.hasUnsavedChanges);
  
  const setPreviewDevice = useBioEditorStore((s) => s.setPreviewDevice);
  const setIsPreviewMode = useBioEditorStore((s) => s.setIsPreviewMode);
  const updatePageMeta = useBioEditorStore((s) => s.updatePageMeta);
  const undo = useBioEditorStore((s) => s.undo);
  const redo = useBioEditorStore((s) => s.redo);
  const saveToCloud = useBioEditorStore((s) => s.saveToCloud);
  const publishToCloud = useBioEditorStore((s) => s.publishToCloud);
  const setHasUnsavedChanges = useBioEditorStore((s) => s.setHasUnsavedChanges);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(page?.title || 'My Bio Page');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showPublishSuccessModal, setShowPublishSuccessModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // 1. Browser Native Tab Close Guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (page?.title) {
      setTitleInput(page.title);
    }
  }, [page?.title]);

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      updatePageMeta({ title: titleInput.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTitleInput(page?.title || 'My Bio Page');
      setIsEditingTitle(false);
    }
  };

  const isLocalhost = typeof window !== 'undefined' && window.location.hostname.includes('localhost');
  const path = `/u/${username}${page?.slug && page.slug !== 'main' ? `/${page.slug}` : ''}`;
  const liveUrl = `suvix.in${path}`;
  const liveHref = isLocalhost ? path : `https://${liveUrl}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`https://${liveUrl}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowExitModal(true);
    } else {
      navigate('/link-in-bio');
    }
  };

  const handleSaveDraft = async () => {
    await saveToCloud();
  };

  const handlePublishClick = async () => {
    try {
      setIsPublishing(true);
      await saveToCloud();
      const success = await publishToCloud();
      if (success) {
        setShowPublishSuccessModal(true);
        onPublish?.();
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveAndExit = async () => {
    await saveToCloud();
    setShowExitModal(false);
    navigate('/link-in-bio');
  };

  const handleDiscardAndExit = () => {
    setHasUnsavedChanges(false);
    setShowExitModal(false);
    navigate('/link-in-bio');
  };

  return (
    <>
      <header className="w-full h-14 bg-white dark:bg-[#111114] border-b border-slate-200 dark:border-zinc-800 px-4 flex items-center justify-between gap-3 shrink-0 z-30 select-none font-sans">
        
        {/* ── LEFT SECTION: Back to Dashboard & Page Title ── */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Back Button with Guard */}
          <button
            onClick={handleBackClick}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Back to Link in Bio Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:border-zinc-800 hidden sm:block" />

          {/* Editable Page Title */}
          <div className="flex items-center gap-1.5 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                autoFocus
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleKeyDown}
                className="text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-sky-500 focus:outline-none min-w-[140px]"
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors text-left truncate cursor-pointer"
                title="Click to rename"
              >
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px] lg:max-w-[240px]">
                  {page?.title || 'My Bio Page'}
                </span>
                <Pencil className="w-3 h-3 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            )}

            {/* Cloud Sync State Badge */}
            <div className="hidden lg:flex items-center gap-1.5 ml-2 text-[11px] font-medium text-slate-400 dark:text-zinc-500">
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 text-sky-500 animate-spin" />
                  <span className="text-sky-500">Saving to cloud...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-500">Unsaved changes</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Saved</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── CENTER SECTION: Undo/Redo & Viewport Switcher ── */}
        <div className="hidden md:flex items-center gap-4">
          
          {/* Undo / Redo */}
          <div className="flex items-center rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-0.5">
            <button
              onClick={undo}
              className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-slate-200 dark:bg-zinc-800" />
            <button
              onClick={redo}
              className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Viewport Device Switcher */}
          <div className="flex items-center rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-0.5">
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                previewDevice === 'mobile'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>

            <button
              onClick={() => setPreviewDevice('tablet')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                previewDevice === 'tablet'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Tablet</span>
            </button>

            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                previewDevice === 'desktop'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Desktop View (100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
          </div>
        </div>

        {/* ── RIGHT SECTION: Save Draft, Live URL, Preview & Publish ── */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Quick URL Pill */}
          <button
            onClick={handleCopyUrl}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Click to copy live URL"
          >
            <Globe className="w-3 h-3 text-slate-400" />
            <span className="truncate max-w-[110px]">{liveUrl}</span>
            {copiedLink ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3 text-slate-400" />
            )}
          </button>

          {/* Direct "View Public Profile" Button */}
          <a
            href={liveHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer no-underline"
            title="Open Live Public Profile in a new tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden md:inline">View Public Profile</span>
            <span className="md:hidden">Public</span>
          </a>

          {/* Explicit [Save Draft] Button (Google/Figma Zero-Waste Pattern) */}
          <button
            onClick={handleSaveDraft}
            disabled={isSaving || !hasUnsavedChanges}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-950/60 shadow-xs'
                : 'bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-zinc-800 opacity-60 cursor-not-allowed'
            }`}
            title="Save draft to cloud"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          {/* Toggle Full Preview Mode */}
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              isPreviewMode
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
            title="Toggle preview mode"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Primary [Publish] CTA */}
          <button
            onClick={handlePublishClick}
            disabled={isSaving || isPublishing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isPublishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>{isPublishing ? 'Publishing...' : 'Publish'}</span>
          </button>

        </div>

      </header>

      {/* Exit Guard Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={showExitModal}
        isSaving={isSaving}
        onStay={() => setShowExitModal(false)}
        onDiscard={handleDiscardAndExit}
        onSaveAndExit={handleSaveAndExit}
      />

      {/* Celebratory Publish Success Modal */}
      <PublishSuccessModal
        isOpen={showPublishSuccessModal}
        onClose={() => setShowPublishSuccessModal(false)}
        pageTitle={page?.title || 'Bio Page'}
        username={username}
        slug={page?.slug}
        onNavigateToDashboard={() => {
          setShowPublishSuccessModal(false);
          navigate('/link-in-bio');
        }}
      />
    </>
  );
};

export default StudioNavbar;
