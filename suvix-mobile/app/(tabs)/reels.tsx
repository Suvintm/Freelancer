import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, LayoutChangeEvent, ActivityIndicator, Text, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import { useReelsFeed } from '../../src/hooks/useReelsFeed';
import { Reel } from '../../src/types/reel';
import { repairUrl } from '../../src/utils/media';

/**
 * REELS SCREEN - PRODUCTION ADAPTIVE ENGINE (HLS + MP4 FALLBACK)
 * - Instagram-Style Hybrid Playback
 * - Adaptive Bitrate Support
 * - 60fps Scrolling 
 */

interface ReelSlideProps {
  item: Reel;
  height: number;
  isActive: boolean;
}

const ReelSlide = React.memo(({ item, height, isActive }: ReelSlideProps) => {
  // ✅ HYBRID PLAYBACK ENGINE:
  // If Cloudinary has finished transcoding to HLS (.m3u8), we use the adaptive stream.
  // If it's still 'processing', we fallback to the repaired .mp4 for instant viewing.
  const videoUrl = useMemo(() => {
    const url = (item.processingStatus === 'complete' && item.hlsUrl) 
      ? item.hlsUrl 
      : repairUrl(item.mediaUrl);
    
    console.log(`🎬 [REEL] ${item.title} | Status: ${item.processingStatus} | URL: ${url}`);
    return url;
  }, [item]);

  const thumbnailUrl = useMemo(() => repairUrl(item.thumbnailUrl), [item.thumbnailUrl]);

  // 1. Initialize Player
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = false;
    p.staysActiveInBackground = false;
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });

  // 📝 Exhaustive Debug Logging
  useEffect(() => {
    if (!player) return;
    // @ts-ignore - Catching raw error if it exists
    const errorMsg = player.error?.message || status === 'error' ? 'Unknown playback error' : 'none';
    console.log(`🎥 [PLAYER] ${item.title} | Global Status: ${status} | Error: ${errorMsg}`);
  }, [status, item.title]);

  // 2. Sync Playback with Ready State
  useEffect(() => {
    if (!player) return;
    if (isActive && status === 'readyToPlay') {
      console.log(`▶️ [PLAY] ${item.title} STARTING...`);
      player.play();
    } else if (!isActive && status === 'readyToPlay') {
      player.pause();
    }
  }, [isActive, status, item.title]);

  return (
    <View style={[styles.slide, { height }]}>
      {/* Background Thumbnail (Static Layer) */}
      {thumbnailUrl ? (
        <Image 
          source={{ uri: thumbnailUrl }} 
          style={StyleSheet.absoluteFill} 
          resizeMode="cover" 
        />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: '#050505' }]} />
      )}

      {/* Video View Layer */}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />

      {/* HD Badge (Visible when HLS is active) */}
      {item.processingStatus === 'complete' && (
        <View style={styles.hdBadge}>
          <Text style={styles.hdText}>HD</Text>
        </View>
      )}

      {/* Loading Overlay */}
      {(status === 'loading' || (isActive && status !== 'readyToPlay')) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="rgba(255,255,255,0.4)" />
        </View>
      )}

      {/* UI Overlay: Title & Editor (Phase 5 will add buttons here) */}
      <View style={styles.uiOverlay}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.author}>@{item.editor.name}</Text>
      </View>
    </View>
  );
});

export default function ReelsScreen() {
  const [measuredHeight, setMeasuredHeight] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const { 
    data, 
    isLoading, 
    isError, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useReelsFeed(10);

  const reels = useMemo(() => {
    return data?.pages.flatMap(page => page.reels) ?? [];
  }, [data]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    if (height > 0) {
      setMeasuredHeight(height);
    }
  }, []);

  const viewConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        const idx = viewableItems[0].index ?? 0;
        setActiveIndex(idx);
      }
    }
  ).current;

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#fff" /></View>;
  }

  if (isError) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle" size={48} color="#444" />
        <Text style={{ color: '#999', marginTop: 12 }}>Failed to load feed.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      {measuredHeight > 0 && reels.length > 0 && (
        <FlashList
          data={reels}
          estimatedItemSize={measuredHeight}
          keyExtractor={(item) => item._id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewConfig}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          renderItem={({ item, index }) => (
            <ReelSlide 
              item={item} 
              height={measuredHeight} 
              isActive={index === activeIndex}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hdBadge: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  hdText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  uiOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 80,
    padding: 10,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  author: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    marginTop: 4,
    fontWeight: '500',
  },
});
