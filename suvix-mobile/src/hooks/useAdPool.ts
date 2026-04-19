import { useState, useCallback, useEffect, useRef } from 'react';
import { NativeAd } from 'react-native-google-mobile-ads';

/**
 * 🏊‍♂️ useAdPool Hook
 * Manages a pre-fetched pool of NativeAd objects for smooth scrolling.
 */
export const useAdPool = (adUnitId: string, count: number = 5) => {
  const [ads, setAds] = useState<NativeAd[]>([]);
  const [loadingPool, setLoadingPool] = useState(true);
  const isFetching = useRef(false);

  const loadAds = useCallback(async () => {
    if (isFetching.current) return;
    
    isFetching.current = true;
    setLoadingPool(true);
    console.log(`🏊‍♂️ [ADS] Prefetching ${count} unique ads (Sequential Mode) with ID: ${adUnitId}`);
    
    // Keywords to encourage variety
    const mockKeywords = ['social', 'finance', 'games', 'travel', 'shopping'];
    const loadedAds: NativeAd[] = [];

    try {
      for (let i = 0; i < count; i++) {
        console.log(`📡 [ADS] Fetching slot ${i + 1}/${count} (REAL)...`);
        
        try {
          // ⏱️ TIMEOUT GUARD: Prevents the app from hanging if AdMob inventory is low
          const adPromise = NativeAd.createForAdRequest(adUnitId, {
            requestNonPersonalizedAdsOnly: true,
            startVideoMuted: true,
            keywords: [mockKeywords[i % mockKeywords.length]],
          });

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AdMob Timeout')), 15000)
          );

          const nativeAd = await Promise.race([adPromise, timeoutPromise]) as NativeAd;
          
          if (nativeAd) {
            loadedAds.push(nativeAd);
            console.log(`✅ [ADS] Slot ${i + 1} filled.`);
          }
        } catch (adError: any) {
          console.warn(`⚠️ [ADS] Slot ${i + 1} skipped: ${adError?.message || 'No Fill'}`);
        }
      }
      
      setAds(loadedAds);
      
      if (loadedAds.length === 0) {
        console.warn('⚠️ [ADS] All slots empty. This is normal for brand-new Ad Units (requires 1-48h warm-up).');
      } else {
        console.log(`✅ [ADS] Ad Pool synchronized with ${loadedAds.length} units.`);
      }
    } catch (error) {
      console.error('❌ [ADS] Critical failure during pool sync:', error);
    } finally {
      setLoadingPool(false);
      isFetching.current = false;
    }
  }, [adUnitId, count]);

  // Initial Sync
  useEffect(() => {
    loadAds();
    
    return () => {
      // Cleanup: Destroy all ads in the pool on unmount
      setAds(prev => {
        prev.forEach(ad => ad.destroy());
        return [];
      });
    };
  }, [loadAds]);

  const refreshAds = useCallback(() => {
    // Clear old pool before refreshing
    setAds(prev => {
      prev.forEach(ad => ad.destroy());
      return [];
    });
    isFetching.current = false;
    loadAds();
  }, [loadAds]);

  return {
    ads,
    loadingPool,
    refreshAds
  };
};
