import React, { useMemo, useCallback } from 'react';
import { useAuthStore } from '../../src/store/useAuthStore';
import { View, Text, ActivityIndicator, StyleSheet, BackHandler, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/context/ThemeContext';
import { CATEGORIES } from '../../src/constants/categories';
import { Colors } from '../../src/constants/Colors';
import { CategoryId } from '../../src/types/category';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
      <UnifiedFeed 
        ListHeaderComponent={
          <View>
            {/* Banner Section (Always visible) */}
            <View style={styles.bannerWrapper}>
              {isReady ? <UnifiedBanner paused={isHomeScrolling} /> : <View style={{ height: 200 }} />}
            </View>

            {/* Stories Section (Always visible) */}
            <StoryBar />

            <View style={{ padding: 16, paddingTop: 0 }}>
              {activeModule === 'creators' && user.youtubeProfile ? (
                <View style={{ marginBottom: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#FF0000', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, marginRight: 8 }}>
                      <MaterialCommunityIcons name="youtube" size={12} color="white" />
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: '#FF0000', letterSpacing: 0.8 }}>
                      YOUTUBE CREATOR
                    </Text>
                  </View>
                  
                  <Text style={{ fontSize: 16, fontWeight: '900', color: theme.text, marginTop: 4, letterSpacing: -0.3 }}>
                    Let's grow your channel here
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>
                    Hi {user.name ? user.name.split(' ')[0] : 'Member'},
                  </Text>
                  <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 2 }}>
                    {user.primaryRole?.group === 'PROVIDER' 
                      ? `Grow your ${user.primaryRole?.category || 'Expertise'}` 
                      : `Find ${user.primaryRole?.category || 'Service'} experts`}
                  </Text>
                </View>
              )}
            </View>

            {/* Feature Gallery / Service Quick Links (Always visible) */}
            {isReady && <FeatureGallery paused={isHomeScrolling} />}
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
