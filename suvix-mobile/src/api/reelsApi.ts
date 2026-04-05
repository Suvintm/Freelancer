import { api } from './client';
import { ReelsResponse } from '../types/reel';

/**
 * REELS API CLIENT
 * High-performance discovery engine for mobile.
 */
export const reelsApi = {
  /**
   * Fetch discovery feed with pagination and session seeding.
   */
  fetchReelsFeed: async (
    page: number = 1,
    limit: number = 10,
    sort?: string
  ): Promise<ReelsResponse> => {
    const { data } = await api.get<ReelsResponse>('/reels/feed', {
      params: {
        page,
        limit,
        sort,
      },
    });
    return data;
  },

  /**
   * Toggle Like a Reel
   */
  toggleLike: async (reelId: string) => {
    const { data } = await api.post(`/reels/${reelId}/like`);
    return data;
  },

  /**
   * Record View (Deferred Analytics)
   */
  incrementView: async (reelId: string) => {
    const { data } = await api.post(`/reels/${reelId}/view`);
    return data;
  },
};
