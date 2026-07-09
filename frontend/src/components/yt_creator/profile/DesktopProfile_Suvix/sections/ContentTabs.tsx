import React from 'react';
import { motion } from 'framer-motion';

interface ContentTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const ContentTabs = ({ activeTab, setActiveTab }: ContentTabsProps) => {
  const TABS = [
    { id: 'yt_posts', label: 'YT Posts' },
    { id: 'yt_videos', label: 'YT Videos' },
    { id: 'posts',    label: 'Posts' },
    { id: 'reels',    label: 'Reels' },
    { id: 'thumbnail_vote', label: 'Thumbnails' },
  ];

  return (
    <div className="mt-8 relative w-full border-b border-border-main">
      <div className="flex items-center gap-10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative pb-3 flex items-center transition-colors duration-300 ${activeTab === tab.id ? 'text-[#FF3040]' : 'text-text-muted hover:text-text-main'}`}
          >
            <span className="text-sm font-bold">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF3040] rounded-t-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
