/* eslint-disable @typescript-eslint/no-explicit-any */
 
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
      if (!active || !user?.username) return;
      setIsLoadingFeed(true);
      
      try {
        // 1. Fetch unified social feed (same as previous DesktopProfile)
        const socialFeedRes = await api.get('/social/feed').catch(() => null);
        if (socialFeedRes?.data?.success && active) {
          const rawItems = socialFeedRes.data.data || [];
          const creatorFeed = rawItems.filter(
            (item: any) => item.user?.username === user.username || item.userId === user.id
          );

          if (creatorFeed.length > 0) {
            const mappedFeed = creatorFeed.map((item: any) => ({
              _id: item.id,
              id: item.id,
              user: item.user?.username || user.username,
              type: item.contentType === 'POST' ? 'post' : item.contentType === 'REEL' ? 'reel' : item.contentType === 'YOUTUBE_POST' ? 'yt_video' : 'poll',
              img: item.media?.[0]?.urls?.post || item.media?.[0]?.thumbnailUrl || item.media?.[0]?.url || '',
              images: item.media?.map((m: any) => m.urls?.post || m.thumbnailUrl || m.url || '') || [],
              comment: item.caption || '',
              likes: item.likes || 0,
              commentsCount: item.commentsCount || 0,
              videoUrl: item.media?.[0]?.urls?.hls || item.media?.[0]?.urls?.video || item.media?.[0]?.urls?.fallback || item.media?.[0]?.url || '',
              createdAt: item.created_at || new Date().toISOString(),
            }));

            setReels(mappedFeed.filter((item: any) => item.type === 'reel'));
            setPosts(mappedFeed.filter((item: any) => item.type === 'post'));
            setYtVideos(mappedFeed.filter((item: any) => item.type === 'yt_video'));
            setThumbnailVotes(mappedFeed.filter((item: any) => item.type === 'poll' || item.type === 'thumbnail_vote'));
          }
        }

        // 2. Also attempt profile-specific endpoints for any dedicated items
        if (user?.id) {
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
            createdAt: item.createdAt || item.created_at || new Date().toISOString(),
          });

          if (reelsRes.status === 'fulfilled' && reelsRes.value?.data?.success && reelsRes.value.data.items?.length > 0) {
            setReels(reelsRes.value.data.items.map(formatItem));
          }
          if (postsRes.status === 'fulfilled' && postsRes.value?.data?.success && postsRes.value.data.items?.length > 0) {
            setPosts(postsRes.value.data.items.map(formatItem));
          }
          if (ytVideosRes.status === 'fulfilled' && ytVideosRes.value?.data?.success && ytVideosRes.value.data.items?.length > 0) {
            setYtVideos(ytVideosRes.value.data.items.map(formatItem));
          }
          if (pollsRes.status === 'fulfilled' && pollsRes.value?.data?.success && pollsRes.value.data.items?.length > 0) {
            setThumbnailVotes(pollsRes.value.data.items.map(formatItem));
          }
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
