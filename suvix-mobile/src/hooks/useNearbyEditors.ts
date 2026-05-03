import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { locationService } from '../services/locationService';
import { Editor } from '../types/editor';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5051/api';

/**
 * HOOK: useNearbyEditors
 * Fetches editors from the backend and applies 15km randomization logic.
 */
export const useNearbyEditors = (enabled: boolean = false) => {
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<boolean | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const initLocation = async () => {
      const coords = await locationService.getCurrentLocation();
      if (coords) {
        setUserLocation({ lat: coords.latitude, lng: coords.longitude });
        setPermissionStatus(true);
      } else {
        setPermissionStatus(false);
      }
    };
    initLocation();
  }, [enabled]);

  const query = useQuery({
    queryKey: ['nearby-editors', userLocation?.lat, userLocation?.lng],
    queryFn: async () => {
      if (!userLocation) return [];
      
      try {
        const { data } = await axios.get(`${API_URL}/location/nearby`, {
          params: {
            lat: userLocation.lat,
            lng: userLocation.lng,
            radius: 15, // 15km range
          },
        });

        const rawEditors = data.editors || [];

        // Apply fuzzing (randomization) to each editor's location
        return rawEditors.map((editor: any) => {
          const realLat = editor.location?.lat || userLocation.lat + (Math.random() - 0.5) * 0.1;
          const realLng = editor.location?.lng || userLocation.lng + (Math.random() - 0.5) * 0.1;

          return {
            ...editor,
            realLocation: { lat: realLat, lng: realLng },
            displayLocation: {
              lat: locationService.fuzzCoordinate(realLat, 2), // 2km fuzzing within the 15km zone
              lng: locationService.fuzzCoordinate(realLng, 2),
            },
          } as Editor;
        });
      } catch (e) {
        console.error('⚠️ [NearbyEditors] Fetch failed:', e);
        return [];
      }
    },
    enabled: !!userLocation,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  return {
    editors: query.data || [],
    isLoading: query.isLoading || (permissionStatus === null && !userLocation),
    userLocation,
    permissionStatus,
    refresh: query.refetch,
  };
};
