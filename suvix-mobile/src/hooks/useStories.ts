import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSocketStore } from '../store/useSocketStore';
import { storyApi } from '../api/storyApi';
import { DrawPath, CanvasBg, StoryObject } from '../modules/story/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StorySlideMetadata {
  objects?:      StoryObject[];
  drawPaths?:    DrawPath[];
  canvasBg?:     CanvasBg;
  canvasWidth?:  number;
  canvasHeight?: number;
}

export interface StorySlide {
  id:              string;
  image:           string;       // CDN URL — HLS for video, WebP for image
  thumb:           string | null;
  type:            'IMAGE' | 'VIDEO';
  durationMs:      number;
  caption:         string | null;
  isSeen?:         boolean;
  metadata:        StorySlideMetadata;
  // Canvas dimensions for overlay coordinate scaling
  canvas_width?:   number | null;
  canvas_height?:  number | null;
  blurhash?:       string | null;
  created_at:      string;
}

export interface StoryItem {
  _id:            string;   // userId of story group author
  userId:         string;
  username:       string;
  avatar:         string | null;
  isUserStory:    boolean;
  hasActiveStory: boolean;
  isSeen:         boolean;
  verifiedColor?: string;
  slides:         StorySlide[];
}

export const STORIES_QUERY_KEY = ['stories', 'active'] as const;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useStories = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient         = useQueryClient();
  const { socket }          = useSocketStore();

  // Invalidate feed when BullMQ worker emits story:status = READY
  useEffect(() => {
    if (!socket) return;
    const refresh = () => queryClient.invalidateQueries({ queryKey: STORIES_QUERY_KEY });
    const onStatus = (d: { status: string }) => { if (d.status === 'READY') refresh(); };

    socket.on('story:status', onStatus);
    socket.on('story:ready',  refresh);
    return () => {
      socket.off('story:status', onStatus);
      socket.off('story:ready',  refresh);
    };
  }, [socket, queryClient]);

  const query = useQuery<StoryItem[]>({
    queryKey: STORIES_QUERY_KEY,
    queryFn:  async () => {
      const raw = await storyApi.getActiveStories();
      // Backend already groups by userId with the correct shape.
      // We just normalize defaults here.
      return (raw as any[]).map(group => ({
        ...group,
        isSeen: group.isSeen ?? group.slides?.every((s: any) => s.isSeen) ?? false,
        slides: (group.slides ?? []).map((slide: any) => ({
          ...slide,
          metadata:   slide.metadata   ?? {},
          durationMs: slide.durationMs ?? (slide.type === 'VIDEO' ? 15_000 : 5_000),
          isSeen:     slide.isSeen     ?? false,
        })),
      })) as StoryItem[];
    },
    enabled:         !!isAuthenticated,
    staleTime:       30_000,       // 30s — matches server Redis TTL
    refetchInterval: 2 * 60_000,  // Refetch every 2 min for natural expiry
    placeholderData: [],
  });

  return {
    data:           query.data    ?? [],
    isLoading:      query.isLoading,
    isFallbackData: query.isPlaceholderData,
    refetch:        query.refetch,
  };
};

// ─── Optimistic view helper ───────────────────────────────────────────────────

export const markSlideSeenOptimistic = (
  queryClient: ReturnType<typeof useQueryClient>,
  slideId: string,
) => {
  queryClient.setQueryData<StoryItem[]>(STORIES_QUERY_KEY, old => {
    if (!old) return old;
    return old.map(group => ({
      ...group,
      slides: group.slides.map(s =>
        s.id === slideId ? { ...s, isSeen: true } : s,
      ),
      isSeen: group.slides
        .map(s => (s.id === slideId ? { ...s, isSeen: true } : s))
        .every(s => s.isSeen),
    }));
  });
};
