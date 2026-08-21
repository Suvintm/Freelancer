import React from 'react';
import { Link as LinkIcon, Youtube, Instagram, Twitter, Twitch, Github, Globe, Music, ShoppingBag, Sparkles } from 'lucide-react';

interface IconPickerProps {
  label?: string;
  value?: string;
  onChange: (iconKey: string) => void;
}

const AVAILABLE_ICONS = [
  { key: 'LINK', label: 'Link', icon: LinkIcon },
  { key: 'YOUTUBE_CHANNEL', label: 'YouTube', icon: Youtube },
  { key: 'INSTAGRAM_PROFILE', label: 'Instagram', icon: Instagram },
  { key: 'TWITTER', label: 'Twitter / X', icon: Twitter },
  { key: 'TWITCH', label: 'Twitch', icon: Twitch },
  { key: 'GITHUB', label: 'GitHub', icon: Github },
  { key: 'GLOBE', label: 'Website', icon: Globe },
  { key: 'MUSIC', label: 'Music', icon: Music },
  { key: 'SHOP', label: 'Store', icon: ShoppingBag },
  { key: 'CUSTOM', label: 'Feature', icon: Sparkles }
];

export const IconPicker: React.FC<IconPickerProps> = ({
  label = 'Select Icon',
  value = 'LINK',
  onChange
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="grid grid-cols-5 gap-2">
        {AVAILABLE_ICONS.map((item) => {
          const IconComp = item.icon;
          const isSelected = value === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              title={item.label}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500'
                  : 'border-border-main/50 bg-surface text-text-muted hover:border-border-main'
              }`}
            >
              <IconComp size={16} />
              <span className="text-[9px] font-semibold truncate w-full text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default IconPicker;
