import React from 'react';
import StudioToolbar from './StudioToolbar';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import DevicePreview from '../preview/DevicePreview';
import type { DeviceType } from '../../types/studio.types';
import type { CreatorInfo, ProfileBlock, BlockType } from '../../types/profile.types';
import type { ResolvedTheme, TemplateDefinition } from '../../types/template.types';

interface StudioShellProps {
  templateDef: TemplateDefinition;
  selectedSlug: string;
  onSelectTemplate: (slug: string) => void;
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  creator: CreatorInfo;
  blocks: ProfileBlock[];
  theme: ResolvedTheme;
  activeSection: string | null;
  onSectionClick: (regionId: string) => void;
  onThemeChange: (key: string, value: any) => void;
  onCreatorChange: (field: keyof CreatorInfo, value: any) => void;
  onBlockAdd: (type: BlockType) => void;
  onBlockUpdate: (id: string, data: Partial<ProfileBlock>) => void;
  onBlockRemove: (id: string) => void;
  onBlockReorder: (id: string, direction: 'up' | 'down') => void;
  isPublishing: boolean;
  publishSuccess: boolean;
  validationError?: string | null;
  onPublish: () => void;
}

export const StudioShell: React.FC<StudioShellProps> = ({
  templateDef,
  selectedSlug,
  onSelectTemplate,
  device,
  onDeviceChange,
  creator,
  blocks,
  theme,
  activeSection,
  onSectionClick,
  onThemeChange,
  onCreatorChange,
  onBlockAdd,
  onBlockUpdate,
  onBlockRemove,
  onBlockReorder,
  isPublishing,
  publishSuccess,
  validationError,
  onPublish,
}) => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-page">
      {/* 1. Master Studio Toolbar */}
      <StudioToolbar
        templateName={templateDef.config.name}
        isPublishing={isPublishing}
        publishSuccess={publishSuccess}
        onPublish={onPublish}
        publicUsername={creator.username}
      />

      {/* 2. 3-Panel Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Template Switcher Gallery */}
        <LeftPanel
          selectedSlug={selectedSlug}
          onSelectTemplate={onSelectTemplate}
        />

        {/* Center Column: Interactive Live Device Preview Canvas */}
        <main className="flex-1 h-full overflow-hidden bg-zinc-950/20 flex flex-col">
          <DevicePreview
            device={device}
            onDeviceChange={onDeviceChange}
            templateDef={templateDef}
            creator={creator}
            blocks={blocks}
            theme={theme}
            activeSection={activeSection}
            onSectionClick={onSectionClick}
            publicUrl={`suvix.link/${creator.username}`}
          />
        </main>

        {/* Right Column: Template-Specific Dynamic Editor Controls */}
        <RightPanel
          templateDef={templateDef}
          creator={creator}
          blocks={blocks}
          theme={theme}
          activeSection={activeSection}
          validationError={validationError}
          onThemeChange={onThemeChange}
          onCreatorChange={onCreatorChange}
          onBlockAdd={onBlockAdd}
          onBlockUpdate={onBlockUpdate}
          onBlockRemove={onBlockRemove}
          onBlockReorder={onBlockReorder}
        />
      </div>
    </div>
  );
};

export default StudioShell;
