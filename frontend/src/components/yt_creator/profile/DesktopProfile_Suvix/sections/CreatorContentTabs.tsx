import React, { useState } from 'react';
import { 
  Youtube,
  Play,
  LayoutGrid,
  PlaySquare,
  Image as ImageIcon,
  Users2,
  Tag,
  ChevronDown 
} from 'lucide-react';
import { motion } from 'framer-motion';

export type ProfileTabType = 
  | 'yt_posts' 
  | 'yt_videos' 
  | 'posts' 
  | 'reels' 
  | 'thumbnail_vote' 
  | 'collabs' 
  | 'tagged';

interface CreatorContentTabsProps {
  activeTab: ProfileTabType;
  setActiveTab: (tab: ProfileTabType) => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  counts?: Partial<Record<ProfileTabType, number>>;
}

const TABS: Array<{ 
  id: ProfileTabType; 
  label: string; 
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}> = [
  { id: 'yt_videos',      label: 'YouTube Videos', icon: Play },
  { id: 'yt_posts',       label: 'YT Posts',       icon: Youtube },
  { id: 'posts',          label: 'Posts',          icon: LayoutGrid },
  { id: 'reels',          label: 'Reels',          icon: PlaySquare },
  { id: 'thumbnail_vote', label: 'Thumbnails',     icon: ImageIcon },
  { id: 'collabs',        label: 'Collabs',        icon: Users2 },
  { id: 'tagged',         label: 'Tagged',         icon: Tag },
];

export const CreatorContentTabs: React.FC<CreatorContentTabsProps> = ({
  activeTab,
  setActiveTab,
  sortBy = 'Latest',
  onSortChange,
  counts,
}) => {
  const [isSortOpen, setIsSortOpen] = useState(false);

  const sortOptions = ['Latest', 'Popular', 'Oldest', 'Most Discussed'];

  return (
    <div className="w-full border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 mt-2 mb-1 select-none">
      
      {/* Scrollable Tabs List */}
      <div className="flex items-center gap-5 sm:gap-6 overflow-x-auto scrollbar-hide py-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-2 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                isActive 
                  ? 'text-zinc-900 dark:text-white font-extrabold' 
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              <Icon size={14} strokeWidth={isActive ? 2.3 : 1.8} />
              <span>{tab.label}</span>

              {/* Optional Count Pill */}
              {counts?.[tab.id] !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                }`}>
                  {counts[tab.id]}
                </span>
              )}

              {/* Active Tab Indicator Bar */}
              {isActive && (
                <motion.div
                  layoutId="creatorProfileActiveTab"
                  className="absolute bottom-0 inset-x-0 h-[2.5px] bg-black dark:bg-white rounded-t-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Sort Filter Dropdown */}
      <div className="relative shrink-0 pb-1.5">
        <button
          type="button"
          onClick={() => setIsSortOpen(!isSortOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors shadow-2xs cursor-pointer"
        >
          <span>{sortBy}</span>
          <ChevronDown size={11} strokeWidth={2.2} className="text-zinc-400" />
        </button>

        {isSortOpen && (
          <div className="absolute right-0 top-full mt-1 w-32 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-1 z-30">
            {sortOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onSortChange?.(opt);
                  setIsSortOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sortBy === opt
                    ? 'bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-900 dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850/60'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
