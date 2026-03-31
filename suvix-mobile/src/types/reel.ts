export interface Reel {
  _id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'video' | 'image';
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  createdAt: string;
  isLiked?: boolean;
  isFollowing?: boolean;
  latestLikers: {
    _id: string;
    name: string;
    profilePicture: string | null;
  }[];
  editor: {
    _id: string;
    name: string;
    profilePicture: string | null;
    role: string;
  };
}

export interface Ad {
  _id: string;
  type: 'ad';
  companyName: string;
  title: string;
  ctaText: string;
  websiteDisplay: string;
  mediaUrl?: string;
}

export type FeedItem = Reel | Ad;

export interface ReelFeedResponse {
  success: boolean;
  reels: Reel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
