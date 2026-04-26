import React, { useMemo, useCallback } from 'react';
import { useAuthStore } from '../../src/store/useAuthStore';
import { View, Text, StyleSheet, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';

// Modules
import CreatorDashboard from '../../src/modules/creators';
import RentalDashboard from '../../src/modules/rentals';
import PromoterDashboard from '../../src/modules/promoters';
import EditorDashboard from '../../src/modules/editors';
import ClientDashboard from '../../src/modules/clients';

// Common Components
import { UnifiedBanner } from '../../src/components/home/UnifiedBanner';
import { StoryBar } from '../../src/components/stories/StoryBar';
import { FeatureGallery } from '../../src/components/home/FeatureGallery';
import { UnifiedFeed } from '../../src/modules/home/discovery/UnifiedFeed';
import { useDiscoveryStore } from '../../src/store/useDiscoveryStore';
import { DashboardSkeleton } from '../../src/modules/home/skeletons/DashboardSkeleton';
import { SharedValue } from 'react-native-reanimated';

/**
 * PRODUCTION-GRADE DYNAMIC DASHBOARD (Home Tab)
 * Implements "Deferred Loading" to save memory and "Zero-Latency" hydrate rendering.
 */

// 1. Component Registry (Deferred Loading to save RAM)
const MODULE_REGISTRY: Record<string, React.ComponentType> = {
  creators:  CreatorDashboard,
  rentals:   RentalDashboard,
  promoters: PromoterDashboard,
  editors:   EditorDashboard,
  clients:   ClientDashboard,
};

export default function DashboardIndex({ scrollY }: { scrollY?: SharedValue<number> }) {
  const { theme } = useTheme();
  const { user, isLoadingUser, isAuthenticated } = useAuthStore();
  const [isReady, setIsReady] = React.useState(false);
  const [isHomeScrolling, setIsHomeScrolling] = React.useState(false);
  const scrollIdleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // STAGGERED INITIALIZATION: Delay heavy Reanimated components to avoid Main Thread choke
  React.useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    return () => {
      if (scrollIdleTimerRef.current) {
        clearTimeout(scrollIdleTimerRef.current);
        scrollIdleTimerRef.current = null;
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Only allow exit if on Home
        BackHandler.exitApp();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  // Determine which module to load based on user metadata
  const activeModule = useMemo(() => {
    if (!user || !user.primaryRole) return 'editors'; // Safe fallback
    
    const roleGroup = user.primaryRole.group;
    const categorySlug = user.primaryRole.categorySlug;

    if (categorySlug === 'yt_influencer' || categorySlug === 'fitness_expert') return 'creators';
    if (categorySlug === 'rental_service') return 'rentals';
    if (categorySlug === 'brand_promoter') return 'promoters';
    if (categorySlug === 'service_editor') return 'editors';

    return roleGroup === 'CLIENT' ? 'clients' : 'editors';
  }, [user]);

  const { feed, isLoading: isDiscoveryLoading } = useDiscoveryStore();

  // ZERO-LATENCY FALLBACK: If user is authenticated but data is 1ms late, show the skeleton
  const showSkeleton = !user && (isLoadingUser || isAuthenticated);

  if (showSkeleton) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.primary }]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>Please login to access SuviX.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.primary }}>
      <UnifiedFeed 
        scrollY={scrollY}
        ListHeaderComponent={
          <View>
            {/* Banner Section (Always persistent) */}
            <View style={styles.bannerWrapper}>
              {isReady ? (
                <UnifiedBanner paused={isHomeScrolling} />
              ) : (
                <View style={{ height: 200 }} />
              )}
            </View>
 
             {/* Stories Section (Always visible) */}
             <StoryBar isLoading={isDiscoveryLoading} />
 
             <View style={{ height: 16 }} />
 
             {/* Feature Gallery / Service Quick Links (Always visible) */}
             {isReady && (
               <FeatureGallery paused={isHomeScrolling} isLoading={isDiscoveryLoading} />
             )}
           </View>
         }
        onScrollBeginDrag={() => setIsHomeScrolling(true)}
        onScrollEndDrag={() => setIsHomeScrolling(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  loadingText: { 
    marginTop: 12,
    fontWeight: '600'
  },
  errorText: { 
    fontSize: 14
  },
  bannerWrapper: {
    paddingTop: 80, // Restored space for the absolute TopNavbar
  },
  moduleSection: {
    paddingTop: 0,
  }
});
