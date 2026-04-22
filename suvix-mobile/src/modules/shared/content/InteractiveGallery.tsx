import React, { useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useProfilePosts } from '../../../hooks/useProfilePosts';
import { useProfileReels } from '../../../hooks/useProfileReels';
import { VerifiedBadge } from '../../../components/VerifiedBadge';
import { InteractiveMediaItem } from './InteractiveMediaItem';
import { GALLERY_MOCKS } from '../../../constants/galleryMocks';
const DEFAULT_AVATAR = require('../../../../assets/defualtprofile.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n ?? 0);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

interface InteractiveGalleryProps {
  userId: string;
  mode: 'ALL' | 'REELS';
  initialIndex?: number;
}

export const InteractiveGallery: React.FC<InteractiveGalleryProps> = ({
  userId,
  mode,
  initialIndex = 0,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(
    typeof initialIndex === 'string' ? parseInt(initialIndex, 10) : initialIndex
  );
  const [layoutHeight, setLayoutHeight] = useState(0);
  const isLayoutReady = layoutHeight > 0;

  const postsQuery = useProfilePosts(mode === 'ALL' ? userId : (undefined as any));
  const reelsQuery = useProfileReels(mode === 'REELS' ? userId : (undefined as any));
  const query = mode === 'ALL' ? postsQuery : reelsQuery;
  const rawItems = query.data?.pages.flatMap((p: any) => p.items) ?? [];

  const items = useMemo(() => {
    if (!query.isLoading && rawItems.length === 0) {
      return mode === 'REELS'
        ? GALLERY_MOCKS.filter(m => m.type === 'VIDEO')
        : GALLERY_MOCKS;
    }
    return rawItems;
  }, [rawItems, query.isLoading, mode]);

  const onLayout = useCallback((e: any) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setLayoutHeight(h);
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems?.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <GalleryPage
        item={item}
        isActive={index === activeIndex}
        layoutHeight={layoutHeight}
        insets={insets}
      />
    ),
    [activeIndex, layoutHeight, insets],
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  if ((query.isLoading && items.length === 0) || !isLayoutReady) {
    return (
      <View style={styles.loader} onLayout={onLayout}>
        <ActivityIndicator color="#fff" size="large" />
        <Text style={styles.loaderText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Close button */}
      <TouchableOpacity
        style={[styles.closeBtn, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close" size={22} color="white" />
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        pagingEnabled
        vertical
        decelerationRate="fast"
        snapToInterval={layoutHeight}
        snapToAlignment="start"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60, minimumViewTime: 80 }}
        initialScrollIndex={activeIndex < items.length ? activeIndex : 0}
        getItemLayout={(_, index) => ({
          length: layoutHeight,
          offset: layoutHeight * index,
          index,
        })}
        onEndReached={() => query.hasNextPage && query.fetchNextPage()}
        onEndReachedThreshold={0.5}
        windowSize={3}
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
};

// ── Individual page ────────────────────────────────────────────────────────────

interface GalleryPageProps {
  item: any;
  isActive: boolean;
  layoutHeight: number;
  insets: any;
}

const GalleryPage = React.memo(({ item, isActive, layoutHeight, insets }: GalleryPageProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(item.stats?.likes ?? 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);

  const heartScale = useSharedValue(1);

  const author = item.author ?? { name: 'SuviX Member', username: 'member' };
  const isVideoItem = item.media?.type === 'VIDEO' || item.type === 'VIDEO';

  const handleLike = useCallback(() => {
    if (!isLiked) {
      setIsLiked(true);
      setLikeCount(c => c + 1);
    }
    heartScale.value = withSpring(1.3, { damping: 8 }, () => {
      heartScale.value = withSpring(1);
    });
  }, [isLiked]);

  const handleDoubleTapLike = useCallback(() => {
    setIsLiked(true);
    setLikeCount(c => (isLiked ? c : c + 1));
  }, [isLiked]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const caption = item.caption ?? '';
  const captionTruncated = caption.length > 80 && !showFullCaption;

  return (
    <View style={{ width: SCREEN_WIDTH, height: layoutHeight, backgroundColor: '#000' }}>
      {/* ── Media layer ── */}
      <InteractiveMediaItem
        item={item}
        isActive={isActive}
        onLike={handleDoubleTapLike}
      />

      {/* ── Bottom gradient overlay ── */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.88)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomOverlay, { paddingBottom: insets.bottom + 16 }]}
        pointerEvents="box-none"
      >
        {/* Author row */}
        <View style={styles.authorRow}>
          <Image
            source={author.profilePicture ? { uri: author.profilePicture } : DEFAULT_AVATAR}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          <View style={styles.authorInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.fullName} numberOfLines={1}>{author.name}</Text>
              {author.roleGroup && (
                <VerifiedBadge
                  category={author.category}
                  roleGroup={author.roleGroup}
                  size={13}
                />
              )}
            </View>
            <Text style={styles.username}>@{author.username}</Text>
          </View>

          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followingBtn]}
            onPress={() => setIsFollowing(v => !v)}
            activeOpacity={0.8}
          >
            <Text style={[styles.followText, isFollowing && styles.followingText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Caption */}
        {caption.length > 0 && (
          <TouchableOpacity
            onPress={() => setShowFullCaption(v => !v)}
            activeOpacity={0.9}
            style={styles.captionBox}
          >
            <Text style={styles.caption}>
              {captionTruncated ? caption.slice(0, 80) + '...' : caption}
              {captionTruncated && (
                <Text style={styles.captionMore}> more</Text>
              )}
            </Text>
          </TouchableOpacity>
        )}

        {/* Meta row */}
        <View style={styles.metaRow}>
          {isVideoItem && (
            <>
              <MaterialCommunityIcons name="play-circle-outline" size={11} color="rgba(255,255,255,0.45)" />
              <Text style={styles.metaText}>{formatCount(item.stats?.views ?? 0)} views</Text>
              <View style={styles.metaDot} />
            </>
          )}
          <MaterialCommunityIcons name="clock-outline" size={11} color="rgba(255,255,255,0.45)" />
          <Text style={styles.metaText}>{timeAgo(item.createdAt)}</Text>
        </View>
      </LinearGradient>

      {/* ── Top gradient (for status bar readability) ── */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {/* ── Side action bar ── */}
      <View style={[styles.sideBar, { bottom: insets.bottom + 100 }]}>
        {/* Like */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.85}>
          <Animated.View style={heartStyle}>
            <MaterialCommunityIcons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={32}
              color={isLiked ? '#FF2D55' : 'white'}
            />
          </Animated.View>
          <Text style={styles.actionCount}>{formatCount(likeCount)}</Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.85}>
          <MaterialCommunityIcons name="comment-outline" size={30} color="white" />
          <Text style={styles.actionCount}>Reply</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.85}>
          <MaterialCommunityIcons name="share-variant-outline" size={28} color="white" />
          <Text style={styles.actionCount}>Share</Text>
        </TouchableOpacity>

        {/* Bookmark */}
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.85}>
          <MaterialCommunityIcons name="bookmark-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

GalleryPage.displayName = 'GalleryPage';

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loader: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: 'rgba(255,255,255,0.5)', marginTop: 12, fontSize: 13, fontWeight: '600' },

  closeBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  topGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 80,
    zIndex: 30,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16,
    paddingTop: 40,
    zIndex: 35,
  },

  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 2, borderColor: '#A855F7',
  },
  authorInfo: { flex: 1, marginLeft: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fullName: {
    color: '#fff', fontSize: 14, fontWeight: '800',
    letterSpacing: 0.2, flexShrink: 1,
  },
  username: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 1 },
  followBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)',
    borderRadius: 8,
  },
  followingBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'transparent',
  },
  followText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  followingText: { color: 'rgba(255,255,255,0.7)' },

  captionBox: { marginBottom: 8, maxWidth: '82%' },
  caption: { color: '#fff', fontSize: 13.5, fontWeight: '500', lineHeight: 20 },
  captionMore: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600' },
  metaDot: {
    width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  sideBar: {
    position: 'absolute',
    right: 10,
    alignItems: 'center',
    gap: 20,
    zIndex: 45,
  },
  actionBtn: { alignItems: 'center', gap: 3 },
  actionCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});