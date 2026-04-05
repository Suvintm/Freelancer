export interface ReelEditor {
  _id: string;
  name: string;
  profilePicture: string | null;
  role: 'editor' | 'client' | 'admin';
}

export interface Reel {
  _id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'video' | 'image';
  hlsUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  editor: ReelEditor;
  portfolio: {
    _id: string;
  };
  processingStatus: 'pending' | 'processing' | 'complete' | 'failed';
}

export interface ReelsResponse {
  success: boolean;
  reels: Reel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
