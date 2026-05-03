import { useState, useEffect } from 'react';
import { locationService } from '../services/locationService';
import { Editor } from '../types/editor';

/**
 * HOOK: useNearbyEditors (MOCK MODE)
 * Generates talent near the user's location for UI demonstration.
 */
export const useNearbyEditors = (enabled: boolean = false) => {
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const initLocation = async () => {
      setIsLoading(true);
      const coords = await locationService.getCurrentLocation();
      if (coords) {
        const uLat = coords.latitude;
        const uLng = coords.longitude;
        setUserLocation({ lat: uLat, lng: uLng });

        // Generate 12-15 Mock Editors in a 15km radius
        const names = ["Aarav", "Priya", "Ishaan", "Ananya", "Vikram", "Saira", "Rohan", "Meera", "Arjun", "Aditi", "Kabir", "Zara"];
        const categories = ["Video Editor", "VFX Artist", "Content Creator", "Cinematographer"];
        
        const mockEditors: Editor[] = names.map((name, i) => {
          // Spread them out within ~10km (0.1 decimal degrees is roughly 11km)
          const latOffset = (Math.random() - 0.5) * 0.15;
          const lngOffset = (Math.random() - 0.5) * 0.15;
          
          const realLat = uLat + latOffset;
          const realLng = uLng + lngOffset;

          return {
            _id: `mock_${i}`,
            username: name.toLowerCase() + (i + 1),
            displayName: name,
            profilePicture: `https://i.pravatar.cc/150?u=${name}`,
            category: { name: categories[i % categories.length] },
            isOnline: Math.random() > 0.4,
            realLocation: { lat: realLat, lng: realLng },
            displayLocation: {
              lat: realLat,
              lng: realLng,
            },
          } as Editor;
        });

        setEditors(mockEditors);
      }
      setIsLoading(false);
    };

    initLocation();
  }, [enabled]);

  return {
    editors,
    isLoading,
    userLocation,
    refresh: () => {},
  };
};
