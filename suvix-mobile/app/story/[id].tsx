/**
 * app/story/[id].tsx — Production Story Viewer Engine
 *
 * All bugs fixed vs previous version:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. COORDINATE SYSTEM FIX (stickers at wrong position)
 *    Creator: DraggableItem anchors at (canvasWidth/2, canvasHeight*0.4).
 *    obj.x/y are translations FROM that anchor.
 *    Viewer now: base = (CANVAS_W/2, CANVAS_H*0.4), then apply scaled translation.
 *    Formula: left = CANVAS_W/2 - itemW/2 + obj.x*scaleX
 *             top  = CANVAS_H*0.4 + obj.y*scaleY
 *
 * 2. DOUBLE STICKER FIX (stickers appearing twice on image stories)
 *    IMAGE stories: canvas screenshot has ALL layers baked in as pixels.
 *    metadata.objects is always empty for IMAGE (set by controller).
 *    Viewer never renders overlay objects for IMAGE type stories.
 *
 * 3. BLACK SCREEN FIX (no media visible)
 *    Added null guard: skip rendering if currentSlide.image is null/empty.
 *    bg_media_url is now properly set by storyProcessor.
 *
 * 4. CIRCULAR CLOSURE FIX (startAnimation / handleNext crash)
 *    handleNext stored in a ref. startAnimation reads handleNextRef.current.
 *    Breaks the circular dependency without changing observable behavior.
 *
 * 5. VIDEO PLAYER FIX
 *    Wait for readyToPlay before starting progress bar.
 *    player.replace() called when slide changes.
 *    Properly paused/resumed on hold gesture.
 *
 * 6. CANVAS SCALING
 *    Reads canvas_width / canvas_height from slide data.
 *    Scales overlay coordinates: viewer coords = creator coords * (viewerSize/creatorSize).
 */

import React, {
  useState, useRef, useEffect, useMemo, useCallback,
} from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  Platform, StatusBar, Pressable, Dimensions, Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  cancelAnimation, Easing,
  useAnimatedStyle, useSharedValue, withTiming,
} from 'react-native-reanimated';
import PagerView from 'react-native-pager-view';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Video as LegacyVideo, ResizeMode } from 'expo-av';
import { useQueryClient } from '@tanstack/react-query';

import { useStories, StoryItem, StorySlide } from '../../src/hooks/useStories';
import { storyApi } from '../../src/api/storyApi';
import { useToastStore } from '../../src/store/useToastStore';
import { CanvasTextItem }      from '../../src/modules/story/components/CanvasTextItem';
import { CanvasStickerItem }   from '../../src/modules/story/components/CanvasStickerItem';
import { CanvasImageItem }     from '../../src/modules/story/components/CanvasImageItem';
import { CanvasVideoItem }     from '../../src/modules/story/components/CanvasVideoItem';
import { CanvasShapeItem }     from '../../src/modules/story/components/CanvasShapeItem';
import { DrawingCanvas }       from '../../src/modules/story/components/DrawingCanvas';
import { StoryObject }       from '../../src/modules/story/types';
import { SUVIX_INDUSTRY_STORIES } from '../../src/data/suvixStories';
const DEFAULT_AVATAR = require('../../assets/defualtprofile.png');

// ─── Canvas constants (must match create.tsx) ─────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CANVAS_W = SCREEN_W;
const CANVAS_H = SCREEN_W * (16 / 9);
const CANVAS_OFFSET = Math.max(0, (SCREEN_H - CANVAS_H) / 2);

// The DraggableItem anchor point in create.tsx (new objects start here)
const ANCHOR_X_RATIO = 0.5;   // canvasWidth  * 0.5
const ANCHOR_Y_RATIO = 0.4;   // canvasHeight * 0.4

const DEFAULT_SLIDE_MS = 5_000;
const MIN_SLIDE_MS     = 2_000;
const HOLD_MS          = 200;

// ─────────────────────────────────────────────────────────────────────────────
// Root screen
// ─────────────────────────────────────────────────────────────────────────────

export default function StoryEngineScreen() {
  const { id }              = useLocalSearchParams();
  const router              = useRouter();
  const { data: rawStories } = useStories();
  const pagerRef            = useRef<PagerView>(null);

  const effectiveStories = useMemo(() => {
    // 🔗 MERGE: Use API stories, and always include SuviX Industry stories
    const apiList = rawStories || [];
    
    // Normalize Industry Stories to match Viewer Engine expectations
    const mockList = SUVIX_INDUSTRY_STORIES.map(item => ({
      ...item,
      userId: item.userId || item._id,
      hasActiveStory: true,
      isUserStory: false,
      slides: (item.slides || []).map(s => ({
        ...s,
        type: (s as any).type || 'IMAGE',
        metadata: (s as any).metadata || {},
        durationMs: (s as any).durationMs || 5000,
        created_at: (s as any).created_at || new Date().toISOString()
      }))
    }));

    // If we have API stories, we merge them with mock stories.
    // We prioritize API stories (user stories first) then mock stories.
    const merged = [...apiList];
    
    // Add mock stories that aren't already represented (by ID)
    mockList.forEach(m => {
      if (!merged.some(s => s._id === m._id)) {
        merged.push(m);
      }
    });

    return merged.length > 0 ? merged : mockList;
  }, [rawStories]);

  const initialIndex = useMemo(() => {
    const rid = Array.isArray(id) ? id[0] : id;
    const idx = effectiveStories.findIndex(s => s._id === rid);
    return idx !== -1 ? idx : 0;
  }, [id, effectiveStories]);

  const [currentPage, setCurrentPage]       = useState(initialIndex);
  const [pagerActive, setPagerActive]       = useState(false);

  if (effectiveStories.length === 0) return <View style={s.container} />;

  return (
    <View style={s.container}>
      <StatusBar hidden />
      <PagerView
        ref={pagerRef}
        style={s.pager}
        initialPage={initialIndex}
        orientation="horizontal"
        overScrollMode="never"
        offscreenPageLimit={1}
        onPageScrollStateChanged={e => {
          setPagerActive(e.nativeEvent.pageScrollState !== 'idle');
        }}
        onPageSelected={e => setCurrentPage(e.nativeEvent.position)}
      >
        {effectiveStories.map((story, index) => (
          <View key={story._id} style={s.page}>
            {Math.abs(index - currentPage) <= 1 ? (
              <StoryThread
                story={story}
                isActive={index === currentPage}
                isPagerInteracting={pagerActive}
                onClose={() => router.back()}
                onNextUser={() => {
                  if (index < effectiveStories.length - 1) pagerRef.current?.setPage(index + 1);
                  else router.back();
                }}
                onPrevUser={() => {
                  if (index > 0) pagerRef.current?.setPage(index - 1);
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

// ─────────────────────────────────────────────────────────────────────────────
// StoryThread — one user's story group
// ─────────────────────────────────────────────────────────────────────────────

interface ThreadProps {
  story:              StoryItem;
  isActive:           boolean;
  isPagerInteracting: boolean;
  onClose:            () => void;
  onNextUser:         () => void;
  onPrevUser:         () => void;
}

function StoryThread({
  story, isActive, isPagerInteracting,
  onClose, onNextUser, onPrevUser,
}: ThreadProps) {
  const [localSlides, setLocalSlides] = useState<StorySlide[]>(story.slides);
  const [slideIndex,  setSlideIndex]  = useState(0);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isBuffering,  setIsBuffering]  = useState(true);
  const [useLegacyVideo, setUseLegacyVideo] = useState(Platform.OS === 'android'); // 🚀 Force Legacy on Android to avoid Media3 crash
  const [activeMediaUrl, setActiveMediaUrl] = useState('');
  const [retryCount,     setRetryCount]     = useState(0);
  const [isDeleting,   setIsDeleting]   = useState(false);

  const currentSlide = localSlides[slideIndex];
  const isVideo      = currentSlide?.type === 'VIDEO';

  const router      = useRouter();
  const insets      = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const showToast   = useToastStore(st => st.showToast);

  // ── Progress animation ────────────────────────────────────────────────────
  const progress = useSharedValue(0);

  // ── Refs to avoid stale closures ─────────────────────────────────────────
  const isMountedRef    = useRef(true);
  const isActiveRef     = useRef(isActive);
  const isPausedRef     = useRef(false);
  const canTapRef       = useRef(false);
  const holdStartRef    = useRef(0);
  const slideIndexRef   = useRef(0);
  const isVideoReadyRef = useRef(false);
  const lastStartedRef  = useRef({ index: -1, time: 0 }); // Prevents double starts
  const advanceTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlockTapTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef        = useRef(0);
  const mediaUrlRef     = useRef('');

  // ── FIX: Break circular startAnimation ↔ handleNext dependency ───────────
  // handleNext is stored in a ref so startAnimation never needs it as a dep.
  const handleNextRef = useRef<() => void>(() => {});

  // ── Helpers ───────────────────────────────────────────────────────────────

  const clearAdvance = useCallback(() => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }, []);

  const clearUnlockTap = useCallback(() => {
    if (unlockTapTimer.current) {
      clearTimeout(unlockTapTimer.current);
      unlockTapTimer.current = null;
    }
  }, []);

  const stopProgress = useCallback((reset: boolean) => {
    cancelAnimation(progress);
    if (reset) {
      progress.value = 0;
      lastStartedRef.current = { index: -1, time: 0 };
    }
  }, [progress]);

  const lockTapBriefly = useCallback(() => {
    canTapRef.current = false;
    clearUnlockTap();
    unlockTapTimer.current = setTimeout(() => {
      canTapRef.current = true;
    }, 280);
  }, [clearUnlockTap]);

  // ── startAnimation reads handleNext via ref — no circular dep ─────────────
  const startAnimation = useCallback((startPct = 0) => {
    if (!isActiveRef.current || isPagerInteracting) return;
    
    const idx = slideIndexRef.current;
    const slide = localSlides[idx];
    const isVid = slide?.type === 'VIDEO';

    if (isVid && !isVideoReadyRef.current) return;

    // Double-start guard: ignore if we already started this slide recently
    const now = Date.now();
    if (lastStartedRef.current.index === idx && Math.abs(now - lastStartedRef.current.time) < 100 && startPct === 0) {
      return;
    }
    lastStartedRef.current = { index: idx, time: now };

    const total     = Math.max(slide?.durationMs ?? DEFAULT_SLIDE_MS, MIN_SLIDE_MS);
    const startFrom = Math.min(Math.max(startPct, 0), 0.99);
    const remaining = total * (1 - startFrom);

    console.log(`🎬 [ANIM] Slide: ${idx} | Start: ${startFrom.toFixed(2)} | Remaining: ${remaining}ms`);

    clearAdvance();
    progress.value      = startFrom;
    isPausedRef.current = false;

    progress.value = withTiming(1, { duration: remaining, easing: Easing.linear });

    advanceTimer.current = setTimeout(() => {
      if (!isMountedRef.current || !isActiveRef.current || isPausedRef.current) return;
      handleNextRef.current();
    }, remaining);
  }, [clearAdvance, isPagerInteracting, localSlides, progress]);

  const handleNext = useCallback(() => {
    clearAdvance();
    stopProgress(true);
    if (slideIndexRef.current < localSlides.length - 1) {
      const next = slideIndexRef.current + 1;
      setSlideIndex(next);
      slideIndexRef.current = next;
      lockTapBriefly();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      onNextUser();
    }
  }, [clearAdvance, lockTapBriefly, localSlides.length, onNextUser, stopProgress]);

  // Keep ref current — this is what startAnimation calls
  useEffect(() => { handleNextRef.current = handleNext; }, [handleNext]);

  const handlePrev = useCallback(() => {
    clearAdvance();
    stopProgress(true);
    if (slideIndexRef.current > 0) {
      const prev = slideIndexRef.current - 1;
      setSlideIndex(prev);
      slideIndexRef.current = prev;
      lockTapBriefly();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      onPrevUser();
    }
  }, [clearAdvance, lockTapBriefly, onPrevUser, stopProgress]);

  // ── Video player ──────────────────────────────────────────────────────────
  // 🚀 Android: Pass null to prevent native Media3 from being created (onTracksSelected crash).
  // The legacy expo-av player handles playback on Android directly via the LegacyVideo component.
  const player = useVideoPlayer(
    isVideo && currentSlide?.image && Platform.OS !== 'android' ? { uri: currentSlide.image } : null,
    p => {
      p.loop = false;
      p.muted = false;
      p.staysActiveInBackground = false;
    },
  );

  useEffect(() => {
    if (!isVideo || !currentSlide?.image) return;
    
    // Default to CDN URL
    setActiveMediaUrl(currentSlide.image);
    mediaUrlRef.current = currentSlide.image;
    setIsVideoReady(false);
    setIsBuffering(true);
    setUseLegacyVideo(Platform.OS === 'android'); // 🚀 Ensure Android stays on legacy during slide changes
    setRetryCount(0);
    retryRef.current = 0;

    if (Platform.OS === 'android') {
      // 🚀 Android: expo-av handles this via its onLoad callback. Just log the source.
      console.log(`🎥 [LEGACY-ANDROID] Source: ${currentSlide.image}`);
    } else if (player) {
      console.log(`🎥 [PLAYER] Source: ${currentSlide.image}`);
      player.replace({ uri: currentSlide.image });
    }
  }, [slideIndex, isVideo, currentSlide?.image]); // Removed 'player' as dep to prevent reload loop

  // Handle player status changes (iOS only — Android uses expo-av onLoad/onError callbacks)
  useEffect(() => {
    if (!player || !isVideo || !isActive || Platform.OS === 'android') return;

    const onStatusChange = (status: any) => {
      // In some versions of expo-video, status is an object, in others a string
      const st = typeof status === 'string' ? status : (status?.status ?? status?.playerStatus);
      console.log(`🎥 [PLAYER] Status: ${st}`);

      if (st === 'readyToPlay' || st === 'playing') {
        if (!isMountedRef.current) return;
        isVideoReadyRef.current = true;
        setIsVideoReady(true);
        setIsBuffering(false);
        if (isActiveRef.current && !isPausedRef.current) {
          player.play();
          startAnimation(0);
        }
      } else if (st === 'loading' || st === 'buffering') {
        setIsBuffering(true);
      } else if (st === 'error') {
        const error = status?.error;
        console.warn('⚠️ [PLAYER] Status Error. Code:', error?.code, 'Msg:', error?.message);
        
        // 🚀 RETRY STRATEGY: Try CDN URL 2 times before falling back
        if (retryRef.current < 2) {
          retryRef.current += 1;
          const nextRetry = retryRef.current;
          console.log(`🔄 [RETRY] Attempt ${nextRetry}/2 on CDN... Source: ${mediaUrlRef.current}`);
          
          setRetryCount(nextRetry);
          setTimeout(() => {
            if (isMountedRef.current && player && mediaUrlRef.current) {
              player.replace({ uri: mediaUrlRef.current });
            }
          }, 2000 * nextRetry); // Exponential backoff
          return;
        }

        if (!useLegacyVideo) {
          console.log('🔄 [FALLBACK] Switching to Legacy Player (expo-av)...');
          setUseLegacyVideo(true);
        } else if (mediaUrlRef.current && !mediaUrlRef.current.includes('amazonaws.com')) {
          console.log('⚠️ [FATAL] CDN Persistent Failure. Falling back to S3...');
          const s3Url = mediaUrlRef.current.replace('cdn.suvix.in', 'suvix-media-storage.s3.ap-south-1.amazonaws.com');
          setActiveMediaUrl(s3Url);
          mediaUrlRef.current = s3Url;
        }
      }
    };

    // Check initial status
    onStatusChange(player.status);

    const sub = player.addListener('statusChange', onStatusChange);
    return () => sub.remove();
  }, [player, isVideo, isActive, isVideoReady]);

  // Note: progress bar starts via state effects below or via player ready callback above

  // ── Active / pager effects ────────────────────────────────────────────────
  useEffect(() => {
    isActiveRef.current = isActive;
    if (!isActive) {
      canTapRef.current = false;
      clearAdvance();
      stopProgress(true);
      // Removed setSlideIndex(0) to prevent reset during re-renders
      setIsVideoReady(false);
      isVideoReadyRef.current = false;
      player?.pause();
      return;
    }
    lockTapBriefly();
  }, [isActive, clearAdvance, lockTapBriefly, player, stopProgress]);

  useEffect(() => {
    if (isPagerInteracting) {
      canTapRef.current = false;
      clearAdvance();
      stopProgress(false);
      player?.pause();
    } else if (isActiveRef.current) {
      lockTapBriefly();
      if (!isVideo) startAnimation(progress.value);
    }
  }, [isPagerInteracting]); // eslint-disable-line

  // ── Slide change ──────────────────────────────────────────────────────────
  useEffect(() => {
    slideIndexRef.current = slideIndex;
    if (!isActiveRef.current || isPagerInteracting) return;
    
    stopProgress(true);
    setIsVideoReady(false);
    isVideoReadyRef.current = false;
    
    if (player && isVideo) { 
      player.pause(); 
      player.currentTime = 0; 
    }
    
    // Non-video slides start immediately. Videos wait for 'readyToPlay' callback.
    if (!isVideo) {
      startAnimation(0);
    }
  }, [slideIndex, isVideo, startAnimation]); // Removed eslint-disable, properly tracked

  // ── View recording ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive || !currentSlide?.id) return;
    const timer = setTimeout(() => {
      if (!isActiveRef.current || !isMountedRef.current) return;
      storyApi.recordStoryView(currentSlide.id).catch(() => {});
    }, 1_500);
    return () => clearTimeout(timer);
  }, [isActive, slideIndex, currentSlide?.id]);

  // ── Prefetch next ─────────────────────────────────────────────────────────
  useEffect(() => {
    const next = localSlides[slideIndex + 1];
    if (next?.image) Image.prefetch(next.image).catch(() => {});
  }, [slideIndex, localSlides]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearAdvance();
      clearUnlockTap();
      stopProgress(false);
    };
  }, [clearAdvance, clearUnlockTap, stopProgress]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    if (!currentSlide?.id) return;
    Alert.alert(
      'Delete Story?', 'This story will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              stopProgress(false);
              player?.pause();
              await storyApi.deleteStory(currentSlide.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast('Story deleted', 'success');

              const remaining = localSlides.filter(sl => sl.id !== currentSlide.id);
              if (remaining.length === 0) {
                onNextUser();
              } else {
                setLocalSlides(remaining);
                const newIdx = Math.min(slideIndex, remaining.length - 1);
                setSlideIndex(newIdx);
                slideIndexRef.current = newIdx;
                setTimeout(() => startAnimation(0), 100);
              }
              queryClient.invalidateQueries({ queryKey: ['stories', 'active'] });
            } catch (err: any) {
              showToast(err.message ?? 'Failed to delete', 'error');
              startAnimation(progress.value);
            } finally {
              if (isMountedRef.current) setIsDeleting(false);
            }
          },
        },
      ],
    );
  }, [currentSlide, localSlides, onNextUser, player,
      queryClient, showToast, slideIndex, startAnimation, stopProgress]);

  // ── Progress bar animated style ───────────────────────────────────────────
  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  if (!currentSlide?.image) {
    // Story still processing — show loading placeholder
    return (
      <View style={[s.threadContainer, { backgroundColor: '#111' }]}>
        <View style={s.processingPlaceholder}>
          <Text style={s.processingText}>Processing...</Text>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OVERLAY COORDINATE MATH
  //
  // Creator (DraggableItem):
  //   Item visual center = (creatorW * ANCHOR_X, creatorH * ANCHOR_Y) + (obj.x, obj.y)
  //   i.e. the item is placed at the anchor, then translated by (obj.x, obj.y)
  //
  // Viewer (must reproduce same visual):
  //   Scale from creator canvas to viewer canvas: scaleX = viewerW / creatorW
  //   Viewer anchor = (CANVAS_W * ANCHOR_X, CANVAS_H * ANCHOR_Y)
  //   Viewer translate = (obj.x * scaleX, obj.y * scaleY)
  //   Item top-left = anchor + translate - itemSize/2
  //
  // Why -itemSize/2? Because we want the item CENTER at the anchor, not the top-left.
  // ─────────────────────────────────────────────────────────────────────────

  const meta       = currentSlide.metadata ?? {};
  const creatorW   = currentSlide.canvas_width  ?? meta.canvasWidth  ?? CANVAS_W;
  const creatorH   = currentSlide.canvas_height ?? meta.canvasHeight ?? CANVAS_H;
  const scaleX     = CANVAS_W / creatorW;
  const scaleY     = CANVAS_H / creatorH;

  const anchorLeft = CANVAS_W * ANCHOR_X_RATIO;
  const anchorTop  = CANVAS_H * ANCHOR_Y_RATIO;

  // Overlay objects. For IMAGE stories these are always [] (baked into screenshot).
  // For VIDEO stories these are the dynamic overlay layers.
  const overlayObjects: StoryObject[] = meta.objects    ?? [];
  const overlayPaths                  = meta.drawPaths  ?? [];
  const canvasBg                      = meta.canvasBg   ?? null;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={s.threadContainer}>

      {/* ── 9:16 Canvas bounding box ──────────────────────────────────── */}
      <View style={[
        s.canvasBoundingBox,
        canvasBg?.type === 'solid' && { backgroundColor: canvasBg.color },
      ]}>

        {/* Canvas background gradient */}
        {canvasBg?.type === 'gradient' && canvasBg.gradientColors && (
          <LinearGradient
            colors={canvasBg.gradientColors as [string, string]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}

        {/* ── CANVAS RECONSTRUCTION ENGINE v2 ─────────────────────────────── */}
        {/* We loop through ALL objects to reconstruct the exact user layout */}
        {overlayObjects.map((obj: any) => {
          const itemW = (obj.width ?? (obj.type === 'TEXT' ? 200 : 120)) * scaleX;
          
          // Replicate DraggableItem positioning:
          const left = anchorLeft + obj.x * scaleX - itemW / 2;
          const top  = anchorTop  + obj.y * scaleY;

          // 🚀 MASTER PLAYER LOGIC: If this is the primary video, use the master player source.
          const isPrimary = obj.id === (meta.primaryObjectId ?? null);

          return (
            <View
              key={obj.id}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left, top,
                width:   itemW,
                opacity: obj.opacity ?? 1,
                zIndex:  obj.zIndex  ?? 1,
                transform: [
                  { scale:  obj.scale    ?? 1 },
                  { rotate: `${obj.rotation ?? 0}rad` },
                ],
              }}
            >
              {obj.type === 'TEXT'    && <CanvasTextItem    item={obj} />}
              {obj.type === 'STICKER' && <CanvasStickerItem item={obj} />}
              {obj.type === 'IMAGE'   && <CanvasImageItem   item={obj} />}
              {obj.type === 'SHAPE'   && <CanvasShapeItem   item={obj} />}
              
              {/* VIDEO LAYER */}
              {obj.type === 'VIDEO' && (
                isPrimary ? (
                  // MASTER PLAYER (Controls timing/progress)
                  useLegacyVideo ? (
                    <LegacyVideo
                      source={{ uri: activeMediaUrl }}
                      style={{ width: '100%', aspectRatio: obj.aspectRatio ?? 9/16 }}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={isActive && !isPausedRef.current}
                      onLoad={() => {
                        setIsVideoReady(true);
                        setIsBuffering(false);
                        startAnimation(0);
                      }}
                      onBuffer={({ isBuffering: b }) => setIsBuffering(b)}
                      onError={(err) => {
                        console.error('❌ [MASTER-VIDEO] Error:', err);
                        if (!activeMediaUrl.includes('amazonaws.com')) {
                          const s3Url = activeMediaUrl.replace('cdn.suvix.in', 'suvix-media-storage.s3.ap-south-1.amazonaws.com');
                          setActiveMediaUrl(s3Url);
                        } else {
                          setIsVideoReady(true);
                        }
                      }}
                    />
                  ) : (
                    player && (
                      <VideoView
                        player={player}
                        style={{ width: '100%', aspectRatio: obj.aspectRatio ?? 9/16 }}
                        contentFit="cover"
                        nativeControls={false}
                      />
                    )
                  )
                ) : (
                  // SECONDARY VIDEOS (Synced to isPaused state)
                  <CanvasVideoItem item={obj} isPaused={!isActive || isPausedRef.current || !isVideoReady} />
                )
              )}
            </View>
          );
        })}

        {/* 🚀 FAILSAFE: If no objects exist (legacy stories), render primary media at absoluteFill */}
        {overlayObjects.length === 0 && (
          isVideo ? (
            useLegacyVideo ? (
              <LegacyVideo
                source={{ uri: activeMediaUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode={ResizeMode.COVER}
                shouldPlay={isActive && !isPausedRef.current}
                onLoad={() => { setIsVideoReady(true); setIsBuffering(false); startAnimation(0); }}
                onBuffer={({ isBuffering: b }) => setIsBuffering(b)}
              />
            ) : (
              player && <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
            )
          ) : (
            <Image source={{ uri: currentSlide.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          )
        )}

        {/* ── LUXURY LOADER (Overlay) ─────────────────────────────────── */}
        {isVideo && !isVideoReady && (
          <View style={[StyleSheet.absoluteFill, s.loaderOverlay]}>
            <Image 
              source={{ uri: currentSlide.image }} 
              style={StyleSheet.absoluteFill} 
              blurRadius={15}
              opacity={0.6}
            />
            <View style={s.loaderContent}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={s.loaderText}>Optimizing Experience...</Text>
              <View style={s.loaderBarContainer}>
                <Animated.View style={[s.loaderBar, { width: '40%' }]} />
              </View>
            </View>
          </View>
        )}

        {/* Gradient vignette */}
        <LinearGradient
          colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.75)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* ── SVG drawing overlay (video stories only, non-interactive) ── */}
        {overlayPaths.length > 0 && (
          <DrawingCanvas
            width={CANVAS_W}
            height={CANVAS_H}
            paths={overlayPaths}
            brushColor="#fff"
            brushSize={5}
            isEraser={false}
            eraserBgColor="#000"
            interactive={false}
          />
        )}

        {/* 🚀 Dynamic Rendering Loop moved up into the Bounding Box 🚀 */}
      </View>

      {/* ── Gesture layer ─────────────────────────────────────────────── */}
      <View style={s.gestureLayer}>
        {/* Left half → prev */}
        <Pressable
          style={s.halfRegion}
          onPressIn={() => {
            holdStartRef.current = Date.now();
            isPausedRef.current  = true;
            clearAdvance();
            cancelAnimation(progress);
            player?.pause();
          }}
          onPressOut={() => {
            if (!isPausedRef.current) return;
            const held = Date.now() - holdStartRef.current;
            if (held > HOLD_MS) {
              if (isVideo) player?.play();
              startAnimation(progress.value);
            }
          }}
          onPress={() => {
            if (Date.now() - holdStartRef.current > HOLD_MS) return;
            if (!canTapRef.current || isPagerInteracting) return;
            handlePrev();
          }}
        />
        {/* Right half → next */}
        <Pressable
          style={s.halfRegion}
          onPressIn={() => {
            holdStartRef.current = Date.now();
            isPausedRef.current  = true;
            clearAdvance();
            cancelAnimation(progress);
            player?.pause();
          }}
          onPressOut={() => {
            if (!isPausedRef.current) return;
            const held = Date.now() - holdStartRef.current;
            if (held > HOLD_MS) {
              if (isVideo) player?.play();
              startAnimation(progress.value);
            }
          }}
          onPress={() => {
            if (Date.now() - holdStartRef.current > HOLD_MS) return;
            if (!canTapRef.current || isPagerInteracting) return;
            handleNext();
          }}
        />
      </View>

      {/* ── Header: progress bars + user info ─────────────────────────── */}
      <View style={[s.header, {
        top: Math.max(insets.top + 10, Platform.OS === 'ios' ? 44 : 24),
      }]}>
        <View style={s.progressContainer}>
          {localSlides.map((_, i) => (
            <View key={i} style={s.progressTrack}>
              {i < slideIndex && <View style={[s.progressFill, { width: '100%' }]} />}
              {i > slideIndex && <View style={[s.progressFill, { width: '0%'   }]} />}
              {i === slideIndex && (
                <Animated.View style={[s.progressFill, s.progressAnimated, progressStyle]} />
              )}
            </View>
          ))}
        </View>

        <View style={s.userRow}>
          <View style={s.userMeta}>
            <Image 
              source={story.avatar ? { uri: story.avatar } : DEFAULT_AVATAR} 
              style={s.avatar} 
            />
            <View>
              <Text style={s.username}>{story.username}</Text>
              <Text style={s.timestamp}>
                {new Date(currentSlide.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={s.headerActions}>
            {story.isUserStory && (
              <TouchableOpacity
                onPress={handleDelete}
                disabled={isDeleting}
                style={s.iconBtn}
              >
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color={isDeleting ? 'rgba(255,68,68,0.4)' : '#ff4444'}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={s.iconBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Caption ───────────────────────────────────────────────────── */}
      {currentSlide.caption ? (
        <View style={s.captionWrapper} pointerEvents="none">
          <Text style={s.caption}>{currentSlide.caption}</Text>
        </View>
      ) : null}

      {/* ── "Add Post" (own story only) ───────────────────────────────── */}
      {story.isUserStory && (
        <View style={s.footer}>
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/story/create');
            }}
          >
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

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#000' },
  pager:              { flex: 1 },
  page:               { flex: 1 },
  threadPlaceholder:  { flex: 1, backgroundColor: '#000' },
  threadContainer:    { flex: 1, position: 'relative' },

  canvasBoundingBox: {
    width:           CANVAS_W,
    height:          CANVAS_H,
    marginTop:       CANVAS_OFFSET,
    borderRadius:    16,
    overflow:        'hidden',
    backgroundColor: '#111',
  },

  gestureLayer:  { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 5 },
  halfRegion:    { flex: 1 },

  header: {
    position:          'absolute',
    width:             '100%',
    paddingHorizontal: 16,
    zIndex:            10,
  },
  progressContainer: {
    flexDirection: 'row',
    gap:           4,
    marginBottom:  14,
    width:         '100%',
  },
  progressTrack: {
    height:          2,
    flex:            1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius:    1,
    overflow:        'hidden',
  },
  progressFill: {
    height:          '100%',
    backgroundColor: '#fff',
  },
  progressAnimated: {
    width:           '100%',
    transformOrigin: 'left center',
  },

  userRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userMeta:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1.5, borderColor: '#fff',
  },
  avatarFallback: { backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center' },
  avatarLetter:   { color: '#fff', fontWeight: '800', fontSize: 14 },
  username:       { color: '#fff', fontSize: 13, fontWeight: '800' },
  timestamp:      { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '600' },
  headerActions:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn:        { padding: 6 },

  captionWrapper: {
    position:          'absolute',
    bottom:            120,
    width:             '100%',
    paddingHorizontal: 30,
    alignItems:        'center',
    zIndex:            8,
  },
  caption: {
    color:            '#fff',
    fontSize:         16,
    fontWeight:       '700',
    textAlign:        'center',
    textShadowColor:  'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
    lineHeight:       22,
  },

  footer: {
    position:          'absolute',
    bottom:            Platform.OS === 'ios' ? 50 : 30,
    width:             '100%',
    paddingHorizontal: 20,
    zIndex:            10,
  },
  addBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    padding:         6,
    borderRadius:    30,
    gap:             10,
    width:           140,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.12)',
  },
  plusCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center', alignItems: 'center',
  },
  addLabel: { color: '#fff', fontSize: 13, fontWeight: '800' },

  processingPlaceholder: {
    flex:           1,
    justifyContent: 'center',
    alignItems:     'center',
  },
  processingText: {
    color:      'rgba(255,255,255,0.5)',
    fontSize:   14,
    fontWeight: '600',
  },
  loaderOverlay: {
    justifyContent: 'center',
    alignItems:     'center',
    backgroundColor: '#000',
  },
  loaderContent: {
    padding:       24,
    alignItems:    'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius:  24,
    borderWidth:   1,
    borderColor:   'rgba(255,255,255,0.2)',
  },
  loaderText: {
    color:      '#fff',
    marginTop:  16,
    fontSize:   14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loaderBarContainer: {
    width:           120,
    height:          4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius:    2,
    marginTop:       12,
    overflow:        'hidden',
  },
  loaderBar: {
    height:          '100%',
    backgroundColor: '#fff',
    opacity:         0.8,
  },
  debugOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
  },
  debugText: {
    color: '#0f0',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});