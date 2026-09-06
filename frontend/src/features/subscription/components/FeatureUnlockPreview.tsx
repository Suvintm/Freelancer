import React from 'react';
import { Check } from 'lucide-react';

interface FeatureUnlockPreviewProps {
  features: string[];
  planName: string;
  role?: string;
  isDarkMode?: boolean;
}

export const FeatureUnlockPreview: React.FC<FeatureUnlockPreviewProps> = ({
  features,
  planName,
  role: _role,
  isDarkMode = false,
}) => {
  if (!features || features.length === 0) return null;

  const displayFeatures = features.slice(0, 4);

  return (
    <div className="p-3 rounded-xl border border-zinc-800 bg-black text-zinc-300 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400">
          Included in {planName}
        </span>
        <span className="text-[10px] font-medium text-emerald-500">
          Instant Activation
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {displayFeatures.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-1.5 text-xs">
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-snug line-clamp-1 font-normal">
              {feature}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
