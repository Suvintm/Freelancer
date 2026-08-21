import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBioEditorStore } from '../../../zustand/useBioEditorStore';
import { 
  Globe, 
  Search, 
  Trash2, 
  Check, 
  Copy 
} from 'lucide-react';

export const PageSettingsPanel: React.FC = () => {
  const navigate = useNavigate();
  const page = useBioEditorStore((s) => s.page);
  const updatePageMeta = useBioEditorStore((s) => s.updatePageMeta);
  const updateSettings = useBioEditorStore((s) => s.updateSettings);

  const [copied, setCopied] = useState(false);

  if (!page) return null;

  const liveUrl = `suvix.me/${page.slug === 'main' ? 'creator' : `creator/${page.slug}`}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${liveUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      data-lenis-prevent="true"
      className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar font-sans select-none"
    >
      {/* ── 1. URL SLUG SETTINGS ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Globe className="w-3.5 h-3.5 text-sky-500" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Custom Page URL
          </h4>
        </div>

        <div className="space-y-2">
          <div className="flex items-center rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1.5">
            <span className="text-[11px] font-mono text-slate-400 pl-1.5 pr-0.5 select-none">
              suvix.me/creator/
            </span>
            <input
              type="text"
              value={page.slug || ''}
              onChange={(e) => updatePageMeta({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })}
              className="flex-1 min-w-0 bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none font-mono"
              placeholder="my-link"
            />
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Live Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 2. SEO META SETTINGS ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Search className="w-3.5 h-3.5 text-sky-500" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            SEO & Search Preview
          </h4>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              Meta Title
            </label>
            <input
              type="text"
              value={page.settings?.seo?.metaTitle || ''}
              onChange={(e) => updateSettings({ seo: { ...page.settings?.seo, metaTitle: e.target.value } })}
              placeholder="Page title on Google and social tabs"
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              Meta Description
            </label>
            <textarea
              rows={2}
              value={page.settings?.seo?.metaDescription || ''}
              onChange={(e) => updateSettings({ seo: { ...page.settings?.seo, metaDescription: e.target.value } })}
              placeholder="Summary shown on Google search results"
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* ── 3. DANGER ZONE ── */}
      <div className="pt-4 border-t border-slate-200 dark:border-zinc-800">
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this bio page?')) {
              navigate('/link-in-bio');
            }
          }}
          className="w-full py-2 px-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Bio Page</span>
        </button>
      </div>
    </div>
  );
};
