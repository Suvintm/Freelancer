import React, { useMemo, useCallback } from 'react';
import { useAuthStore } from '../../src/store/useAuthStore';
import { View, Text, StyleSheet, BackHandler, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const [scrollEnabled, setScrollEnabled] = React.useState(true);
  const [leftColumnHeight, setLeftColumnHeight] = React.useState<number | undefined>(undefined);
  const scrollIdleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  
  const sidebarWidth = Math.round(screenWidth * 0.215);
  const leftColumnWidth = screenWidth - sidebarWidth - 6; // flush to left edge, minimal 6px gap before sidebar

  const bannerHeight = leftColumnWidth / 1.35;
  const cardWidth = leftColumnWidth * 0.78;
  const cardHeight = cardWidth / 3.2;
  const featureGalleryHeight = cardHeight + 28; // Header text + margins + card height

  const navbarHeight = insets.top + 50; // top safe area + navbar height
  const topSpacing = navbarHeight + 6; // Reduced gap below top navigation bar

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
        scrollEnabled={scrollEnabled}
        ListHeaderComponent={
          <View style={[styles.splitLayoutContainer, { paddingTop: topSpacing }]}>
            {/* Left Column: Banner & Feature Gallery */}
            <View 
              style={{ width: screenWidth }}
              onLayout={(e) => setLeftColumnHeight(Math.round(e.nativeEvent.layout.height))}
            >
              {/* Banner Section */}
              <View style={[styles.bannerWrapper, { width: leftColumnWidth }]}>
                {isReady ? (
                  <UnifiedBanner paused={isHomeScrolling} width={leftColumnWidth} />
                ) : (
                  <View style={{ height: leftColumnWidth / 1.35 }} />
                )}
              </View>
 
              {/* Feature Gallery */}
              {isReady && (
                <FeatureGallery paused={isHomeScrolling} isLoading={isDiscoveryLoading} width={screenWidth} />
              )}
            </View>
 
            {/* Right Column: Vertical Stories Sidebar */}
            <View style={[styles.rightColumn, { width: sidebarWidth, height: leftColumnHeight, top: topSpacing }]}>
              <StoryBar 
                isLoading={isDiscoveryLoading} 
                layout="vertical" 
                width={sidebarWidth} 
                height={leftColumnHeight}
                isHomeScrolling={isHomeScrolling}
                onScrollBeginDrag={() => setScrollEnabled(false)}
                onScrollEndDrag={() => setScrollEnabled(true)}
              />
            </View>
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
  splitLayoutContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 0,
    justifyContent: 'space-between',
    marginBottom: 16,
    position: 'relative',
  },
  bannerWrapper: {
    width: '100%',
  },
  rightColumn: {
    position: 'absolute',
    right: 0,
    alignItems: 'flex-end',
    zIndex: 100,
    elevation: 100,
  },
  moduleSection: {
    paddingTop: 0,
  }
});
