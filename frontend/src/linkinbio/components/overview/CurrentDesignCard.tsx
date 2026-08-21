import React, { Suspense } from 'react';
import { getTemplate } from '../../templates/registry';
import type { CreatorInfo, ProfileBlock } from '../../types/profile.types';
import type { ResolvedTheme } from '../../types/template.types';
import { Sparkles, Loader2, Edit3, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CurrentDesignCardProps {
  templateSlug: string;
  creator: CreatorInfo;
  blocks: ProfileBlock[];
  theme: ResolvedTheme;
  publicUrl: string;
}

export const CurrentDesignCard: React.FC<CurrentDesignCardProps> = ({
  templateSlug,
  creator,
  blocks,
  theme,
  publicUrl,
}) => {
  const navigate = useNavigate();
  const templateDef = getTemplate(templateSlug);
  const TemplateComponent = templateDef.component;

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      {/* Top Template Label & Quick Edit Overlay Trigger */}
      <div className="flex items-center justify-between w-[290px] mb-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-text-main">
          <Sparkles size={13} className="text-indigo-500" />
          <span>Active: {templateDef.config.name}</span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/link-in-bio/design')}
          className="text-[11px] font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Edit3 size={11} />
          <span>Customize</span>
        </button>
      </div>

      {/* Mini Smartphone Frame */}
      <div className="relative w-[290px] h-[570px] bg-zinc-950 rounded-[44px] p-2.5 shadow-2xl ring-1 ring-white/10 flex flex-col shrink-0 select-none group">
        <div className="w-full h-full rounded-[34px] overflow-hidden relative flex flex-col bg-black">
          {/* Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-50 flex items-center justify-center">
            <div className="w-8 h-1 bg-zinc-900 rounded-full" />
          </div>

          {/* Scrollable Viewport */}
          <div className="w-full flex-1 overflow-y-auto scrollbar-hide flex flex-col pt-2">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                  <Loader2 size={20} className="animate-spin text-indigo-500" />
                </div>
              }
            >
              <TemplateComponent
                creator={creator}
                blocks={blocks}
                theme={theme}
                isEditing={false}
              />
            </Suspense>
          </div>

          {/* Hover Overlay Button to Edit */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-4 z-50">
            <button
              type="button"
              onClick={() => navigate('/link-in-bio/design')}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit3 size={13} />
              <span>Open Studio Editor</span>
            </button>
            <button
              type="button"
              onClick={() => window.open(publicUrl || `/${creator.username}`, '_blank')}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink size={13} />
              <span>View Public Page</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentDesignCard;
