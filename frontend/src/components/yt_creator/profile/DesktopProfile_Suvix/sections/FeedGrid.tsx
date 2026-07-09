/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { PlaySquare, Heart, MessageCircle, Trash2, MessageSquare, Play } from 'lucide-react';
import { api } from '../../../../../api/client';

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
  if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
};

interface FeedGridProps {
  activeTab: string;
  reels: any[];
  posts: any[];
  ytVideos: any[];
  
  isLoadingFeed: boolean;
  allVideos: any[];
}

export const FeedGrid = ({ activeTab, reels, posts, ytVideos, isLoadingFeed, allVideos }: FeedGridProps) => {

  const handleDeleteItem = async (id: string, type: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      let endpoint = '';
      if (type === 'post') endpoint = `/social/posts/${id}`;
      else if (type === 'reel') endpoint = `/social/reels/${id}`;
      else if (type === 'yt_video') endpoint = `/social/posts/youtube/${id}`;
      else endpoint = `/temp-feed/${id}`;

      await api.delete(endpoint);
      // To properly update, we'd need to trigger a refetch or pass down the setters.
      // For now, reload the window or rely on parent component's state update.
      window.location.reload();
    } catch (err) {
      console.error('Failed to delete feed item:', err);
    }
  };

  const renderEmptyState = (label: string, icon: React.ReactNode) => (
    <div className="w-full py-32 flex flex-col items-center justify-center border border-dashed border-border-main rounded-[24px] bg-page/50">
      <div className="text-zinc-300 mb-4">{icon}</div>
      <p className="text-sm font-bold text-text-muted uppercase tracking-widest">{label}</p>
    </div>
  );

  if (isLoadingFeed) {
    return (
      <div className="w-full py-20 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FF3040] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activeTab === 'reels') {
    if (reels.length === 0) return renderEmptyState('No reels uploaded yet', <PlaySquare size={48} />);
    return (
      <div className="grid grid-cols-3 gap-6">
        {reels.map((reel) => (
          <div key={reel._id} className="group relative aspect-[9/16] rounded-[24px] overflow-hidden bg-container border border-border-main cursor-pointer shadow-sm hover:shadow-md transition-all duration-300">
            <img src={reel.img || reel.videoUrl} alt="Reel" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
              <div className="flex justify-end">
                <button onClick={(e) => handleDeleteItem(reel._id, 'reel', e)} className="p-2 bg-card/20 hover:bg-[#FF3040] rounded-full text-white backdrop-blur-md transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex flex-col gap-1.5 text-white">
                <p className="text-sm font-bold line-clamp-2">{reel.comment}</p>
                <div className="flex items-center gap-4 text-xs font-black">
                  <span className="flex items-center gap-1"><Heart size={14} fill="white" /> {reel.likes || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={14} fill="white" /> {reel.commentsCount || 0}</span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 p-2 bg-card/20 backdrop-blur-md border border-white/20 rounded-full text-white group-hover:scale-110 transition-transform duration-300">
              <PlaySquare size={16} fill="white" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'posts') {
    if (posts.length === 0) return renderEmptyState('No posts available', <MessageSquare size={48} />);
    return (
      <div className="grid grid-cols-3 gap-6">
        {posts.map((post) => (
          <div key={post.id || post._id} className="group flex flex-col gap-3 cursor-pointer">
            <div className="relative aspect-square rounded-[20px] overflow-hidden bg-container border border-border-main">
              <img src={post.media?.url || post.img || post.videoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80'} alt="Post" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="flex flex-col gap-1 px-1">
              <h4 className="text-sm font-bold text-text-main line-clamp-2 leading-snug group-hover:text-[#FF3040] transition-colors">{post.caption || post.comment || "Post"}</h4>
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1.5 text-xs font-bold text-text-muted"><Heart size={14} /> {post.likes || 0}</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-text-muted"><MessageCircle size={14} /> {post.commentsCount || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'yt_posts') {
    if (ytVideos.length === 0) return renderEmptyState('No YouTube posts available', <MessageSquare size={48} />);
    return (
      <div className="grid grid-cols-3 gap-6">
        {ytVideos.map((post) => (
          <div key={post.id || post._id} className="group flex flex-col gap-3 cursor-pointer">
            <div className="relative aspect-video rounded-[20px] overflow-hidden bg-container border border-border-main">
              <img src={post.media?.url || post.img || post.videoUrl} alt="Post" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="flex flex-col gap-1 px-1">
              <h4 className="text-sm font-bold text-text-main line-clamp-2 leading-snug group-hover:text-[#FF3040] transition-colors">{post.caption || post.comment || "YouTube Post"}</h4>
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1.5 text-xs font-bold text-text-muted"><Heart size={14} /> {post.likes || 0}</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-text-muted"><MessageCircle size={14} /> {post.commentsCount || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'yt_videos') {
    if (allVideos.length === 0) return renderEmptyState('No YouTube videos available', <Play size={48} />);
    
    const latestVideos = allVideos.slice(0, 2);
    const trendingVideos = allVideos.slice(2, 6);
    const remainingVideos = allVideos.slice(6);

    return (
      <div className="flex flex-col gap-10 w-full">
        {/* Section 1: Latest YouTube Videos */}
        {latestVideos.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-main">Latest YouTube Videos</h3>
              <button className="text-sm font-medium text-text-muted hover:text-text-main transition-colors">View all {'>'}</button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {latestVideos.map((video) => {
                const title = video.title || video.snippet?.title || 'YouTube Video';
                const thumbnail = video.thumbnail || video.thumbnail_url || video.img || video.videoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80';
                const publishedAt = video.publishedAt || video.published_at || video.createdAt || video.created_at;
                
                return (
                  <div key={video.id || video._id} className="group flex flex-col gap-3 cursor-pointer">
                    <div className="relative aspect-[16/9] rounded-[20px] overflow-hidden bg-container border border-border-main">
                      <img src={thumbnail} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="flex flex-col gap-1.5 px-1 relative">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-base font-bold text-text-main line-clamp-2 leading-snug group-hover:text-[#FF3040] transition-colors">{title}</h4>
                        <button className="text-text-muted hover:text-text-main px-1">⋮</button>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-main">🔥 Trending on YouTube</h3>
              <button className="text-sm font-medium text-text-muted hover:text-text-main transition-colors">View all {'>'}</button>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x">
              {trendingVideos.map((video) => {
                const title = video.title || video.snippet?.title || 'YouTube Video';
                const thumbnail = video.thumbnail || video.thumbnail_url || video.img || video.videoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80';
                const publishedAt = video.publishedAt || video.published_at || video.createdAt || video.created_at;
                
                return (
                  <div key={video.id || video._id} className="shrink-0 w-[280px] group flex flex-col gap-3 cursor-pointer snap-start">
                    <div className="relative aspect-[16/9] rounded-[20px] overflow-hidden bg-container border border-border-main">
                      <img src={thumbnail} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="flex flex-col gap-1 px-1 relative">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-text-main line-clamp-2 leading-snug group-hover:text-[#FF3040] transition-colors">{title}</h4>
                        <button className="text-text-muted hover:text-text-main shrink-0">⋮</button>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
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
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-text-main">All Videos</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              {remainingVideos.map((video) => {
                const title = video.title || video.snippet?.title || 'YouTube Video';
                const thumbnail = video.thumbnail || video.thumbnail_url || video.img || video.videoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80';
                const publishedAt = video.publishedAt || video.published_at || video.createdAt || video.created_at;
                const description = video.description || video.snippet?.description || 'Watch this amazing video to learn more.';

                return (
                  <div key={video.id || video._id} className="group flex items-start gap-4 cursor-pointer">
                    <div className="relative w-[180px] shrink-0 aspect-[16/9] rounded-[12px] overflow-hidden bg-container border border-border-main">
                      <img src={thumbnail} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="flex flex-col flex-1 py-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-text-main line-clamp-2 leading-snug group-hover:text-[#FF3040] transition-colors">{title}</h4>
                        <button className="text-text-muted hover:text-text-main shrink-0">⋮</button>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted mt-1.5">
                        <span>{formatCount(video.viewCount || video.view_count || 0)} views</span>
                        <span>•</span>
                        <span>{timeAgo(publishedAt) || 'Recently'}</span>
                      </div>
                      <p className="text-xs text-text-muted mt-2.5 line-clamp-2 pr-4">{description}</p>
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

  return renderEmptyState(`No ${activeTab.replace('_', ' ')} found`, <PlaySquare size={48} />);
};
