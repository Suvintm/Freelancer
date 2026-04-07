import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Platform, Dimensions } from 'react-native';
const { width } = Dimensions.get('window');
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
  cancelAnimation,
  withSequence
} from 'react-native-reanimated';

/** Modern rounded hamburger menu icon */
const RoundedMenuIcon = ({ color }: { color: string }) => (
  <View style={{ gap: 5, width: 22, justifyContent: 'center' }}>
    <View style={{ width: 22, height: 2.5, borderRadius: 99, backgroundColor: color }} />
    <View style={{ width: 15, height: 2.5, borderRadius: 99, backgroundColor: color }} />
    <View style={{ width: 22, height: 2.5, borderRadius: 99, backgroundColor: color }} />
  </View>
);

interface TopNavbarProps {
  onMenuPress: () => void;
}

export const TopNavbar = ({ onMenuPress }: TopNavbarProps) => {
  const { user } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const NAVBAR_HEIGHT = 50;
  const TOTAL_HEIGHT = insets.top + NAVBAR_HEIGHT;

  // Sync Logic & UX Buffering
  const queryClient = useQueryClient();
  const isFetching = useIsFetching() > 0;
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  // Combined state: Animation runs if data is fetching OR if we are in our minimum UX buffer
  const showLoading = isFetching || isRefreshing;

  const rotation = useSharedValue(0);
  const progress = useSharedValue(-width); // Start off-screen to the left

  // Trigger animations when showLoading is true
  React.useEffect(() => {
    if (showLoading) {
      // 1. Start icon rotation
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
      // 2. Start progress bar slide
      progress.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(width, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        false
      );
    } else {
      // Smoothly finish and hide
      cancelAnimation(rotation);
      cancelAnimation(progress);
      rotation.value = withTiming(0, { duration: 300 });
      progress.value = withTiming(-width, { duration: 300 });
    }
  }, [showLoading, rotation, progress, width]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value }],
    opacity: showLoading ? 1 : 0,
  }));

  const handleRefresh = async () => {
    console.log('🔄 [API] Refreshing active queries...');
    
    // Impact feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // UX Buffer: Stay in "Refreshing" state for 1.5s minimum
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);

    queryClient.refetchQueries({ stale: true, type: 'active' });
  };

  const palette = isDarkMode ? Colors.dark : Colors.light;

  // Signature "Fiber Pulse" Monochrome Gradient Colors
  const gradientColors = isDarkMode 
    ? ['#000000', '#FFFFFF', '#000000'] // Pure White Pulse on Pure Black
    : ['#FFFFFF', '#18181B', '#FFFFFF']; // Deep Zinc Pulse on Pure White

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: palette.tabBar,
        paddingTop: insets.top,
        height: TOTAL_HEIGHT
      }
    ]}>
      {/* LEFT: Modern Rounded Menu Icon */}
      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={onMenuPress}
        activeOpacity={0.7}
      >
        <RoundedMenuIcon color={isDarkMode ? '#FFF' : '#000'} />
      </TouchableOpacity>

      {/* CENTER: Branded Logo */}
      <View style={styles.logoContainer} pointerEvents="none">
        {isDarkMode ? (
          <Image 
            source={require('../../assets/darklogo.png')} 
            style={styles.logoDark} 
            resizeMode="contain" 
          />
        ) : (
          <Image 
            source={require('../../assets/lightlogo.png')} 
            style={styles.logoLight} 
            resizeMode="contain" 
          />
        )}
      </View>

      {/* RIGHT: Actions */}
      <View style={styles.rightSection}>
        {/* Refresh Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleRefresh} activeOpacity={0.7}>
          <Animated.View style={spinStyle}>
            <Ionicons name="refresh-outline" size={22} color={isDarkMode ? '#888' : '#666'} />
          </Animated.View>
        </TouchableOpacity>

        {/* Theme Toggle */}
        <TouchableOpacity style={styles.actionButton} onPress={toggleTheme} activeOpacity={0.7}>
          <Ionicons 
            name={isDarkMode ? "sunny-outline" : "moon-outline"} 
            size={22} 
            color={isDarkMode ? palette.accent : '#666'} 
          />
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/notifications');
          }}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="notifications-outline" 
            size={22} 
            color={isDarkMode ? '#FFF' : '#000'} 
          />
          {/* Subtle Notification Badge Dot */}
          <View style={[styles.notifBadge, { backgroundColor: '#ef4444' }]} />
        </TouchableOpacity>
      </View>
      {/* ELITE PROGRESS LOADER (Bottom of Navbar) */}
      <Animated.View style={[styles.progressBar, progressStyle]}>
         <LinearGradient
            colors={gradientColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 50,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2, // Razor-sharp 2px for elite production look
    width: '100%',
    zIndex: 999, // Ensure it's on top of everything
  },
  iconButton: {
    padding: 8,
  },
  logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 50, // Matches NAVBAR_HEIGHT exactly
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  // Dark mode logo
  logoDark: {
    width: 130,
    height: 38,
  },
  // Light mode logo
  logoLight: {
    width: 130,
    height: 38,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 2,
  },
  profileButton: {
    marginLeft: 6,
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  notifBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#000',
  },
});
