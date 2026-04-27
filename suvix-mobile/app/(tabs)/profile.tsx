import React from 'react';
import { useAuthStore } from '../../src/store/useAuthStore';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/shared/ScreenContainer';

// Modules
import YouTubeCreatorProfile from '../../src/modules/creators/profiles/YouTubeCreatorProfile';
import FitnessInfluencerProfile from '../../src/modules/creators/profiles/FitnessInfluencerProfile';
import ClientProfile from '../../src/modules/clients/profiles/ClientProfile';
import DefaultProfile from '../../src/modules/shared/profiles/DefaultProfile';
import { ProfileSkeleton } from '../../src/modules/shared/skeletons/ProfileSkeleton';

/**
 * PRODUCTION-GRADE DYNAMIC PROFILE (Profile Tab)
 * Role-based shell that injects specialized profile experiences.
 */

// 1. Profile Registry
const PROFILE_REGISTRY: Record<string, React.ComponentType> = {
  creators: YouTubeCreatorProfile,
  fitness:  FitnessInfluencerProfile,
  clients:  ClientProfile,
  default:  DefaultProfile,
};

import { useUIStore } from '../../src/store/useUIStore';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

export default function ProfileIndex({ scrollY }: { scrollY?: SharedValue<number> }) {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, isLoadingUser, isAuthenticated } = useAuthStore();
  const { isTabBarVisible } = useUIStore();
  const router = useRouter();

  // Determine which module to load based on user metadata
  const activeModule = React.useMemo(() => {
    if (!user || !user.primaryRole) return 'default';
    
    // 🛡️ ROLE ROUTER: Select the specialized experience
    const categorySlug = user.primaryRole?.categorySlug;
    const roleGroup = user.primaryRole?.group;

    // A. Fitness Influencers
    if (categorySlug === 'fitness_expert') {
      return 'fitness';
    }

    // B. YouTube / General Creators
    if (categorySlug === 'yt_influencer') {
      return 'creators';
    }

    // C. Normal Users / Clients
    if (roleGroup === 'CLIENT') {
      return 'clients';
    }

    return 'default';
  }, [user]);

  const showSkeleton = !user && (isLoadingUser || isAuthenticated);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(isTabBarVisible ? 1 : 0) }],
    opacity: withTiming(isTabBarVisible ? 1 : 0),
  }));

  if (showSkeleton) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.primary }]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>Please login to access profile.</Text>
      </View>
    );
  }

  // 3. Render Injected Profile
  const ActiveProfileModule = PROFILE_REGISTRY[activeModule] || DefaultProfile;

  return (
    <ScreenContainer isScrollable={false} hasHeader={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: theme.primary }}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <ActiveProfileModule scrollY={scrollY} />
        
        {/* 🚀 FLOAT ACTION: Create Post */}
        <Animated.View style={[styles.fabWrapper, fabStyle]}>
          <TouchableOpacity 
            style={[styles.fab, { backgroundColor: theme.accent }]} 
            onPress={() => router.push('/create-post')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={30} color="white" />
          </TouchableOpacity>
        </Animated.View>

        {/* 🌑 TOP STATUSBAR GRADIENT FADE (Immersive) */}
        <View style={styles.topOverlayWrapper}>
          <LinearGradient
            colors={['#000000', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 80,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
  },
  banner: {
    height: 78,
    width: '100%',
  },
  profileWrap: {
    marginTop: -28,
    paddingHorizontal: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: '#0f172a',
    marginTop: -37,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
  },
  infoBlock: {
    marginTop: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
  },
  username: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
  },
  bio: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-between',
  },
  actionBtn: {
    width: '49%',
    borderWidth: 1,
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  sectionTitleMuted: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  grid: {
    marginTop: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 1,
  },
  gridItem: {
    width: '33.15%',
    borderRadius: 0,
    aspectRatio: 1,
  },
  fabWrapper: {
    position: 'absolute',
    bottom: 100,
    right: 25,
    zIndex: 999,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  topOverlayWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100, // Height to cover status bar and top safe area
    zIndex: 100,
    pointerEvents: 'none',
  },
});
