import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { InteractiveGallery } from '../../src/modules/shared/content/InteractiveGallery';

/**
 * 🎬 REEL FEED SCREEN
 * 
 * Vertical snapping feed for viewing user reels.
 * Unified with the centralized SuviX Gallery Engine.
 */
export default function ReelFeedScreen() {
  const { userId, initialIndex } = useLocalSearchParams();
  
  return (
    <InteractiveGallery 
      userId={userId as string} 
      mode="REELS"
      initialIndex={initialIndex ? parseInt(initialIndex as string) : 0}
    />
  );
}
