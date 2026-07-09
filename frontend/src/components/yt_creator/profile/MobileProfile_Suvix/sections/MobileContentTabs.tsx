import React, { useState } from 'react';
import { Grid, PlaySquare, Film, MessageSquare, Play, Heart } from 'lucide-react';

const formatCount = (num?: number | string) => {
  if (!num) return '0';
  const n = Number(num);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
};

const timeAgo = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} days ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks} wks ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} mos ago`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} yrs ago`;
};

export const MobileContentTabs = ({ allVideos = [], ytVideos = [], reels = [], posts = [] }: { allVideos?: any[], ytVideos?: any[], reels?: any[], posts?: any[] }) => {
  const [activeTab, setActiveTab] = useState('yt_videos');

  const tabs = [
    { id: 'yt_videos', icon: PlaySquare, label: 'YT Videos' },
    { id: 'reels', icon: Film, label: 'Reels' },
    { id: 'posts', icon: Grid, label: 'Posts' },
    { id: 'yt_posts', icon: MessageSquare, label: 'YT Posts' }
  ];

  const renderContent = () => {
    if (activeTab === 'yt_videos') {
      if (allVideos.length === 0) {
        return (
          <div className="w-full py-20 flex flex-col items-center justify-center text-text-muted">
            <PlaySquare size={32} className="opacity-50 mb-3" />
            <p className="text-xs font-medium uppercase tracking-widest">No videos found</p>
          </div>
        );
      }

      const latestVideos = allVideos.slice(0, 2);
      const trendingVideos = allVideos.slice(2, 6);
      const remainingVideos = allVideos.slice(6);

      return (
        <div className="flex flex-col gap-6 py-4 w-full">
          {/* Section 1: Latest YouTube Videos */}
          {latestVideos.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-4">
                <h3 className="text-sm font-bold text-text-main">Latest YouTube Videos</h3>
                <button className="text-[10px] font-medium text-text-muted hover:text-text-main">View all {'>'}</button>
              </div>
              <div className="flex overflow-x-auto gap-3 px-4 pb-2 no-scrollbar w-full snap-x">
                {latestVideos.map((video, idx) => {
                  const title = video.title || video.snippet?.title || 'YouTube Video';
                  const thumbnail = video.thumbnail || video.thumbnail_url || video.img || video.videoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80';
                  const publishedAt = video.publishedAt || video.published_at || video.createdAt || video.created_at;
                  
                  return (
                    <div key={video.id || video._id || idx} className="shrink-0 w-[260px] flex flex-col gap-2 snap-center">
                      <div className="aspect-[16/9] bg-container rounded-xl overflow-hidden border border-border-main relative group">
                        <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full backdrop-blur-md">
                          <Play size={14} fill="white" className="text-white" />
                        </div>
                      </div>
                      <div className="flex flex-col px-0.5">
                        <h3 className="text-xs font-bold text-text-main line-clamp-2 leading-snug">{title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-medium text-text-muted">
                          <span>{formatCount(video.viewCount || video.view_count || 0)} views</span>
                          <span>•</span>
                          <span>{timeAgo(publishedAt) || 'Recently'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Trending on YouTube */}
          {trendingVideos.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-4">
                <h3 className="text-sm font-bold text-text-main">🔥 Trending</h3>
                <button className="text-[10px] font-medium text-text-muted hover:text-text-main">View all {'>'}</button>
              </div>
              <div className="flex overflow-x-auto gap-3 px-4 pb-2 no-scrollbar w-full snap-x">
                {trendingVideos.map((video, idx) => {
                  const title = video.title || video.snippet?.title || 'YouTube Video';
                  const thumbnail = video.thumbnail || video.thumbnail_url || video.img || video.videoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80';
                  const publishedAt = video.publishedAt || video.published_at || video.createdAt || video.created_at;
                  
                  return (
                    <div key={video.id || video._id || idx} className="shrink-0 w-[160px] flex flex-col gap-2 snap-center">
                      <div className="aspect-[16/9] bg-container rounded-xl overflow-hidden border border-border-main relative group">
                        <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col px-0.5">
                        <h3 className="text-[11px] font-bold text-text-main line-clamp-2 leading-snug">{title}</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-[9px] font-medium text-text-muted">
                          <span>{formatCount(video.viewCount || video.view_count || 0)} views</span>
                          <span>•</span>
                          <span>{timeAgo(publishedAt) || 'Recently'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: All Videos */}
          {remainingVideos.length > 0 && (
            <div className="flex flex-col gap-3 px-4">
              <h3 className="text-sm font-bold text-text-main mb-1">All Videos</h3>
              <div className="flex flex-col gap-4">
                {remainingVideos.map((video, idx) => {
                  const title = video.title || video.snippet?.title || 'YouTube Video';
                  const thumbnail = video.thumbnail || video.thumbnail_url || video.img || video.videoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80';
                  const publishedAt = video.publishedAt || video.published_at || video.createdAt || video.created_at;
                  
                  return (
                    <div key={video.id || video._id || idx} className="flex items-start gap-3 w-full">
                      <div className="relative w-[130px] shrink-0 aspect-[16/9] rounded-xl overflow-hidden bg-container border border-border-main">
                        <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col py-0.5 flex-1 min-w-0">
                        <h4 className="text-[11px] font-bold text-text-main line-clamp-2 leading-snug pr-2">{title}</h4>
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 text-[10px] font-medium text-text-muted">
                          <span>{formatCount(video.viewCount || video.view_count || 0)} views</span>
                          <span>•</span>
                          <span className="whitespace-nowrap">{timeAgo(publishedAt) || 'Recently'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'yt_posts') {
      const sourceData = ytVideos;
      const latestPosts = sourceData.slice(0, 5);
      const gridPosts = sourceData.slice(5);

      return (
        <div className="flex flex-col gap-5 py-4 w-full">
          {latestPosts.length > 0 && (
            <div className="flex overflow-x-auto gap-3 px-4 no-scrollbar w-full snap-x">
              {latestPosts.map((post, idx) => {
                const title = post.caption || post.comment || 'YouTube Post';
                const thumbnail = post.media?.url || post.img || post.videoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80';
                
                return (
                  <div key={post.id || post._id || idx} className="shrink-0 w-[240px] flex flex-col gap-2 snap-center">
                    <div className="aspect-video bg-container rounded-xl overflow-hidden border border-border-main relative group">
                      <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={24} fill="white" className="text-white" />
                      </div>
                    </div>
                    <div className="flex flex-col px-1">
                      <h3 className="text-[11px] font-bold text-text-main line-clamp-2 leading-tight">{title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-[10px] font-medium text-text-muted">
                        <span className="flex items-center gap-1"><Heart size={10} /> {formatCount(post.likes || 0)}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={10} /> {formatCount(post.commentsCount || 0)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {gridPosts.length > 0 && (
            <div className="grid grid-cols-2 gap-x-2 gap-y-4 px-4 mt-2">
              {gridPosts.map((post, idx) => {
                const title = post.caption || post.comment || 'YouTube Post';
                const thumbnail = post.media?.url || post.img || post.videoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80';
                
                return (
                  <div key={post.id || post._id || idx} className="flex flex-col gap-1.5 cursor-pointer group">
                    <div className="aspect-[4/5] bg-container rounded-xl overflow-hidden border border-border-main relative">
                      <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full backdrop-blur-md">
                        <Play size={12} fill="white" className="text-white" />
                      </div>
                    </div>
                    <div className="flex flex-col px-0.5 mt-0.5">
                      <h3 className="text-[10px] font-bold text-text-main line-clamp-2 leading-tight">{title}</h3>
                      <div className="flex items-center gap-3 mt-0.5 text-[9px] font-medium text-text-muted">
                        <span className="flex items-center gap-1"><Heart size={9} /> {formatCount(post.likes || 0)}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={9} /> {formatCount(post.commentsCount || 0)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {sourceData.length === 0 && (
            <div className="w-full py-20 flex flex-col items-center justify-center text-text-muted">
              <MessageSquare size={32} className="opacity-50 mb-3" />
              <p className="text-xs font-medium uppercase tracking-widest">No posts found</p>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'posts') {
      if (posts.length === 0) {
        return (
          <div className="w-full py-20 flex flex-col items-center justify-center text-text-muted">
            <Grid size={32} className="opacity-50 mb-3" />
            <p className="text-xs font-medium uppercase tracking-widest">No posts yet</p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-3 gap-0.5">
          {posts.map((post, idx) => (
            <div key={post.id || post._id || idx} className="aspect-square bg-container relative group cursor-pointer overflow-hidden">
               <img src={post.media?.url || post.img || post.videoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80'} alt="Post" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'reels') {
      if (reels.length === 0) {
        return (
          <div className="w-full py-20 flex flex-col items-center justify-center text-text-muted">
            <Film size={32} className="opacity-50 mb-3" />
            <p className="text-xs font-medium uppercase tracking-widest">No reels yet</p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-3 gap-0.5">
          {reels.map((reel, idx) => (
            <div key={reel.id || reel._id || idx} className="aspect-[9/16] bg-container relative group cursor-pointer overflow-hidden">
               <img src={reel.img || reel.videoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80'} alt="Reel" className="w-full h-full object-cover" />
               <div className="absolute bottom-2 left-2 p-1 bg-black/40 rounded-full backdrop-blur-sm">
                 <Play size={10} fill="white" className="text-white" />
               </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

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

      <div className="w-full min-h-[300px] bg-page pt-0.5">
        {renderContent()}
      </div>
    </div>
  );
};
