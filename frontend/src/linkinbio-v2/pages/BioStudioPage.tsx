import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBioEditorStore } from '../../zustand/useBioEditorStore';
import { StudioNavbar } from '../components/studio/StudioNavbar';
import { BlockListPanel } from '../components/studio/BlockListPanel';
import { AddBlockDrawer } from '../components/studio/AddBlockDrawer';
import { BioCanvasPreview } from '../components/studio/BioCanvasPreview';
import { BlockInspectorPanel } from '../components/studio/BlockInspectorPanel';
import { ThemeCustomizerPanel } from '../components/studio/ThemeCustomizerPanel';
import { PageSettingsPanel } from '../components/studio/PageSettingsPanel';
import { StudioLoadingScreen } from '../components/studio/StudioLoadingScreen';
import { 
  Palette, 
  Sliders, 
  Settings, 
} from 'lucide-react';

type RightPanelTab = 'block' | 'theme' | 'settings';

export const BioStudioPage: React.FC = () => {
  const { id, pageId } = useParams<{ id?: string; pageId?: string }>();
  const targetPageId = pageId || id;
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RightPanelTab>('block');
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const page = useBioEditorStore((s) => s.page);
  const isPreviewMode = useBioEditorStore((s) => s.isPreviewMode);
  const selectedBlockId = useBioEditorStore((s) => s.selectedBlockId);
  const loadTemplate = useBioEditorStore((s) => s.loadTemplate);
  const addBlock = useBioEditorStore((s) => s.addBlock);
  const fetchAndInitPage = useBioEditorStore((s) => s.fetchAndInitPage);

  // Initialize or fetch the specific bio page with guaranteed minimum 2.0s branded loader
  useEffect(() => {
    let isMounted = true;
    setIsLoadingPage(true);

    const minTimer = new Promise((resolve) => setTimeout(resolve, 2000));

    if (targetPageId) {
      const fetchPromise = fetchAndInitPage(targetPageId).catch((err) => {
        console.error('[BioStudioPage] Error fetching page:', err);
      });

      Promise.all([fetchPromise, minTimer]).finally(() => {
        if (isMounted) setIsLoadingPage(false);
      });
    } else {
      if (!page) {
        loadTemplate('suvix-signature-olive', 'Official Bio', 'main');
      }
      minTimer.finally(() => {
        if (isMounted) setIsLoadingPage(false);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [targetPageId]);

  // Auto-switch to 'block' tab whenever a block is selected
  useEffect(() => {
    if (selectedBlockId) {
      setActiveTab('block');
    }
  }, [selectedBlockId]);

  // Dedicated Studio Loading Screen while data is being fetched and cached
  if (isLoadingPage || (targetPageId && (!page || page.id !== targetPageId))) {
    return (
      <StudioLoadingScreen 
        message="Opening Bio Studio..." 
        submessage="Preparing your customized blocks, theme, and real-time canvas..." 
      />
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 font-sans overflow-hidden select-none">
      
      {/* ── 1. STUDIO TOP NAVBAR (Part 3.1) ── */}
      <StudioNavbar />

      {/* ── 2. MAIN 3-PANEL WORKSPACE ── */}
      <div className="flex-1 min-h-0 flex items-stretch overflow-hidden relative">
        
        {/* ── LEFT PANEL: Layer Tree & Block Organizer (Part 3.2) ── */}
        {!isPreviewMode && (
          <BlockListPanel 
            onOpenAddDrawer={() => setIsAddDrawerOpen(true)}
            onOpenThemeTab={() => setActiveTab('theme')}
          />
        )}

        {/* ── CENTER PANEL: Live Interactive Visual Canvas (Part 3.3) ── */}
        <BioCanvasPreview />

        {/* ── RIGHT PANEL: Dynamic Inspector & Theme Customizer (Part 3.4) ── */}
        {!isPreviewMode && (
          <aside 
            data-lenis-prevent="true"
            className="w-80 lg:w-88 h-full bg-white dark:bg-[#111114] border-l border-slate-200 dark:border-zinc-800 flex flex-col shrink-0 z-20 select-none font-sans"
          >
            {/* Header Tabs */}
            <div className="px-3 py-2.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-around text-xs font-semibold shrink-0 bg-slate-50/50 dark:bg-zinc-900/50">
              <button 
                onClick={() => setActiveTab('block')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'block'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs font-bold'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Block</span>
              </button>

              <button 
                onClick={() => setActiveTab('theme')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'theme'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs font-bold'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Theme</span>
              </button>

              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs font-bold'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            </div>

            {/* Tab Body */}
            {activeTab === 'block' && <BlockInspectorPanel />}
            {activeTab === 'theme' && <ThemeCustomizerPanel />}
            {activeTab === 'settings' && <PageSettingsPanel />}
          </aside>
        )}

      </div>

      {/* ── 3. ADD BLOCK DRAWER MODAL (Part 3.2) ── */}
      <AddBlockDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        onAddBlock={(type, overrides) => addBlock(type, undefined, overrides)}
      />

    </div>
  );
};

export default BioStudioPage;
