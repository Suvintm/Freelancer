import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../../store/slices/authSlice';
import { api } from '../../../../../api/client';
import { useQuery } from '@tanstack/react-query';

export const useProfileData = () => {
  const user = useSelector(selectUser);
  const [activeTab, setActiveTab] = useState('yt_posts');
  const [reels, setReels] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [ytVideos, setYtVideos] = useState<any[]>([]);
  const [thumbnailVotes, setThumbnailVotes] = useState<any[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  useEffect(() => {
    let active = true;
    
    const fetchProfileContent = async () => {
      if (!active || !user?.id) return;
      setIsLoadingFeed(true);
      
      try {
        const [reelsRes, postsRes, ytVideosRes, pollsRes] = await Promise.allSettled([
          api.get(`/profile/${user.id}/reels`),
          api.get(`/profile/${user.id}/posts`),
          api.get(`/profile/${user.id}/youtube-posts`),
          api.get(`/profile/${user.id}/polls`)
        ]);

        if (!active) return;

        const formatItem = (item: any) => ({
          _id: item.id,
          id: item.id,
          user: item.author?.username || user.username,
          type: item.type === 'POST' ? 'post' : item.type === 'REEL' ? 'reel' : item.type === 'YOUTUBE_POST' ? 'yt_video' : 'poll',
          img: item.media?.urls?.post || item.media?.thumbnailUrl || item.media?.urls?.thumb || '',
          images: item.media ? [item.media.urls?.post || item.media.thumbnailUrl || item.media.urls?.thumb || ''] : [],
          comment: item.caption || '',
          likes: item.likes || item.like_count || 0,
          commentsCount: item.commentsCount || 0,
          videoUrl: item.media?.urls?.hls || item.media?.urls?.video || item.media?.urls?.fallback || '',
          createdAt: item.createdAt || item.created_at,
        });

        if (reelsRes.status === 'fulfilled' && reelsRes.value.data.success) {
          setReels(reelsRes.value.data.items.map(formatItem));
        }
        
        if (postsRes.status === 'fulfilled' && postsRes.value.data.success) {
          setPosts(postsRes.value.data.items.map(formatItem));
        }

        if (ytVideosRes.status === 'fulfilled' && ytVideosRes.value.data.success) {
          setYtVideos(ytVideosRes.value.data.items.map(formatItem));
        }

        if (pollsRes.status === 'fulfilled' && pollsRes.value.data.success) {
          setThumbnailVotes(pollsRes.value.data.items.map(formatItem));
        }

      } catch (err) {
        console.error('Failed to fetch profile content:', err);
      } finally {
        if (active) {
          setIsLoadingFeed(false);
        }
      }
    };

    fetchProfileContent();
    
    return () => {
      active = false;
    };
  }, [user?.id, user?.username]);

  const { data: videosData } = useQuery<any[]>({
    queryKey: ['youtube-videos', user?.id],
    queryFn: async () => {
      const response = await api.get(`/youtube-creator/videos/${user?.id}`);
      return response.data?.success ? response.data.data : [];
    },
    enabled: !!user?.id,
  });

  return {
    user,
    activeTab,
    setActiveTab,
    reels,
    setReels,
    posts,
    setPosts,
    ytVideos,
    setYtVideos,
    thumbnailVotes,
    setThumbnailVotes,
    isLoadingFeed,
    allVideos: videosData || []
  };
};
