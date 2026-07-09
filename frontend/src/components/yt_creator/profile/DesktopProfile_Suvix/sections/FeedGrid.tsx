import React from 'react';
import { PlaySquare, Heart, MessageCircle, Trash2, Eye, ThumbsUp, MessageSquare, Play } from 'lucide-react';
import { api } from '../../../../../api/client';

const formatCount = (num?: number | string) => {
  if (!num) return '0';
  const n = Number(num);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
};

interface FeedGridProps {
  activeTab: string;
  reels: any[];
  posts: any[];
  ytVideos: any[];
  thumbnailVotes: any[];
  isLoadingFeed: boolean;
  allVideos: any[];
}

export const FeedGrid = ({ activeTab, reels, posts, ytVideos, thumbnailVotes, isLoadingFeed, allVideos }: FeedGridProps) => {

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

  if (activeTab === 'yt_videos') {
    if (ytVideos.length === 0) return renderEmptyState('No YouTube videos available', <Play size={48} />);
    return (
      <div className="grid grid-cols-3 gap-6">
        {ytVideos.map((video) => (
          <div key={video._id} className="group flex flex-col gap-3 cursor-pointer">
            <div className="relative aspect-video rounded-[20px] overflow-hidden bg-container border border-border-main">
              <img src={video.img || video.videoUrl} alt="Video" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="flex flex-col gap-1 px-1">
              <h4 className="text-sm font-bold text-text-main line-clamp-2 leading-snug group-hover:text-[#FF3040] transition-colors">{video.comment || "YouTube Video"}</h4>
              <div className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1.5 text-xs font-bold text-text-muted"><Heart size={14} /> {video.likes || 0}</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-text-muted"><MessageCircle size={14} /> {video.commentsCount || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return renderEmptyState(`No ${activeTab.replace('_', ' ')} found`, <PlaySquare size={48} />);
};
