import React, { Suspense } from 'react';
import type { TemplateDefinition, ResolvedTheme } from '../../types/template.types';
import type { CreatorInfo, ProfileBlock, BlockType } from '../../types/profile.types';
import { Loader2, AlertCircle } from 'lucide-react';

interface RightPanelProps {
  templateDef: TemplateDefinition;
  creator: CreatorInfo;
  blocks: ProfileBlock[];
  theme: ResolvedTheme;
  activeSection: string | null;
  validationError?: string | null;
  onThemeChange: (key: string, value: any) => void;
  onCreatorChange: (field: keyof CreatorInfo, value: any) => void;
  onBlockAdd: (type: BlockType) => void;
  onBlockUpdate: (id: string, data: Partial<ProfileBlock>) => void;
  onBlockRemove: (id: string) => void;
  onBlockReorder: (id: string, direction: 'up' | 'down') => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  templateDef,
  creator,
  blocks,
  theme,
  activeSection,
  validationError,
  onThemeChange,
  onCreatorChange,
  onBlockAdd,
  onBlockUpdate,
  onBlockRemove,
  onBlockReorder,
}) => {
  const EditorComponent = templateDef.editor;

  return (
    <aside className="w-full lg:w-[350px] xl:w-[390px] h-full flex flex-col border-l border-border-main/60 bg-container overflow-hidden select-none shrink-0">
      {/* Top Banner if validation error */}
      {validationError && (
        <div className="p-3 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <Suspense
          fallback={
            <div className="w-full py-16 flex flex-col items-center justify-center gap-2 text-text-muted">
              <Loader2 size={20} className="animate-spin text-indigo-500" />
              <span className="text-xs font-semibold">Loading editor options...</span>
            </div>
          }
        >
          <EditorComponent
            creator={creator}
            blocks={blocks}
            theme={theme}
            activeSection={activeSection}
            onThemeChange={onThemeChange}
            onCreatorChange={onCreatorChange}
            onBlockAdd={onBlockAdd}
            onBlockUpdate={onBlockUpdate}
            onBlockRemove={onBlockRemove}
            onBlockReorder={onBlockReorder}
          />
        </Suspense>
      </div>
    </aside>
  );
};

export default RightPanel;
