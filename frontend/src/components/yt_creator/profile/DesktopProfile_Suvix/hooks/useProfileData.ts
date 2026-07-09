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
    const fetchFeed = async () => {
      await Promise.resolve();
      if (!active || !user?.username) return;
      setIsLoadingFeed(true);
      try {
        const response = await api.get('/social/feed');
        if (response.data.success && active) {
          const creatorFeed = response.data.data.filter(
            (item: any) => item.user?.username === user.username
          );
          
          const mappedFeed = creatorFeed.map((item: any) => ({
            _id: item.id,
            id: item.id,
            user: item.user?.username,
            type: item.contentType === 'POST' ? 'post' : item.contentType === 'REEL' ? 'reel' : item.contentType === 'YOUTUBE_POST' ? 'yt_video' : 'poll',
            img: item.media?.[0]?.urls?.post || item.media?.[0]?.thumbnailUrl || item.media?.[0]?.url || '',
            images: item.media?.map((m: any) => m.urls?.post || m.thumbnailUrl || m.url || '') || [],
            comment: item.caption || '',
            likes: item.likes || 0,
            commentsCount: item.commentsCount || 0,
            videoUrl: item.media?.[0]?.urls?.hls || item.media?.[0]?.urls?.video || item.media?.[0]?.urls?.fallback || item.media?.[0]?.url || '',
            createdAt: item.created_at,
          }));

          setReels(mappedFeed.filter((item: any) => item.type === 'reel'));
          setPosts(mappedFeed.filter((item: any) => item.type === 'post'));
          setYtVideos(mappedFeed.filter((item: any) => item.type === 'yt_video'));
          setThumbnailVotes(mappedFeed.filter((item: any) => item.type === 'thumbnail_vote'));
        }
      } catch (err) {
        console.error('Failed to fetch real feed for profile:', err);
      } finally {
        if (active) {
          setIsLoadingFeed(false);
        }
      }
    };

    fetchFeed();
    return () => {
      active = false;
    };
  }, [user?.username]);

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
