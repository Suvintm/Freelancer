import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { InteractiveGallery } from '../../src/modules/shared/content/InteractiveGallery';

/**
 * 🖼️ PREMIUM INTERACTIVE GALLERY
 * 
 * Vertical snapping gallery for viewing user posts.
 * Unified with the centralized SuviX Gallery Engine.
 */
export default function GalleryScreen() {
  const { userId, initialIndex } = useLocalSearchParams();
  
  return (
    <InteractiveGallery 
      userId={userId as string} 
      mode="ALL" 
      initialIndex={initialIndex ? parseInt(initialIndex as string) : 0} 
    />
  );
}
