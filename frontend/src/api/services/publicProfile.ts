import { api as apiClient } from '../client';

export interface PublicProfileBlock {
  id: string;
  type: 'LINK' | 'YOUTUBE_CHANNEL' | 'INSTAGRAM_PROFILE' | 'TEXT' | 'IMAGE';
  title: string;
  url?: string;
  image_url?: string;
  content?: string;
  order_index: number;
}

export interface PublicProfile {
  id: string;
  theme: string;
  user: {
    username: string;
    profile: {
      name: string;
      profile_picture: string | null;
      bio: string | null;
    }
  };
  blocks: PublicProfileBlock[];
}

export const getPublicProfile = async (username: string): Promise<PublicProfile> => {
  const response = await apiClient.get(`/public-profile/${username}`);
  return response.data.data;
};

export const recordBlockClick = async (profileId: string, blockId: string): Promise<void> => {
  await apiClient.post('/public-profile/analytics/click', {
    profileId,
    blockId
  });
};
