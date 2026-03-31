import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Pressable,
  Text,
  BackHandler,
  FlatList,
  useWindowDimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';
import { ReelItem } from '../../src/components/Reels/ReelItem';
import { ReelAdCard } from '../../src/components/Reels/ReelAdCard';
import { X } from 'lucide-react-native';
import { api } from '../../src/api/client';
import { Reel } from '../../src/types/reel';
import { useNavigation } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// PRODUCTION: AD FALLBACKS
const APP_ADS = [
  {
    id: 'ad_1',
    type: 'ad' as const,
    companyName: 'SuviX Premium',
    title: 'Unlock ad-free experience and premium content.',
    ctaText: 'GET PREMIUM',
    websiteDisplay: 'suvix.in/premium'
  }
];

/**
 * PRODUCTION-GRADE REELS SCREEN (STABILIZED ELITE EDITION)
 * Features:
 * 1. Highly Optimized FlatList for 60fps virtualization.
 * 2. Dynamic ViewHeight measurement for pixel-perfect snapping.
 * 3. Integrated Ad/Reel card switching.
 */
export default function ReelsScreen({ onGoHome, isFocused = true }: { onGoHome?: () => void; isFocused?: boolean }) {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const { height: windowHeight } = useWindowDimensions();
  const [viewHeight, setViewHeight] = useState(windowHeight); 
  const flatListRef = useRef<FlatList>(null);
  
  // — ANIMATION SHARED VALUES —
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const borderRadius = useSharedValue(0);
  const drawerY = useSharedValue(SCREEN_HEIGHT);

  const toggleComments = useCallback((id: string | null) => {
    setActiveCommentId(id);
    if (id) {
       // Scale Down Effect
       scale.value = withSpring(0.95);
       translateY.value = withSpring(-20);
       borderRadius.value = withSpring(25);
       drawerY.value = withSpring(SCREEN_HEIGHT * 0.4); 
    } else {
       // Reset to Full Screen
       scale.value = withSpring(1);
       translateY.value = withSpring(0);
       borderRadius.value = withSpring(0);
       drawerY.value = withSpring(SCREEN_HEIGHT);
    }
  }, [drawerY, scale, translateY, borderRadius]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
    borderRadius: borderRadius.value,
    overflow: 'hidden'
  }));

  const animatedDrawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drawerY.value }]
  }));

  // — PRODUCTION: Data Fetching —
  const fetchReels = useCallback(async (p: number) => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await api.get('/reels/feed', { params: { page: p, limit: 10 } });
      if (res.data.success) {
        const newItems = res.data.reels || [];
        
        setReels(prev => {
          if (p === 1) return newItems;
          
          // PRODUCTION: Deduplicate to prevent "Duplicate Key" errors
          const existingIds = new Set(prev.map(r => r._id));
          const uniqueNewItems = newItems.filter((item: any) => !existingIds.has(item._id));
          
          return [...prev, ...uniqueNewItems];
        });

        setHasMore(res.data.pagination.hasMore);
        setPage(p + 1);
        
        // Auto-set the first reel as active if none set
        if (!activeReelId && newItems.length > 0) {
          setActiveReelId(newItems[0]._id);
        }
      }
    } catch (e) {
      console.error('Fetch Reels Error:', e);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, activeReelId]);

  useEffect(() => {
    fetchReels(1);
    
    // — STABILITY: Handle Hardware Back Button (Redirect to Home) —
    const backAction = () => {
      if (onGoHome) {
        onGoHome();
        return true; 
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [onGoHome]);

  // — STABILITY: Snap recovery on Re-focus & Height Change —
  useEffect(() => {
    if (isFocused && activeReelId && reels.length > 0) {
      const index = combinedFeed.findIndex(item => item.id === activeReelId);
      if (index !== -1) {
        // PRODUCTION: Instant snap for better UX
        flatListRef.current?.scrollToIndex({ 
          index, 
          animated: false,
          viewPosition: 0 
        });

        // Fallback for slower rendering cycles
        const timer = setTimeout(() => {
          flatListRef.current?.scrollToIndex({ 
            index, 
            animated: false,
            viewPosition: 0
          });
        }, 60); // Reduced delay for faster stabilization
        return () => clearTimeout(timer);
      }
    }
  }, [isFocused, viewHeight, activeReelId]);

  // — PRODUCTION: Unified Feed Logic (Ad Injection) —
  const combinedFeed = React.useMemo(() => {
    const feed: any[] = [];
    reels.forEach((reel, index) => {
      feed.push({ ...reel, id: reel._id, type: 'reel' });
      // Inject Ad every 3 reels
      if ((index + 1) % 3 === 0) {
        const ad = APP_ADS[0]; 
        // PRODUCTION: Use a composite key to ensure Ad uniqueness across pagination
        feed.push({ ...ad, id: `ad_pos_${index}_${ad.id}`, type: 'ad' });
      }
    });
    return feed;
  }, [reels]);

  // — PRODUCTION: Interaction Handlers —
  const handleLike = useCallback(async (reelId: string) => {
    try {
      // 1. OPTIMISTIC UPDATE (Instant Feedback)
      setReels(prev => prev.map(r => {
        if (r._id === reelId) {
          const wasLiked = r.isLiked;
          return {
            ...r,
            isLiked: !wasLiked,
            likesCount: !wasLiked ? (r.likesCount + 1) : Math.max(0, r.likesCount - 1)
          };
        }
        return r;
      }));

      // 2. SERVER SYNC
      const res = await api.post(`/reels/${reelId}/like`);
      if (res.data.success) {
        setReels(prev => prev.map(r => 
          r._id === reelId ? { ...r, isLiked: res.data.liked, likesCount: res.data.likesCount } : r
        ));
      }
    } catch (e) {
      console.error('Like Error:', e);
    }
  }, []);

  const handleMute = useCallback(() => setIsMuted(prev => !prev), []);
  const handleSkipAd = useCallback(() => console.log('Ad Skipped'), []);
  const handleCTAAd = useCallback(() => console.log('CTA Pressed'), []);

  // — PRODUCTION: Viewability Tracking Logic —
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveReelId(viewableItems[0].item.id);
    }
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
    minimumViewTime: 0 
  }).current;

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: viewHeight,
    offset: viewHeight * index,
    index,
  }), [viewHeight]);

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'ad') {
       return (
         <ReelAdCard 
           ad={item} 
           isActive={isFocused && activeReelId === item.id}
           onSkip={handleSkipAd}
           onCTA={handleCTAAd}
           height={viewHeight}
         />
       );
    }

    return (
      <ReelItem 
        reel={item}
        isActive={isFocused && activeReelId === item.id}
        onLike={() => handleLike(item.id)}
        onComment={() => toggleComments(item.id)}
        onShare={() => console.log('Share')}
        onMute={() => setIsMuted(prev => !prev)}
        isMuted={isMuted}
        onBack={onGoHome}
        height={viewHeight}
      />
    );
  };

  return (
    <View 
      style={styles.root}
      onLayout={(e) => {
        const { height } = e.nativeEvent.layout;
        if (height > 0) setViewHeight(height);
      }}
    >
      <StatusBar hidden />
      
      {/* 1. SCALE-DOWN CONTAINER (The Reels Feed) */}
      <Animated.View style={[styles.mainContainer, animatedContainerStyle]}>
        <FlatList
          ref={flatListRef}
          data={combinedFeed}
          renderItem={renderItem}
          keyExtractor={(item: any) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={viewHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum={true}
          getItemLayout={getItemLayout}
          
          // — ELITE PERFORMANCE OPTIMIZATIONS —
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialScrollIndex={activeReelId ? combinedFeed.findIndex(i => i.id === activeReelId) : 0}
          onScrollToIndexFailed={(info) => {
             const wait = new Promise(resolve => setTimeout(resolve, 100));
             wait.then(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
             });
          }}
          
          // Standard Virtualization for 60fps on traditional architecture
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          removeClippedSubviews={true}

          // — INFINITE SCROLL —
          onEndReached={() => fetchReels(page)}
          onEndReachedThreshold={0.5}
        />
      </Animated.View>

      {/* 2. COMMENTS DRAWER (Placeholder Overlay) */}
      <Animated.View style={[styles.drawer, animatedDrawerStyle]}>
         <View style={styles.drawerHandle} />
         <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Comments</Text>
            <Pressable onPress={() => toggleComments(null)} style={styles.closeBtn}>
               <X color="#333" size={24} />
            </Pressable>
         </View>
         <View style={styles.drawerContent}>
            <Text style={styles.placeholderText}>Comment section UI parity next...</Text>
         </View>
      </Animated.View>

      {/* 3. DIM OVERLAY (Only when comments open) */}
      {activeCommentId && (
        <Pressable 
          style={styles.dimmingOverlay} 
          onPress={() => toggleComments(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#000', 
  },
  dimmingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 5,
  },
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.6,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 10,
    padding: 20,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeBtn: {
    padding: 4,
  },
  drawerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
  },
});
