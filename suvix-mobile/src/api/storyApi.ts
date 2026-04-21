import { api } from './client';

export interface UploadTicket {
  uploadUrl:   string;
  storageKey:  string;
}

export interface CreateStoryPayload {
  storageKey:       string;
  mimeType:         string;
  width?:           number;
  height?:          number;
  duration?:        number;
  displayDuration?: number;
  caption?:         string | null;
  metadata?: {
    canvasWidth:   number;
    canvasHeight:  number;
    canvasBg?:     any;
    objects?:      any[];
    drawPaths?:    any[];
  };
}

export const storyApi = {
  getUploadTicket: async (mimeType: string): Promise<UploadTicket> => {
    const res = await api.get('/social/stories/upload-url', { params: { mimeType } });
    if (!res.data.success) throw new Error('Failed to get upload ticket');
    return res.data.data as UploadTicket;
  },

  createStory: async (payload: CreateStoryPayload) => {
    const res = await api.post('/social/stories', payload);
    if (!res.data.success) throw new Error('Failed to create story');
    return res.data.data;
  },

  getActiveStories: async () => {
    const res = await api.get('/social/stories/active');
    if (!res.data.success) throw new Error('Failed to fetch stories');
    return res.data.data;
  },

  // Fire-and-forget — never surfaces errors to the user
  recordStoryView: async (storyId: string): Promise<void> => {
    try {
      await api.post(`/social/stories/${storyId}/view`);
    } catch { /* non-critical */ }
  },

  deleteStory: async (storyId: string) => {
    const res = await api.delete(`/social/stories/${storyId}`);
    if (!res.data.success) throw new Error(res.data.message ?? 'Failed to delete story');
    return res.data;
  },
};

export default storyApi;
