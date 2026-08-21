import React, { useState } from 'react';
import type { BioPageSummary } from '../../types/page.types';
import { resolveBackgroundStyle } from '../../utils/themeResolver';
import defaultProfile from '../../../assets/defaultprofile.png';
import { 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  MoreVertical, 
  Edit3, 
  CopyCheck, 
  Trash2, 
  CheckCircle2
} from 'lucide-react';

interface BioPageCardProps {
  page: BioPageSummary;
  username?: string;
  onEdit: (pageId: string) => void;
  onSetActive: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
}

export const BioPageCard: React.FC<BioPageCardProps> = ({
  page,
  username = 'creator',
  onEdit,
  onSetActive,
  onDuplicate,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const fullUrl = `suvix.me/${username}${page.slug === 'main' ? '' : `/${page.slug}`}`;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`https://${fullUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamic preview properties from saved / draft page
  const pageTheme = (page as any).publishedSnapshot?.theme || (page as any).draftTheme;
  const resolvedBg = resolveBackgroundStyle(pageTheme, { isThumbnail: true });
  const blocks = (page as any).publishedSnapshot?.blocks || (page as any).draftBlocks || [];
  const headerBlock = blocks.find((b: any) => b.type === 'profile-header');
  const linkBlocks = blocks.filter((b: any) => b.type === 'link-button' && b.isVisible !== false);
  const avatar = headerBlock?.config?.imageUrl || headerBlock?.config?.avatarUrl || defaultProfile;
  const creatorName = headerBlock?.config?.title || headerBlock?.config?.displayName || page.title;

  return (
    <div className={`relative flex flex-col rounded-xl border transition-all duration-200 overflow-hidden ${
      page.isActive 
        ? 'bg-white dark:bg-[#111114] border-slate-900 dark:border-white/30 shadow-sm ring-1 ring-slate-900/10 dark:ring-white/20' 
        : 'bg-white dark:bg-[#111114] border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-xs'
    }`}>
      {/* Top Banner / Status Strip */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-2">
          {page.isActive ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active Primary
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
              Draft
            </span>
          )}

          <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
            /{page.slug}
          </span>
        </div>

        {/* Action Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            title="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMenu(false)} 
              />
              <div className="absolute right-0 top-7 z-50 w-44 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-lg text-xs flex flex-col">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(page.id);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  Edit Design
                </button>
                {!page.isActive && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onSetActive(page.id);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Set as Primary
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDuplicate(page.id);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <CopyCheck className="w-3.5 h-3.5 text-slate-500" />
                  Duplicate Page
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(page.id);
                  }}
                  className="w-full px-3 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Page
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex gap-4 items-center">
        {/* Real Live Mini Phone Preview */}
        <div 
          style={resolvedBg.containerStyle}
          className="shrink-0 w-20 h-28 rounded-xl border-2 border-zinc-800 shadow-md flex flex-col items-center p-1.5 overflow-hidden relative select-none"
        >
          {/* Mini Wallpaper Layer */}
          {resolvedBg.isImage && (
            <div 
              style={resolvedBg.bgImageLayerStyle}
              className="absolute inset-0 z-0 pointer-events-none"
            />
          )}

          {/* Mini Overlay Tint */}
          {resolvedBg.overlayStyle.opacity ? (
            <div 
              style={resolvedBg.overlayStyle}
              className="absolute inset-0 z-0 pointer-events-none"
            />
          ) : null}

          {/* Dynamic Island Notch */}
          <div className="w-5 h-1 bg-black rounded-full mb-1 opacity-80 relative z-10" />

          {/* Mini Avatar */}
          <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/90 shadow-xs mb-0.5 bg-white/20 relative z-10">
            <img src={avatar} alt={creatorName} className="w-full h-full object-cover" />
          </div>

          {/* Mini Name */}
          <span className="text-[6.5px] font-extrabold text-white truncate max-w-[65px] leading-tight text-center relative z-10">
            {creatorName}
          </span>

          {/* Mini 3 Social Dots */}
          <div className="flex items-center gap-0.5 my-1 relative z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
          </div>

          {/* Mini Link Button Cards (up to 2) */}
          <div className="w-full space-y-0.5 mt-auto relative z-10">
            {linkBlocks.slice(0, 2).map((b: any, i: number) => (
              <div 
                key={b.id || i}
                className="w-full py-0.5 px-1 rounded-sm bg-white text-slate-900 text-[5px] font-bold truncate text-center shadow-2xs leading-tight"
              >
                {b.config?.text || b.config?.title || 'Link'}
              </div>
            ))}
            {linkBlocks.length === 0 && (
              <>
                <div className="w-full py-0.5 px-1 rounded-sm bg-white text-slate-900 text-[5px] font-bold truncate text-center shadow-2xs leading-tight">
                  YouTube
                </div>
                <div className="w-full py-0.5 px-1 rounded-sm bg-white text-slate-900 text-[5px] font-bold truncate text-center shadow-2xs leading-tight">
                  Instagram
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info Column */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate mb-0.5">
            {page.title}
          </h3>
          
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-mono mb-2.5 truncate">
            <Globe className="w-3.5 h-3.5 shrink-0 opacity-60" />
            <span className="truncate">{fullUrl}</span>
          </div>

          {/* Mini Stats Metrics */}
          <div className="grid grid-cols-3 gap-2 py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Views</span>
              <span className="text-xs font-semibold text-slate-900 dark:text-zinc-200 font-mono">
                {page.viewCount.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Clicks</span>
              <span className="text-xs font-semibold text-slate-900 dark:text-zinc-200 font-mono">
                {page.clickCount.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">CTR</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                {page.ctr}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 mt-auto">
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <a
            href={`https://${fullUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
            title="Open Live Public Link"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => onEdit(page.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs"
          >
            <Edit3 className="w-3 h-3" />
            Edit Page
          </button>
        </div>
      </div>
    </div>
  );
};
