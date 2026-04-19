import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PremiumMediaEngine } from './PremiumMediaEngine';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface InteractiveMediaItemProps {
  item: any;
  isActive: boolean;
  onLike?: () => void;
}

export const InteractiveMediaItem: React.FC<InteractiveMediaItemProps> = ({
  item,
  isActive,
  onLike,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showMuteIcon, setShowMuteIcon] = useState(false);
  const [progress, setProgress] = useState(0);
  const isMutedRef = useRef(false);
  const muteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const pauseIconOpacity = useSharedValue(0);
  const muteScale = useSharedValue(0);

  // Progress tracking
  const handleStatusUpdate = useCallback(
    ({ position, duration }: { position: number; duration: number }) => {
      if (duration > 0) setProgress(position / duration);
    },
    [],
  );

  // ── Like animation ──
  const triggerLikeAnimation = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onLike?.();
    heartScale.value = withSequence(
      withSpring(1.4, { damping: 8, stiffness: 120 }),
      withDelay(400, withSpring(0, { damping: 12 })),
    );
    heartOpacity.value = withSequence(
      withTiming(1, { duration: 80 }),
      withDelay(450, withTiming(0, { duration: 250 })),
    );
  };

  // ── Mute toggle ──
  const toggleMute = () => {
    isMutedRef.current = !isMutedRef.current;
    setIsMuted(isMutedRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMuteIcon(true);
    muteScale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withDelay(600, withSpring(0)),
    );
    if (muteTimerRef.current) clearTimeout(muteTimerRef.current);
    muteTimerRef.current = setTimeout(() => setShowMuteIcon(false), 900);
  };

  // ── Long press pause ──
  const handlePauseStart = () => {
    setIsPaused(true);
    pauseIconOpacity.value = withTiming(1, { duration: 150 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePauseEnd = () => {
    setIsPaused(false);
    pauseIconOpacity.value = withTiming(0, { duration: 150 });
  };

  // ── Gestures ──
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onStart(() => runOnJS(triggerLikeAnimation)());

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(250)
    .requireExternalGestureToFail(doubleTap)
    .onStart(() => runOnJS(toggleMute)());

  const longPress = Gesture.LongPress()
    .minDuration(250)
    .onStart(() => runOnJS(handlePauseStart)())
    .onEnd(() => runOnJS(handlePauseEnd)())
    .onFinalize(() => runOnJS(handlePauseEnd)());

  // Exclusive: double tap wins over single tap; long press is separate
  const composed = Gesture.Race(longPress, Gesture.Exclusive(doubleTap, singleTap));

  // ── Animated styles ──
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const pauseStyle = useAnimatedStyle(() => ({
    opacity: pauseIconOpacity.value,
  }));

  const muteStyle = useAnimatedStyle(() => ({
    transform: [{ scale: muteScale.value }],
  }));

  const isVideoItem = item.media?.type === 'VIDEO' || item.type === 'VIDEO';

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composed}>
        <View style={styles.touchArea}>
          <PremiumMediaEngine
            media={item.media}
            isActive={isActive}
            isPaused={isPaused}
            isMuted={isMuted}
            onStatusUpdate={isVideoItem ? handleStatusUpdate : undefined}
          />

          {/* ── Pause overlay ── */}
          <Animated.View style={[styles.pauseOverlay, pauseStyle]} pointerEvents="none">
            <View style={styles.pauseIconBg}>
              <MaterialCommunityIcons name="pause" size={44} color="white" />
            </View>
          </Animated.View>

          {/* ── Heart pop ── */}
          <Animated.View style={[styles.heartOverlay, heartStyle]} pointerEvents="none">
            <MaterialCommunityIcons name="heart" size={96} color="#FF2D55" />
          </Animated.View>

          {/* ── Mute indicator ── */}
          {showMuteIcon && (
            <Animated.View style={[styles.muteOverlay, muteStyle]} pointerEvents="none">
              <MaterialCommunityIcons
                name={isMuted ? 'volume-off' : 'volume-high'}
                size={36}
                color="white"
              />
            </Animated.View>
          )}

          {/* ── Video progress bar ── */}
          {isVideoItem && isActive && (
            <View style={styles.progressTrack} pointerEvents="none">
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          )}
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  touchArea: { flex: 1 },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  pauseIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    pointerEvents: 'none',
  },
  muteOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -35,
    marginTop: -35,
    width: 70,
    height: 70,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
    pointerEvents: 'none',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    zIndex: 40,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
  },
});