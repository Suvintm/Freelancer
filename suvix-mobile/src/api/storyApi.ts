import { api } from './client';

/**
 * 🎬 STORY API SERVICE
 */

export interface StoryApiResponse {
  success: boolean;
  data: any[];
}

export const storyApi = {
  /**
   * Fetch active stories grouped by user for the Home Bar
   */
  getActiveStories: async () => {
    const response = await api.get<StoryApiResponse>('/social/stories/active');
    return response.data;
  },

  /**
   * Record a view for a specific story slide
   */
  recordStoryView: async (storyId: string) => {
    const response = await api.post(`/social/stories/${storyId}/view`);
    return response.data;
  },

  /**
   * Permanently delete a story
   */
  deleteStory: async (storyId: string) => {
    const response = await api.delete(`/social/stories/${storyId}`);
    return response.data;
  }
};
