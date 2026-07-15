export interface RealMedia {
  id: string;
  urls: {
    post?: string;
    full?: string;
    thumb?: string;
    video?: string;
    hls?: string;
    fallback?: string;
  };
  metadata?: {
    width?: number;
    height?: number;
  };
  width?: number;
  height?: number;
  duration?: number;
  blurhash?: string;
  thumbnailUrl?: string;
  status?: string;
}

export interface RealUser {
  id: string;
  username?: string;
  is_verified?: boolean;
  role?: string;
  profile?: {
    name?: string;
    profile_picture?: string;
  };
}

export interface RealYoutubeChannel {
  channel_name?: string;
  thumbnail_url?: string;
  custom_url?: string;
}

export interface RealPost {
  id: string;
  contentType: 'POST' | 'REEL' | 'YOUTUBE_POST' | 'POLL';
  caption?: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  user?: RealUser;
  youtube_channel?: RealYoutubeChannel;
  youtube_link?: string;
  media?: RealMedia[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  poll?: any;
  isLiked?: boolean;
}
