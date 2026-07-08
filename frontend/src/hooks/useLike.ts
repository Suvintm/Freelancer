import { useState, useRef, useCallback, useEffect } from 'react';
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
}

export function useLike({ postId, contentType, initialLiked, initialCount }: UseLikeOptions) {
  const [state, setState] = useState<LikeState>({
    likedByMe: initialLiked,
    likeCount: initialCount,
    isAnimating: false,
    isSyncing: false,
  });

  const pendingActions = useRef<Array<'like' | 'unlike'>>([]);
  const isProcessing = useRef(false);

  // Sync logic that actually calls the API
  const syncToServer = useCallback(async () => {
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
    } catch (error) {
      console.error("Failed to sync like:", error);
      // Clear queue on failure to prevent cascading confusion
      pendingActions.current = [];
      setState(prev => ({
        ...prev,
        likedByMe: !shouldLike, // Revert to opposite of what failed
        likeCount: Math.max(0, prev.likeCount + (shouldLike ? -1 : 1)),
        isSyncing: false,
      }));
    } finally {
      isProcessing.current = false;
      // If actions piled up while we were syncing, run again
      if (pendingActions.current.length > 0) {
        syncToServer();
      }
    }
  }, [postId, contentType]);

  // Debounced wrapper using global map to survive React re-renders/unmounts
  const debouncedSync = useCallback(() => {
    const existingTimer = globalLikeTimers.get(postId);
    if (existingTimer) clearTimeout(existingTimer);
    
    const newTimer = setTimeout(() => {
      globalLikeTimers.delete(postId);
      syncToServer();
    }, 500); // 500ms debounce to be extra safe against spam
    
    globalLikeTimers.set(postId, newTimer);
  }, [postId, syncToServer]);

  // Main UI action
  const toggleLike = useCallback(() => {
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
  }, [state.likedByMe, debouncedSync]);

  // Clear animation flag automatically
  useEffect(() => {
    if (!state.isAnimating) return;
    const timer = setTimeout(() => {
      setState(prev => ({ ...prev, isAnimating: false }));
    }, 600);
    return () => clearTimeout(timer);
  }, [state.isAnimating]);

  // We do NOT use an unmount effect to sync anymore, because the global timer
  // will continue to run even if this component unmounts, ensuring the like is saved!

  return {
    ...state,
    toggleLike,
    // Provide a specific trigger for double tap that guarantees we don't accidentally unlike
    triggerLike: useCallback(() => {
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
    }, [state.likedByMe, debouncedSync])
  };
}
