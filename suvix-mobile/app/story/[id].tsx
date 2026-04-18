import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  StatusBar,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import PagerView from 'react-native-pager-view';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStories, StoryItem } from '../../src/hooks/useStories';

const DEFAULT_SLIDE_DURATION_MS = 5000;
const MIN_SLIDE_DURATION_MS = 2000;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CANVAS_WIDTH = screenWidth;
const CANVAS_HEIGHT = screenWidth * (16 / 9);
const CANVAS_OFFSET = Math.max(0, (screenHeight - CANVAS_HEIGHT) / 2);

export default function StoryEngineScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: allStories } = useStories();
  const pagerRef = useRef<PagerView>(null);

  const initialPageIndex = useMemo(() => {
    const resolvedId = Array.isArray(id) ? id[0] : id;
    const idx = allStories.findIndex((s) => s._id === resolvedId);
    return idx !== -1 ? idx : 0;
  }, [id, allStories]);

  const [currentPage, setCurrentPage] = useState(initialPageIndex);
  const [isPagerInteracting, setIsPagerInteracting] = useState(false);

  return (
    <View style={s.container}>
      <StatusBar hidden />
      <PagerView
        ref={pagerRef}
        style={s.pager}
        initialPage={initialPageIndex}
        orientation="horizontal"
        overScrollMode="never"
        offscreenPageLimit={1}
        onPageScrollStateChanged={(e) => {
          setIsPagerInteracting(e.nativeEvent.pageScrollState !== 'idle');
        }}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        {allStories.map((story, index) => (
          <View key={story._id} style={s.page}>
            {Math.abs(index - currentPage) <= 1 ? (
              <StoryThread
                story={story}
                isActive={index === currentPage}
                isPagerInteracting={isPagerInteracting}
                onClose={() => router.back()}
                onNextUser={() => {
                  if (index < allStories.length - 1) {
                    pagerRef.current?.setPage(index + 1);
                  } else {
                    router.back();
                  }
                }}
                onPrevUser={() => {
                  if (index > 0) {
                    pagerRef.current?.setPage(index - 1);
                  }
                }}
              />
            ) : (
              <View style={s.threadPlaceholder} />
            )}
          </View>
        ))}
      </PagerView>
    </View>
  );
}

function StoryThread({
  story,
  isActive,
  isPagerInteracting,
  onClose,
  onNextUser,
  onPrevUser,
}: {
  story: StoryItem;
  isActive: boolean;
  isPagerInteracting: boolean;
  onClose: () => void;
  onNextUser: () => void;
  onPrevUser: () => void;
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const slides = story.slides;
  const currentSlide = slides[slideIndex];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const progress = useSharedValue(0);
  const slideIndexRef = useRef(0);
  const isMountedRef = useRef(true);
  const isActiveRef = useRef(isActive);
  const canTapRef = useRef(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlockTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  const clearUnlockTapTimer = useCallback(() => {
    if (unlockTapTimerRef.current) {
      clearTimeout(unlockTapTimerRef.current);
      unlockTapTimerRef.current = null;
    }
  }, []);

  const stopProgress = useCallback(
    (resetValue: boolean) => {
      cancelAnimation(progress);
      if (resetValue) {
        progress.value = 0;
      }
    },
    [progress]
  );
  
  const isPausedRef = useRef(false);
  const holdStartTimeRef = useRef(0);

  const startAnimation = useCallback((startingProgress = 0) => {
    if (!isActiveRef.current || isPagerInteracting) return;
    const slide = slides[slideIndexRef.current];
    const duration = Math.max(slide?.durationMs || DEFAULT_SLIDE_DURATION_MS, MIN_SLIDE_DURATION_MS);
    const remainingDuration = duration * (1 - startingProgress);

    clearAdvanceTimer();
    progress.value = startingProgress;
    isPausedRef.current = false;

    progress.value = withTiming(1, {
      duration: remainingDuration,
      easing: Easing.linear,
    });

    advanceTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current || !isActiveRef.current || isPausedRef.current) return;
      handleNext();
    }, remainingDuration);
  }, [clearAdvanceTimer, handleNext, isPagerInteracting, progress, slides]);

  const lockTapBriefly = useCallback(() => {
    canTapRef.current = false;
    clearUnlockTapTimer();
    unlockTapTimerRef.current = setTimeout(() => {
      canTapRef.current = true;
      unlockTapTimerRef.current = null;
    }, 280);
  }, [clearUnlockTapTimer]);

  const handleNext = useCallback(() => {
    clearAdvanceTimer();
    stopProgress(true);

    if (slideIndexRef.current < slides.length - 1) {
      setSlideIndex((prev) => prev + 1);
      slideIndexRef.current = slideIndexRef.current + 1;
      lockTapBriefly();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      onNextUser();
    }
  }, [clearAdvanceTimer, lockTapBriefly, onNextUser, slides.length, stopProgress]);

  const handlePrev = useCallback(() => {
    clearAdvanceTimer();
    stopProgress(true);

    if (slideIndexRef.current > 0) {
      setSlideIndex((prev) => prev - 1);
      slideIndexRef.current = slideIndexRef.current - 1;
      lockTapBriefly();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      onPrevUser();
    }
  }, [clearAdvanceTimer, lockTapBriefly, onPrevUser, stopProgress]);

  const handleAddMore = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/story/create');
  }, [router]);

  useEffect(() => {
    isActiveRef.current = isActive;

    if (!isActive) {
      canTapRef.current = false;
      clearAdvanceTimer();
      stopProgress(true);
      setSlideIndex(0);
      slideIndexRef.current = 0;
      return;
    }

    lockTapBriefly();
  }, [clearAdvanceTimer, isActive, lockTapBriefly, stopProgress]);

  useEffect(() => {
    if (isPagerInteracting) {
      canTapRef.current = false;
      clearAdvanceTimer();
      stopProgress(false);
    } else if (isActiveRef.current) {
      lockTapBriefly();
    }
  }, [clearAdvanceTimer, isPagerInteracting, lockTapBriefly, stopProgress]);

  useEffect(() => {
    slideIndexRef.current = slideIndex;
    if (!isActiveRef.current || isPagerInteracting) return;
    
    // Always start fresh from 0 when slide index changes
    stopProgress(true);
    startAnimation(0);
  }, [startAnimation, isPagerInteracting, slideIndex, stopProgress]);

  useEffect(() => {
    const nextSlide = slides[slideIndex + 1];
    if (nextSlide?.image) {
      Image.prefetch(nextSlide.image).catch(() => {});
    }
  }, [slideIndex, slides]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearAdvanceTimer();
      clearUnlockTapTimer();
      stopProgress(false);
    };
  }, [clearAdvanceTimer, clearUnlockTapTimer, stopProgress]);

  const activeProgressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  return (
    <View style={s.threadContainer}>
      
      {/* 📱 9:16 RESTRICTED CANVAS Engine (Matching Create Mode) */}
      <View style={s.canvasBoundingBox}>
        <Image source={{ uri: currentSlide.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />

        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={s.gestureLayer}>
        <Pressable
          style={s.halfRegion}
          onPressIn={() => {
            holdStartTimeRef.current = Date.now();
            isPausedRef.current = true;
            clearAdvanceTimer();
            cancelAnimation(progress);
          }}
          onPressOut={() => {
            if (!isPausedRef.current) return;
            const heldTime = Date.now() - holdStartTimeRef.current;
            if (heldTime > 200) {
              startAnimation(progress.value);
            }
          }}
          onPress={() => {
            if (Date.now() - holdStartTimeRef.current > 200) return;
            if (!canTapRef.current || isPagerInteracting) return;
            handlePrev();
          }}
        />
        <Pressable
          style={s.halfRegion}
          onPressIn={() => {
            holdStartTimeRef.current = Date.now();
            isPausedRef.current = true;
            clearAdvanceTimer();
            cancelAnimation(progress);
          }}
          onPressOut={() => {
            if (!isPausedRef.current) return;
            const heldTime = Date.now() - holdStartTimeRef.current;
            if (heldTime > 200) {
              startAnimation(progress.value);
            }
          }}
          onPress={() => {
            if (Date.now() - holdStartTimeRef.current > 200) return;
            if (!canTapRef.current || isPagerInteracting) return;
            handleNext();
          }}
        />
      </View>

      <View style={[s.header, { top: Math.max(insets.top + 10, Platform.OS === 'ios' ? 44 : 24) }]}>
        <View style={s.progressContainer}>
          {slides.map((_, i) => (
            <View key={i} style={s.progressBarTrack}>
              {i < slideIndex && <View style={[s.progressBarLevel, { width: '100%' }]} />}
              {i > slideIndex && <View style={[s.progressBarLevel, { width: '0%' }]} />}
              {i === slideIndex && (
                <Animated.View
                  style={[s.progressBarLevel, s.progressBarAnimated, activeProgressStyle]}
                />
              )}
            </View>
          ))}
        </View>

        <View style={s.userInfoRow}>
          <View style={s.userMeta}>
            <Image source={{ uri: story.avatar }} style={s.miniAvatar} />
            <View>
              <Text style={s.username}>{story.username}</Text>
              <Text style={s.timestamp}>2h ago</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {currentSlide.caption && (
        <View style={s.captionWrapper} pointerEvents="none">
          <Text style={s.caption}>{currentSlide.caption}</Text>
        </View>
      )}

      {story.isUserStory && (
        <View style={s.footer}>
          <TouchableOpacity style={s.addBtn} onPress={handleAddMore}>
            <View style={s.plusCircle}>
              <Ionicons name="add" size={18} color="#fff" />
            </View>
            <Text style={s.addLabel}>Add Post</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  pager: { flex: 1 },
  page: { flex: 1 },
  threadPlaceholder: { flex: 1, backgroundColor: '#000' },
  threadContainer: { flex: 1, position: 'relative' },

  canvasBoundingBox: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    marginTop: CANVAS_OFFSET,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111',
  },

  gestureLayer: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 5 },
  halfRegion: { flex: 1 },

  header: {
    position: 'absolute',
    width: '100%',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
    width: '100%',
  },
  progressBarTrack: {
    height: 2,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarLevel: {
    height: '100%',
    backgroundColor: '#fff',
  },
  progressBarAnimated: {
    width: '100%',
    transformOrigin: 'left center',
  },

  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#fff' },
  username: { color: '#fff', fontSize: 13, fontWeight: '800' },
  timestamp: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' },
  closeBtn: { padding: 4 },

  captionWrapper: {
    position: 'absolute',
    bottom: 120,
    width: '100%',
    paddingHorizontal: 30,
    alignItems: 'center',
    zIndex: 8,
  },
  caption: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },

  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    width: '100%',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 6,
    borderRadius: 30,
    gap: 10,
    width: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  plusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addLabel: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
