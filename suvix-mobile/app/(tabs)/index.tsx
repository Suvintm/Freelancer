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

        <View style={{ padding: 16, paddingTop: 6 }}>
          {activeModule === 'creators' && user.youtubeProfile ? (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ backgroundColor: '#FF0000', padding: 4, borderRadius: 6, marginRight: 8 }}>
                  <MaterialCommunityIcons name="youtube" size={14} color="white" />
                </View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#FF0000', letterSpacing: 0.5 }}>
                  YOUTUBE CREATOR
                </Text>
              </View>

              <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text }}>
                Hi {user.name ? user.name.split(' ')[0] : 'Creator'},
              </Text>
              
              <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4, lineHeight: 18 }}>
                Growth Partner: <Text style={{ color: theme.accent, fontWeight: '600' }}>{user.primaryRole?.subCategory || 'Content'}</Text>
              </Text>

              {/* YouTube Feel: Compact Stats Card */}
              <LinearGradient
                colors={['#1a1a1a', '#0a0a0a']}
                style={{
                  marginTop: 12,
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#222'
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#333', overflow: 'hidden', marginRight: 10 }}>
                        {user.youtubeProfile.thumbnail_url ? (
                          <Image source={{ uri: user.youtubeProfile.thumbnail_url }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                          <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="account" size={18} color="#666" />
                          </View>
                        )}
                      </View>
                      <View>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
                          {user.youtubeProfile.channel_name}
                        </Text>
                      </View>
                   </View>
                   <View style={{ backgroundColor: '#FF000020', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                      <Text style={{ color: '#FF0000', fontSize: 9, fontWeight: '900' }}>VERIFIED</Text>
                   </View>
                </View>

                <View style={{ flexDirection: 'row', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#222' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#eee', fontWeight: 'bold', fontSize: 14 }}>
                      {user.youtubeProfile.subscriber_count?.toLocaleString() || '0'}
                    </Text>
                    <Text style={{ color: '#666', fontSize: 9, marginTop: 1, textTransform: 'uppercase' }}>Subs</Text>
                  </View>
                  <View style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: '#222', paddingLeft: 12 }}>
                    <Text style={{ color: '#eee', fontWeight: 'bold', fontSize: 14 }}>
                      {user.youtubeProfile.video_count?.toLocaleString() || '0'}
                    </Text>
                    <Text style={{ color: '#666', fontSize: 9, marginTop: 1, textTransform: 'uppercase' }}>Videos</Text>
                  </View>
                  <View style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: '#222', paddingLeft: 12 }}>
                    <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 14 }}>
                      {user.primaryRole?.subCategory || 'Niche'}
                    </Text>
                    <Text style={{ color: '#666', fontSize: 9, marginTop: 1, textTransform: 'uppercase' }}>Focus</Text>
                  </View>
                </View>
              </LinearGradient>
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
