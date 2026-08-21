import React from 'react';
import type { ProfileVariant } from '../../types/block.types';
import { 
  Check, 
  Sparkles, 
  User, 
  Image as ImageIcon, 
  Columns, 
  Layers, 
} from 'lucide-react';
import { ScaledBlockPreview } from '../common/ScaledBlockPreview';
import { PROFILE_VARIANTS, CenteredVariant } from '../blocks/header-variants';

export interface HeaderVariantMeta {
  id: ProfileVariant;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  icon: React.ReactNode;
}

export const HEADER_VARIANTS_METADATA: HeaderVariantMeta[] = [
  {
    id: 'centered',
    name: 'Centered Minimal',
    badge: 'Classic Linktree',
    badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    description: 'Clean centered avatar, handle, verified badge, and bio lines. Best for standard link hubs.',
    icon: <User className="w-4 h-4 text-sky-500" />,
  },
  {
    id: 'banner',
    name: 'Cover Hero Banner',
    badge: 'Best for Creators & Artists',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    description: 'Widescreen backdrop cover photo with overlapping avatar. Creates high visual impact.',
    icon: <ImageIcon className="w-4 h-4 text-amber-500" />,
  },
  {
    id: 'split',
    name: 'Split Bento Card',
    badge: 'Best for Founders & SaaS',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    description: 'Modern side-by-side Bento card: photo on left, title & bio on right. Professional and structured.',
    icon: <Columns className="w-4 h-4 text-emerald-500" />,
  },
  {
    id: 'compact',
    name: 'Compact Identity Pill',
    badge: 'Ultra Minimalist',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    description: 'Space-saving horizontal identity bar. Perfect when you want direct focus on links or products.',
    icon: <Layers className="w-4 h-4 text-indigo-500" />,
  },
  {
    id: 'story',
    name: 'Story Aura Ring',
    badge: 'Instagram Native',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    description: 'Glowing animated gradient aura ring with active status indicator. Maximizes follower engagement.',
    icon: <Sparkles className="w-4 h-4 text-rose-500" />,
  },
];

interface HeaderVariantPreviewCardProps {
  variantMeta: HeaderVariantMeta;
  isSelected: boolean;
  onSelect: (variant: ProfileVariant) => void;
  avatarUrl?: string;
  name?: string;
  handle?: string;
  bio?: string;
}

export const HeaderVariantPreviewCard: React.FC<HeaderVariantPreviewCardProps> = ({
  variantMeta,
  isSelected,
  onSelect,
  avatarUrl,
  name,
  handle,
  bio,
}) => {
  const { id, name: title, badge, badgeColor, description } = variantMeta;

  const displayName = name?.trim() || 'Your Name';
  const displayHandle = handle?.trim() || '@yourhandle';
  const displayBio = bio?.trim() || 'Your bio and description will appear here...';
  const displayAvatar = avatarUrl?.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

  const VariantComponent = PROFILE_VARIANTS[id] || CenteredVariant;

  const mockConfig = {
    variant: id,
    title: displayName,
    subtitle: displayHandle,
    bio: displayBio,
    avatarUrl: displayAvatar,
    showVerifiedBadge: true,
    badgeText: id === 'split' ? '• Available' : id === 'story' ? 'LIVE' : undefined,
  };

  const mockTheme = {
    colors: {
      text: '#ffffff',
      textMuted: '#94a3b8',
    },
  };

  return (
    <div
      onClick={() => onSelect(id)}
      className={`group relative rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden ${
        isSelected
          ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-500 shadow-md ring-2 ring-sky-500/30'
          : 'bg-white dark:bg-[#151518] border-slate-200 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600 hover:shadow-sm'
      }`}
    >
      {/* ── TOP VISUAL MOCKUP CANVAS (Rendered Live Component via ScaledBlockPreview) ── */}
      <div className="p-3.5 bg-gradient-to-b from-slate-900/90 to-slate-950 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-center min-h-[145px] max-h-[155px] relative overflow-hidden">
        
        {/* Selected Checkmark Badge */}
        {isSelected && (
          <div className="absolute top-2.5 right-2.5 z-20 w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md ring-2 ring-white">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
        )}

        <ScaledBlockPreview designWidth={380} className="w-full">
          <VariantComponent config={mockConfig as any} theme={mockTheme as any} />
        </ScaledBlockPreview>

      </div>

      {/* ── BOTTOM META INFO & BADGES ── */}
      <div className="p-4 flex flex-col justify-between flex-1 bg-white dark:bg-[#151518]">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
              {title}
            </h4>
            <span
              className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${badgeColor}`}
            >
              {badge}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug line-clamp-2 mt-1">
            {description}
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          className={`mt-3.5 w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            isSelected
              ? 'bg-sky-500 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-200 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black'
          }`}
        >
          <span>{isSelected ? 'Selected Style' : 'Choose This Style'}</span>
        </button>
      </div>
    </div>
  );
};

export default HeaderVariantPreviewCard;
