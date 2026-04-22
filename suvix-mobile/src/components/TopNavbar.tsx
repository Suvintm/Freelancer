import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, Dimensions } from 'react-native';
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
import BottomSheet from '@gorhom/bottom-sheet';
import { useAccountVault } from '../hooks/useAccountVault';
import { AccountSwitcherSheet } from './shared/AccountSwitcherSheet';
const DEFAULT_AVATAR = require('../../assets/defualtprofile.png');

/** Modern rounded hamburger menu icon */
const RoundedMenuIcon = ({ color }: { color: string }) => (
  <View style={{ gap: 5, width: 22, justifyContent: 'center' }}>
    <View style={{ width: 22, height: 2.5, borderRadius: 99, backgroundColor: color }} />
    <View style={{ width: 15, height: 2.5, borderRadius: 99, backgroundColor: color }} />
    <View style={{ width: 22, height: 2.5, borderRadius: 99, backgroundColor: color }} />
  </View>
);

import { useUploadStore } from '../store/useUploadStore';

interface TopNavbarProps {
  onMenuPress: () => void;
  onProfilePress: () => void;
}

export const TopNavbar = ({ onMenuPress, onProfilePress }: TopNavbarProps) => {
  const { user } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();
  const { isVisible, progress: uploadProgress, message, status, uploadType } = useUploadStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Account Switcher Sheet ─────────────────────────────────────────────────
  const { getAllAccounts } = useAccountVault();
  const allAccounts = getAllAccounts();
  const extraAccountCount = Math.max(0, allAccounts.length - 1);

  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onProfilePress();
  };

  const NAVBAR_HEIGHT = 50;
  const EXTRA_PROGRESS_HEIGHT = 30;
  
  const expansion = useSharedValue(0);
  const uploadBarWidth = useSharedValue(0);

  // Sync Logic & UX Buffering
  const queryClient = useQueryClient();
  const isFetching = useIsFetching() > 0;
  const progressAnim = useSharedValue(-width); // API Loading bar

  // 🛰️ [ANIMATION] Handle Navbar Expansion & Progress Bar
  React.useEffect(() => {
    if (isVisible) {
      expansion.value = withTiming(EXTRA_PROGRESS_HEIGHT, { duration: 400 });
      uploadBarWidth.value = withTiming(uploadProgress, { duration: 400 });
    } else {
      expansion.value = withTiming(0, { duration: 400 });
      uploadBarWidth.value = withTiming(0, { duration: 300 });
    }
  }, [isVisible, uploadProgress]);

  const { isRefreshing } = useAuthStore();
  const showLoading = isFetching || isRefreshing;

  // Trigger animations when showLoading is true
  React.useEffect(() => {
    if (showLoading) {
      progressAnim.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(width, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(progressAnim);
      progressAnim.value = withTiming(-width, { duration: 300 });
    }
  }, [showLoading, progressAnim, width]);

  const apiProgressStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progressAnim.value }],
    opacity: showLoading ? 1 : 0,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    height: insets.top + NAVBAR_HEIGHT + expansion.value,
  }));

  const uploadBarStyle = useAnimatedStyle(() => ({
    width: `${uploadBarWidth.value}%`,
  }));

  const progressSectionStyle = useAnimatedStyle(() => ({
    height: expansion.value,
    opacity: expansion.value / EXTRA_PROGRESS_HEIGHT,
    overflow: 'hidden',
  }));


  const palette = isDarkMode ? Colors.dark : Colors.light;

  const gradientColors = isDarkMode 
    ? ['#000000', '#FFFFFF', '#000000']
    : ['#FFFFFF', '#18181B', '#FFFFFF'];

  return (
    <Animated.View style={[
      styles.container, 
      containerStyle,
      { 
        backgroundColor: palette.tabBar,
        paddingTop: insets.top,
      }
    ]}>
      <View style={styles.topRow}>
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
            <Image source={require('../../assets/darklogo.png')} style={styles.logoDark} resizeMode="contain" />
          ) : (
            <Image source={require('../../assets/lightlogo.png')} style={styles.logoLight} resizeMode="contain" />
          )}
        </View>

        {/* RIGHT: Actions */}
        <View style={styles.rightSection}>

          <TouchableOpacity style={styles.actionButton} onPress={toggleTheme} activeOpacity={0.7}>
            <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={22} color={isDarkMode ? palette.accent : '#666'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/notifications');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={isDarkMode ? '#FFF' : '#000'} />
            <View style={[styles.notifBadge, { backgroundColor: '#ef4444' }]} />
          </TouchableOpacity>

          {/* 👤 Avatar — tap to open Account Switcher */}
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={handleProfilePress}
            activeOpacity={0.8}
          >
            <Image 
              source={user?.profilePicture ? { uri: user.profilePicture } : DEFAULT_AVATAR} 
              style={styles.avatarImg} 
            />
            {/* Badge: number of additional accounts OR a plus icon if single-account */}
            {extraAccountCount > 0 ? (
              <View style={styles.accountCountBadge}>
                <Text style={styles.accountCountText}>+{extraAccountCount}</Text>
              </View>
            ) : (
              <View style={[styles.addAccountBadge, { borderColor: palette.tabBar }]}>
                <Ionicons name="add" size={10} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 🚀 MEDIA PROGRESS SECTION (Integrated) */}
      <Animated.View style={[styles.progressSection, progressSectionStyle]}>
        <View style={styles.progressTextRow}>
          <Animated.Text style={[styles.statusText, { color: palette.text }]}>
            {message}
          </Animated.Text>
        </View>
        <View style={[styles.uploadBarContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          <Animated.View style={[
            styles.uploadBarFill, 
            uploadBarStyle, 
            { backgroundColor: status === 'failed' ? '#ef4444' : status === 'success' ? '#22c55e' : (uploadType === 'STORY' ? '#E1306C' : palette.accent) }
          ]} />
        </View>
      </Animated.View>

      {/* API PROGRESS LOADER (Bottom edge) */}
      <Animated.View style={[styles.progressBar, apiProgressStyle]}>
         <LinearGradient
            colors={gradientColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    zIndex: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  topRow: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressSection: {
    paddingBottom: 8,
    justifyContent: 'center',
  },
  progressTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  uploadBarContainer: {
    height: 3,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  uploadBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    width: '100%',
    zIndex: 999,
  },
  iconButton: {
    padding: 8,
  },
  logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  logoDark: {
    width: 130,
    height: 38,
  },
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
  notifBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  // ── Account Switcher Avatar ────────────────────────────────────────────────
  avatarButton: {
    position: 'relative',
    marginLeft: 4,
    padding: 4,
  },
  avatarImg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
  },
  avatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#8B5CF650',
  },
  accountCountBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  accountCountText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addAccountBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#8B5CF6',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000', // Matches theme or provides contrast
  },
});
