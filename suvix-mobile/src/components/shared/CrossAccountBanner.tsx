/**
 * CrossAccountBanner.tsx
 *
 * An in-app notification banner that appears when a notification arrives
 * for an account that is NOT currently active on screen.
 *
 * Behaviour per Instagram's model:
 * - Shows at the top with a slide-down + fade animation
 * - Displays which account received the notification (avatar + username)
 * - "Switch" button instantly switches to that account
 * - Auto-dismisses after 6 seconds
 * - Can be manually dismissed
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCrossAccountBanner } from '../../hooks/useNotifications';

const AUTO_DISMISS_MS = 6000;

interface CrossAccountBannerProps {
  isDark: boolean;
}

export const CrossAccountBanner = ({ isDark }: CrossAccountBannerProps) => {
  const insets = useSafeAreaInsets();
  const banner = useCrossAccountBanner();

  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    'worklet';
    translateY.value = withTiming(-120, { duration: 350 });
    opacity.value = withTiming(0, { duration: 350 });
  };

  const show = () => {
    'worklet';
    translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });
  };

  useEffect(() => {
    if (banner?.isVisible) {
      show();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      // Auto-dismiss
      if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
      autoDismissTimer.current = setTimeout(() => {
        banner.onDismiss();
      }, AUTO_DISMISS_MS);
    } else {
      dismiss();
      if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
    }

    return () => { if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current); };
  }, [banner?.isVisible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!banner) return null;

  const bg = isDark ? 'rgba(20,20,20,0.97)' : 'rgba(255,255,255,0.97)';
  const textColor = isDark ? '#F9FAFB' : '#111827';
  const subColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + (Platform.OS === 'ios' ? 8 : 12), backgroundColor: bg, borderColor },
        animStyle,
      ]}
    >
      {/* Left: Account info */}
      <View style={styles.left}>
        {/* Avatar */}
        {banner.targetProfilePicture ? (
          <Image source={{ uri: banner.targetProfilePicture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: '#8B5CF630' }]}>
            <Text style={styles.avatarInitial}>
              {(banner.targetUsername || '?')[0].toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.textBlock}>
          {/* Account label */}
          <View style={styles.accountRow}>
            <Ionicons name="person-circle-outline" size={12} color="#8B5CF6" />
            <Text style={[styles.accountLabel, { color: '#8B5CF6' }]}>
              @{banner.targetUsername}
            </Text>
          </View>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {banner.title}
          </Text>
          <Text style={[styles.body, { color: subColor }]} numberOfLines={1}>
            {banner.body}
          </Text>
        </View>
      </View>

      {/* Right: Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.switchBtn}
          onPress={banner.onSwitch}
          activeOpacity={0.8}
        >
          <Text style={styles.switchText}>Switch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={banner.onDismiss}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={16} color={subColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: '#8B5CF6' },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: 16, fontWeight: '800', color: '#8B5CF6' },
  textBlock: { flex: 1 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 1 },
  accountLabel: { fontSize: 10, fontWeight: '700' },
  title: { fontSize: 13, fontWeight: '700', marginBottom: 1 },
  body: { fontSize: 12, fontWeight: '500' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  switchBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  switchText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(128,128,128,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
