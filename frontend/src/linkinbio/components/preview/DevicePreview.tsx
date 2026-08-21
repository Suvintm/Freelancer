import React, { Suspense } from 'react';
import type { DeviceType } from '../../types/studio.types';
import type { CreatorInfo, ProfileBlock } from '../../types/profile.types';
import type { ResolvedTheme, TemplateDefinition } from '../../types/template.types';
import MobileFrame from './MobileFrame';
import LaptopFrame from './LaptopFrame';
import PreviewScaler from './PreviewScaler';
import { Smartphone, Laptop, Loader2, ZoomIn, ZoomOut } from 'lucide-react';

interface DevicePreviewProps {
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  templateDef: TemplateDefinition;
  creator: CreatorInfo;
  blocks: ProfileBlock[];
  theme: ResolvedTheme;
  activeSection: string | null;
  onSectionClick: (regionId: string) => void;
  publicUrl?: string;
}

export const DevicePreview: React.FC<DevicePreviewProps> = ({
  device,
  onDeviceChange,
  templateDef,
  creator,
  blocks,
  theme,
  activeSection,
  onSectionClick,
  publicUrl = 'suvix.link/profile'
}) => {
  const [zoomPercent, setZoomPercent] = React.useState<number>(100);

  // Compute actual CSS transform scale relative to ideal 0.60 base scale
  const actualScale = React.useMemo(() => {
    const baseScale = device === 'laptop' ? 0.55 : 0.60;
    return (zoomPercent / 100) * baseScale;
  }, [zoomPercent, device]);

  const TemplateComponent = templateDef.component;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-1 overflow-hidden relative select-none">
      {/* Top Floating Control Bar: Device Toggle & Zoom */}
      <div className="z-30 flex items-center gap-1.5 p-1 rounded-xl bg-surface/95 backdrop-blur-md border border-border-main/70 shadow-md">
        {/* Device Switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-background/50 border border-border-main/30">
          <button
            type="button"
            onClick={() => onDeviceChange('mobile')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
              device === 'mobile'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Smartphone size={13} />
            <span>Mobile</span>
          </button>
          <button
            type="button"
            onClick={() => onDeviceChange('laptop')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
              device === 'laptop'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Laptop size={13} />
            <span>Laptop</span>
          </button>
        </div>

        <div className="w-px h-4 bg-border-main/50 mx-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1 text-text-muted">
          <button
            type="button"
            onClick={() => setZoomPercent((z) => Math.max(50, z - 10))}
            className="p-1 rounded-lg hover:bg-surface hover:text-text-main"
            title="Zoom out"
          >
            <ZoomOut size={13} />
          </button>
          <span className="text-[10px] font-mono font-bold w-10 text-center">
            {zoomPercent}%
          </span>
          <button
            type="button"
            onClick={() => setZoomPercent((z) => Math.min(150, z + 10))}
            className="p-1 rounded-lg hover:bg-surface hover:text-text-main"
            title="Zoom in"
          >
            <ZoomIn size={13} />
          </button>
        </div>
      </div>

      {/* Center Device Frame Canvas with Scaler */}
      <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
        <PreviewScaler scale={actualScale}>
          {device === 'mobile' ? (
            <MobileFrame>
              <Suspense
                fallback={
                  <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center gap-2 text-text-muted">
                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                    <span className="text-xs font-semibold">Loading template...</span>
                  </div>
                }
              >
                <TemplateComponent
                  creator={creator}
                  blocks={blocks}
                  theme={theme}
                  isEditing={true}
                  activeSection={activeSection}
                  onSectionClick={onSectionClick}
                />
              </Suspense>
            </MobileFrame>
          ) : (
            <LaptopFrame url={publicUrl}>
              <Suspense
                fallback={
                  <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center gap-2 text-text-muted">
                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                    <span className="text-xs font-semibold">Loading template...</span>
                  </div>
                }
              >
                <TemplateComponent
                  creator={creator}
                  blocks={blocks}
                  theme={theme}
                  isEditing={true}
                  activeSection={activeSection}
                  onSectionClick={onSectionClick}
                />
              </Suspense>
            </LaptopFrame>
          )}
        </PreviewScaler>
      </div>

      {/* Bottom Hint */}
      <div className="text-[10px] font-semibold text-text-muted select-none flex items-center gap-1.5 opacity-70">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Live Interactive Preview — Click any section on screen to edit</span>
      </div>
    </div>
  );
};

export default DevicePreview;
