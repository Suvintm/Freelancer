import React, { useMemo, useCallback } from 'react';
import { useAuthStore } from '../../src/store/useAuthStore';
import { View, Text, ActivityIndicator, StyleSheet, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { CATEGORIES } from '../../src/constants/categories';
import { Colors } from '../../src/constants/Colors';
import { CategoryId } from '../../src/types/category';

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
import { ScrollView } from 'react-native';

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

export default function DashboardIndex() {
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
    const categoryName = user.primaryRole.category?.toLowerCase() || '';

    if (categoryName.includes('youtube') || categoryName.includes('influencer')) return 'creators';
    if (categoryName.includes('rental')) return 'rentals';
    if (categoryName.includes('promoter')) return 'promoters';
    if (categoryName.includes('editor')) return 'editors';

    return roleGroup === 'CLIENT' ? 'clients' : 'editors';
  }, [user]);

  // ZERO-LATENCY FALLBACK: If user is authenticated but data is 1ms late, show the skeleton
  const showSkeleton = isLoadingUser || (isAuthenticated && !user);

  if (showSkeleton) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.primary }]}>
        <ActivityIndicator size="large" color={theme.text} />
        {/* Subtle Skeleton layout for zero-latency feel */}
        <View style={{ width: '90%', height: 200, backgroundColor: theme.secondary, borderRadius: 20, marginTop: 40 }} />
        <View style={{ width: '40%', height: 20, backgroundColor: theme.secondary, borderRadius: 10, marginTop: 20, alignSelf: 'flex-start', marginLeft: 20 }} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.primary }]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>Please login to access SuviX.</Text>
      </View>
    );
  }

  // 3. Render Unified Home Feed
  const ActiveActionModule = MODULE_REGISTRY[activeModule] || EditorDashboard;

  return (
    <View style={{ flex: 1, backgroundColor: theme.primary }}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 60 }}
        removeClippedSubviews={false}
        onScrollBeginDrag={() => {
          if (scrollIdleTimerRef.current) {
            clearTimeout(scrollIdleTimerRef.current);
            scrollIdleTimerRef.current = null;
          }
          setIsHomeScrolling(true);
        }}
        onMomentumScrollBegin={() => {
          if (scrollIdleTimerRef.current) {
            clearTimeout(scrollIdleTimerRef.current);
            scrollIdleTimerRef.current = null;
          }
          setIsHomeScrolling(true);
        }}
        onScrollEndDrag={() => {
          if (scrollIdleTimerRef.current) {
            clearTimeout(scrollIdleTimerRef.current);
          }
          scrollIdleTimerRef.current = setTimeout(() => {
            setIsHomeScrolling(false);
            scrollIdleTimerRef.current = null;
          }, 120);
        }}
        onMomentumScrollEnd={() => {
          if (scrollIdleTimerRef.current) {
            clearTimeout(scrollIdleTimerRef.current);
            scrollIdleTimerRef.current = null;
          }
          setIsHomeScrolling(false);
        }}
      >
        {/* Banner Section (Always visible) */}
        <View style={styles.bannerWrapper}>
          {isReady ? <UnifiedBanner paused={isHomeScrolling} /> : <View style={{ height: 200 }} />}
        </View>

        {/* Stories Section (Always visible) */}
        <StoryBar />

        {/* Dynamic Professional Greeting (Safety Guarded) */}
        <View style={{ padding: 24, paddingTop: 10 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>
            Hi {user.name ? user.name.split(' ')[0] : 'Member'},
          </Text>
          <Text style={{ fontSize: 16, color: theme.textSecondary, marginTop: 4 }}>
            {user.primaryRole?.group === 'PROVIDER' 
              ? `Ready to grow your ${user.primaryRole?.category || 'Professional'} business?` 
              : `Looking for ${user.primaryRole?.category || 'Service'} experts today?`}
          </Text>
        </View>

        {/* Feature Gallery / Service Quick Links (Always visible) */}
        {isReady && <FeatureGallery paused={isHomeScrolling} />}
        
        {/* Dynamic Action Module (Static Render) */}
        <View style={styles.moduleSection}>
          <ActiveActionModule />
        </View>
      </ScrollView>
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
    paddingTop: 80, // Space for the absolute TopNavbar
  },
  moduleSection: {
    paddingTop: 0,
  }
});
