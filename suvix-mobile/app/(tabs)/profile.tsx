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

// Modules
import YouTubeCreatorProfile from '../../src/modules/creators/profiles/YouTubeCreatorProfile';
import DefaultProfile from '../../src/modules/shared/profiles/DefaultProfile';

/**
 * PRODUCTION-GRADE DYNAMIC PROFILE (Profile Tab)
 * Role-based shell that injects specialized profile experiences.
 */

// 1. Profile Registry
const PROFILE_REGISTRY: Record<string, React.ComponentType> = {
  creators: YouTubeCreatorProfile,
  default:  DefaultProfile,
};

export default function ProfileIndex() {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, isLoadingUser, isAuthenticated } = useAuthStore();

  // Determine which module to load based on user metadata
  const activeModule = React.useMemo(() => {
    if (!user || !user.primaryRole) return 'default';
    
    // Check if user is a YT Creator
    const categoryName = user.primaryRole.category?.toLowerCase() || '';
    if (categoryName.includes('youtube') || categoryName.includes('influencer')) {
      return 'creators';
    }

    return 'default';
  }, [user]);

  if (isLoadingUser || (isAuthenticated && !user)) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.primary }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Synchronizing Profile...</Text>
      </View>
    );
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
    <View style={{ flex: 1, backgroundColor: theme.primary, paddingTop: insets.top }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ActiveProfileModule />
    </View>
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
    aspectRatio: 1,
    borderRadius: 0,
  },
});
