import React, { useState } from 'react';
import { Grid, PlaySquare, Film, MessageSquare, Play } from 'lucide-react';

const formatCount = (num?: number | string) => {
  if (!num) return '0';
  const n = Number(num);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
};

export const MobileContentTabs = ({ allVideos = [], ytVideos = [] }: { allVideos?: any[], ytVideos?: any[] }) => {
  const [activeTab, setActiveTab] = useState('yt_videos');

  const tabs = [
    { id: 'yt_videos', icon: PlaySquare, label: 'YT Videos' },
    { id: 'reels', icon: Film, label: 'Reels' },
    { id: 'posts', icon: Grid, label: 'Posts' },
    { id: 'yt_posts', icon: MessageSquare, label: 'YT Posts' }
  ];

  const latestVideos = ytVideos.slice(0, 5);
  const gridVideos = ytVideos.slice(5);

  return (
    <div className="flex flex-col w-full mt-4">
      {/* Tabs Header */}
      <div className="flex items-center w-full border-t border-border-main">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex justify-center items-center h-12 relative transition-colors ${
                isActive ? 'text-text-main' : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute top-0 left-0 w-full h-[1.5px] bg-text-main" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tabs Content */}
      <div className="w-full min-h-[300px] bg-page pt-0.5">
        {activeTab === 'yt_videos' ? (
          <div className="flex flex-col gap-5 py-4 w-full">
            {/* Top Carousel (Latest Videos) */}
            {latestVideos.length > 0 && (
              <div className="flex overflow-x-auto gap-3 px-4 no-scrollbar w-full snap-x">
                {latestVideos.map((video, idx) => {
                  const title = video.comment || video.title || video.snippet?.title || 'YouTube Video';
                  const thumbnail = video.img || video.videoUrl || video.thumbnail || video.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80';
                  
                  return (
                    <div key={idx} className="shrink-0 w-[240px] flex flex-col gap-2 snap-center">
                      <div className="aspect-video bg-container rounded-xl overflow-hidden border border-border-main relative group">
                        <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={24} fill="white" className="text-white" />
                        </div>
                      </div>
                      <div className="flex flex-col px-1">
                        <h3 className="text-[11px] font-bold text-text-main line-clamp-2 leading-tight">{title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-[10px] font-medium text-text-muted">
                          <span className="flex items-center gap-1"><Heart size={10} /> {formatCount(video.likes || 0)}</span>
                          <span className="flex items-center gap-1"><MessageSquare size={10} /> {formatCount(video.commentsCount || 0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Grid (Older Videos) */}
            {gridVideos.length > 0 && (
              <div className="grid grid-cols-2 gap-x-2 gap-y-4 px-4 mt-2">
                {gridVideos.map((video, idx) => {
                  const title = video.comment || video.title || video.snippet?.title || 'YouTube Video';
                  const thumbnail = video.img || video.videoUrl || video.thumbnail || video.thumbnail_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80';
                  
                  return (
                    <div key={idx} className="flex flex-col gap-1.5 cursor-pointer group">
                      <div className="aspect-[4/5] bg-container rounded-xl overflow-hidden border border-border-main relative">
                        <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full backdrop-blur-md">
                          <Play size={12} fill="white" className="text-white" />
                        </div>
                      </div>
                      <div className="flex flex-col px-0.5 mt-0.5">
                        <h3 className="text-[10px] font-bold text-text-main line-clamp-2 leading-tight">{title}</h3>
                        <div className="flex items-center gap-3 mt-0.5 text-[9px] font-medium text-text-muted">
                          <span className="flex items-center gap-1"><Heart size={9} /> {formatCount(video.likes || 0)}</span>
                          <span className="flex items-center gap-1"><MessageSquare size={9} /> {formatCount(video.commentsCount || 0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {ytVideos.length === 0 && (
              <div className="w-full py-20 flex flex-col items-center justify-center text-text-muted">
                <PlaySquare size={32} className="opacity-50 mb-3" />
                <p className="text-xs font-medium uppercase tracking-widest">No videos found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-square bg-container border border-border-main/50 relative group cursor-pointer overflow-hidden">
                 <img src={`https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80`} alt="Grid item" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
