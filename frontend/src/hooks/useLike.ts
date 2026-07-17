import { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';

// Global maps to track timers and queues across React re-renders and Strict Mode unmounts
const globalLikeTimers = new Map<string, ReturnType<typeof setTimeout>>();

interface UseLikeOptions {
  postId: string;
  contentType: 'POST' | 'REEL' | 'YOUTUBE_POST' | 'POLL';
  initialLiked: boolean;
  initialCount: number;
}

interface LikeState {
  likedByMe: boolean;
  likeCount: number;
  isAnimating: boolean;
  isSyncing: boolean;
  isLocked: boolean;
  lockTimeLeft: number;
}

export function useLike({ postId, contentType, initialLiked, initialCount }: UseLikeOptions) {
  const [state, setState] = useState<LikeState>({
    likedByMe: initialLiked,
    likeCount: initialCount,
    isAnimating: false,
    isSyncing: false,
    isLocked: false,
    lockTimeLeft: 0,
  });

  const pendingActions = useRef<Array<'like' | 'unlike'>>([]);
  const isProcessing = useRef(false);

  // Sync logic that actually calls the API
  const syncToServer = async () => {
    if (isProcessing.current || pendingActions.current.length === 0) return;
    
    isProcessing.current = true;
    const actions = [...pendingActions.current];
    pendingActions.current = []; // clear queue immediately
    
    const finalAction = actions[actions.length - 1];
    const shouldLike = finalAction === 'like';

    setState(prev => ({ ...prev, isSyncing: true }));

    try {
      let endpointType = 'posts';
      if (contentType === 'REEL') endpointType = 'reels';
      if (contentType === 'YOUTUBE_POST') endpointType = 'posts/youtube';
      if (contentType === 'POLL') endpointType = 'polls';

      const response = await api.post(`/social/${endpointType}/${postId}/like`, { action: shouldLike ? 'like' : 'unlike' });
      
      setState(prev => ({
        ...prev,
        likedByMe: response.data.isLiked,
        // Optional: trust server count if provided, otherwise keep optimistic
        // likeCount: response.data.count ?? prev.likeCount,
        isSyncing: false,
      }));
    } catch (error: unknown) {
      console.error('Like sync failed:', error);
      const err = error as { response?: { status?: number } };
      // Rollback on error by fetching real state or dispatching error
      setState(prev => ({ 
        ...prev, 
        likedByMe: !shouldLike, // Revert to the opposite of what we tried to do
        likeCount: shouldLike ? Math.max(0, prev.likeCount - 1) : prev.likeCount + 1, // Revert count
        isSyncing: false 
      }));
      
      if (err.response?.status === 429) {
         setState(prev => ({ ...prev, isLocked: true, lockTimeLeft: 60 }));
      }
    } finally {
      isProcessing.current = false;
      // If actions piled up while we were syncing, run again
      if (pendingActions.current.length > 0) {
        syncToServer();
      }
    }
  };

  // Debounced wrapper using global map to survive React re-renders/unmounts
  const debouncedSync = () => {
    const existingTimer = globalLikeTimers.get(postId);
    if (existingTimer) clearTimeout(existingTimer);
    
    const newTimer = setTimeout(() => {
      globalLikeTimers.delete(postId);
      syncToServer();
    }, 500); // 500ms debounce to be extra safe against spam
    
    globalLikeTimers.set(postId, newTimer);
  };

  // Main UI action
  const toggleLike = () => {
    if (state.isLocked) return;
    
    // 1. Determine what the next state SHOULD be
    const currentOptimisticLiked = pendingActions.current.length > 0 
        ? pendingActions.current[pendingActions.current.length - 1] === 'like'
        : state.likedByMe;
    
    const nextLiked = !currentOptimisticLiked;
    
    // 2. Queue the side effect
    pendingActions.current.push(nextLiked ? 'like' : 'unlike');
    debouncedSync();
    
    // 3. Update the UI
    setState(prev => ({
        ...prev,
        likedByMe: nextLiked,
        likeCount: Math.max(0, prev.likeCount + (nextLiked ? 1 : -1)),
        isAnimating: nextLiked,
    }));
  };

  // Clear animation flag automatically
  useEffect(() => {
    if (!state.isAnimating) return;
    const timer = setTimeout(() => {
      setState(prev => ({ ...prev, isAnimating: false }));
    }, 600);
    return () => clearTimeout(timer);
  }, [state.isAnimating]);

  // Rate Limit Countdown Timer
  useEffect(() => {
    if (!state.isLocked) return;
    
    const timer = setInterval(() => {
      setState(prev => {
        if (prev.lockTimeLeft <= 1) {
          clearInterval(timer);
          return { ...prev, isLocked: false, lockTimeLeft: 0 };
        }
        return { ...prev, lockTimeLeft: prev.lockTimeLeft - 1 };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [state.isLocked]);

  // We do NOT use an unmount effect to sync anymore, because the global timer
  // will continue to run even if this component unmounts, ensuring the like is saved!

  return {
    ...state,
    toggleLike,
    triggerLike: () => {
      if (state.isLocked) return;
      const currentOptimisticLiked = pendingActions.current.length > 0 
          ? pendingActions.current[pendingActions.current.length - 1] === 'like'
          : state.likedByMe;

      if (!currentOptimisticLiked) {
        pendingActions.current.push('like');
        debouncedSync();
        setState(prev => ({
          ...prev,
          likedByMe: true,
          likeCount: prev.likeCount + 1,
          isAnimating: true,
        }));
      } else {
        // Just animate
        setState(prev => ({
          ...prev,
          isAnimating: true,
        }));
      }
    }
  };
}
