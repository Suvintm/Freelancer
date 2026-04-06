import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const BACKEND_URL = 'https://suvix-server.onrender.com';

export interface Expert {
  _id: string;
  name: string;
  profilePicture: any;
  distance: string;
  isOnline: boolean;
  skills: string[];
  ratingStats: {
    averageRating: number;
    totalReviews: number;
  };
  approxLocation?: {
    lat: number;
    lng: number;
  };
}

/**
 * useNearbyExperts - Hardened Version
 * This hook is designed to NEVER crash the app even if expo-location is missing.
 * It uses dynamic requires to isolate the native module.
 */
export const useNearbyExperts = () => {
  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [isModuleAvailable, setIsModuleAvailable] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        // --- ISOLATION ZONE ---
        // Dynamically requiring the module prevents the top-level import crash
        const Location = require('expo-location');
        
        if (!Location || !Location.requestForegroundPermissionsAsync) {
          throw new Error('Native module missing');
        }

        let { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status);
        
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(loc);
      } catch (err: any) {
        setIsModuleAvailable(false);
        console.log('⚠️ [NEARBY] Location module isolation triggered. Falling back to banner.');
      }
    };

    fetchLocation();
  }, []);

  const query = useQuery({
    queryKey: ['nearby-experts', location?.coords?.latitude, location?.coords?.longitude],
    queryFn: async () => {
      if (!location || !isModuleAvailable) return [];
      
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/location/nearby`, {
          params: {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            radius: 100,
          },
        });
        return (data.editors || []) as Expert[];
      } catch (e) {
        return [];
      }
    },
    enabled: !!location && isModuleAvailable,
    staleTime: 5 * 60 * 1000,
  });

  return {
    experts: query.data || [],
    isLoading: isModuleAvailable && (query.isLoading || (permissionStatus === 'granted' && !location && !errorMsg)),
    error: errorMsg,
    permissionStatus,
    location,
    isModuleAvailable,
  };
};
