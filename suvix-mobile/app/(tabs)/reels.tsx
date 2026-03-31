import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  StatusBar, 
  FlatList, 
  Dimensions, 
  Pressable,
  Text
} from 'react-native';
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

const { height: SCREEN_HEIGHT } = Dimensions.get('screen');

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
 * PRODUCTION-GRADE REELS SCREEN (UI PERFECTION PHASE)
 * Features:
 * 1. Scale-Down Reanimated effect (95% scale when comments open).
 * 2. Immersive Full-Screen List (FlatList used as placeholder for FlashList).
 * 3. Integrated Ad/Reel card switching.
 */
export default function ReelsScreen() {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
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
        const newItems = res.data.reels;
        setReels(prev => [...prev, ...newItems]);
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

  React.useEffect(() => {
    fetchReels(1);
  }, []);

  // — PRODUCTION: Unified Feed Logic (Ad Injection) —
  const combinedFeed = React.useMemo(() => {
    const feed: any[] = [];
    reels.forEach((reel, index) => {
      feed.push({ ...reel, id: reel._id, type: 'reel' });
      // Inject Ad every 3 reels
      if ((index + 1) % 3 === 0) {
        const ad = APP_ADS[0]; 
        feed.push({ ...ad, id: `ad_${index}` });
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
      // Error handling: Fetching reels again or rolling back would be done here in full production
    }
  }, []);

  // — PRODUCTION: Viewability Tracking Logic —
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveReelId(viewableItems[0].item.id);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80 
  }).current;

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'ad') {
       return (
         <ReelAdCard 
           ad={item} 
           isActive={activeReelId === item.id}
           onSkip={() => console.log('Ad Skiped')}
           onCTA={() => console.log('CTA Pressed')}
         />
       );
    }

    return (
      <ReelItem 
        reel={item}
        isActive={activeReelId === item.id}
        onLike={() => handleLike(item.id)}
        onComment={() => toggleComments(item.id)}
        onShare={() => console.log('Share')}
        onMute={() => setIsMuted(prev => !prev)}
        isMuted={isMuted}
      />
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* 1. SCALE-DOWN CONTAINER (The Reels Feed) */}
      <Animated.View style={[styles.mainContainer, animatedContainerStyle]}>
        <FlatList
          data={combinedFeed}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={SCREEN_HEIGHT}
          decelerationRate="fast"
          
          // — PRODUCTION OPTIMIZATIONS —
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
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
    backgroundColor: '#050505',
  },
  cardContainer: {
    height: SCREEN_HEIGHT,
    width: '100%',
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0A',
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
