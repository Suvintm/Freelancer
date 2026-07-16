// Version: 2.0.1 - Search Engine Removed
import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Dimensions, Animated as RNAnimated, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 46) / 2;

// ─── Type Definitions ──────────────────────────────────────────────────────
interface LiveVideo {
  id: string;
  videoId: string;
  title: string;
  description?: string;
  thumbnail: string;
  publishedAt?: string;
  channel: {
    name: string;
    thumbnail?: string;
    subscribers: number;
  };
}

interface YouTubeTabPortalProps {
  videos: LiveVideo[];
  isLoading: boolean;
  onRefresh?: () => void;
}

// ─── Video Card Component ──────────────────────────────────────────────────
const VideoCard = ({
  video, isFullWidth = false, onPress,
}: {
  video: LiveVideo;
  isFullWidth?: boolean;
  onPress?: () => void;
}) => {
  const { isDarkMode } = useTheme();
  const subsText =
    video.channel.subscribers > 1_000_000
      ? `${(video.channel.subscribers / 1_000_000).toFixed(1)}M`
      : video.channel.subscribers > 1_000
      ? `${(video.channel.subscribers / 1_000).toFixed(1)}K`
      : String(video.channel.subscribers);

  const dateText = video.publishedAt
    ? new Date(video.publishedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'Recent';

  const openVideo = () => {
    if (onPress) { onPress(); return; }
    if (video.videoId) {
      const url = `https://www.youtube.com/watch?v=${video.videoId}`;
      Linking.openURL(url);
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        isFullWidth && styles.fullWidthCard
      ]} 
      activeOpacity={0.82} 
      onPress={openVideo}
    >
      <View style={[styles.thumbContainer, isFullWidth && styles.fullWidthThumb]}>
        <Image source={{ uri: video.thumbnail }} style={styles.thumb} resizeMode="cover" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={StyleSheet.absoluteFillObject} />
      </View>
      <View style={[styles.cardMeta, isFullWidth && styles.fullWidthMeta]}>
        <Text numberOfLines={2} style={[styles.cardTitle, isFullWidth && styles.fullWidthTitle, { color: isDarkMode ? '#F1F1F1' : '#0F0F0F' }]}>
          {video.title}
        </Text>
        <View style={styles.channelRow}>
          {video.channel.thumbnail ? (
            <Image source={{ uri: video.channel.thumbnail }} style={styles.channelAvatar} />
          ) : (
            <View style={[styles.channelAvatar, styles.channelAvatarFallback]}>
              <Ionicons name="person" size={8} color="white" />
            </View>
          )}
          <Text numberOfLines={1} style={styles.channelName}>{video.channel.name}</Text>
        </View>
        <Text style={styles.metaLine}>{subsText} subs · {dateText}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Skeleton Card ─────────────────────────────────────────────────────────
const SkeletonCard = () => {
  const anim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        RNAnimated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.65] });
  return (
    <View style={styles.card}>
      <RNAnimated.View style={[styles.thumbContainer, styles.skeletonBox, { opacity }]} />
      <View style={styles.cardMeta}>
        <RNAnimated.View style={[styles.skeletonLine, { width: '92%', opacity }]} />
        <RNAnimated.View style={[styles.skeletonLine, { width: '65%', marginTop: 6, opacity }]} />
        <RNAnimated.View style={[styles.skeletonLine, { width: '45%', marginTop: 4, opacity }]} />
      </View>
    </View>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
export const YouTubeTabPortal = ({ videos, isLoading, onRefresh }: YouTubeTabPortalProps) => {
  const { isDarkMode } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const billboardVideos = videos.slice(0, 5);

  useEffect(() => {
    if (billboardVideos.length === 0) return;
    const t = setInterval(() => {
      const next = (activeSlide + 1) % billboardVideos.length;
      scrollRef.current?.scrollTo({ x: next * (width - 40), animated: true });
      setActiveSlide(next);
    }, 4500);
    return () => clearInterval(t);
  }, [activeSlide, billboardVideos.length]);

  const textColor = isDarkMode ? '#F1F1F1' : '#0F0F0F';
  const subTextColor = isDarkMode ? '#AAAAAA' : '#606060';

  return (
    <View style={styles.root}>
      {/* Cinematic Billboard */}
      {billboardVideos.length > 0 && (
        <View style={styles.billboardWrap}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Featured</Text>
          </View>
          <ScrollView
            ref={scrollRef}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onScroll={(e) => setActiveSlide(Math.round(e.nativeEvent.contentOffset.x / (width - 40)))}
            scrollEventThrottle={16}
            style={{ paddingLeft: 20 }}
          >
            {billboardVideos.map((v, i) => (
              <TouchableOpacity
                key={v.id}
                activeOpacity={0.9}
                style={styles.billboard}
                onPress={() => v.videoId && Linking.openURL(`https://www.youtube.com/watch?v=${v.videoId}`)}
              >
                <Image source={{ uri: v.thumbnail }} style={styles.billboardImg} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.billboardGrad}>
                  <View style={styles.billboardBadgeRow}>
                    <View style={[styles.badge, { backgroundColor: i === 0 ? '#ef4444' : '#222' }]}>
                      <Text style={styles.badgeText}>{i === 0 ? 'NEWEST' : 'FEATURED'}</Text>
                    </View>
                    <Text style={styles.billboardChannel} numberOfLines={1}>{v.channel.name}</Text>
                  </View>
                  <Text style={styles.billboardTitle} numberOfLines={2}>{v.title}</Text>
                  <TouchableOpacity style={styles.watchBtn}>
                    <Ionicons name="play" size={11} color="black" />
                    <Text style={styles.watchBtnText}>WATCH</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.dotsRow}>
            {billboardVideos.map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: activeSlide === i ? '#ef4444' : '#555', width: activeSlide === i ? 16 : 5 }]} />
            ))}
          </View>
        </View>
      )}

      {/* Discovery Grid */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Discovery Feed</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={16} color={subTextColor} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.grid}>{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</View>
      ) : videos.length > 0 ? (
        <View style={styles.grid}>{videos.map((v) => <VideoCard key={v.id} video={v} />)}</View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="videocam-outline" size={56} color={isDarkMode ? '#333' : '#CCC'} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>No videos yet</Text>
          <Text style={[styles.emptySubtitle, { color: subTextColor }]}>Check back after creators sync their channels</Text>
        </View>
      )}
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { paddingBottom: 80, flex: 1, paddingTop: 10 },

  // Billboard
  billboardWrap: { marginTop: 8, marginBottom: 16 },
  billboard: {
    width: width - 40, height: 210, borderRadius: 20,
    overflow: 'hidden', backgroundColor: '#111', marginRight: 12,
  },
  billboardImg: { width: '100%', height: '100%', opacity: 0.75 },
  billboardGrad: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 16 },
  billboardBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  badgeText: { color: 'white', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  billboardChannel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700', flex: 1 },
  billboardTitle: { color: 'white', fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginBottom: 12 },
  watchBtn: {
    backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6,
  },
  watchBtnText: { color: 'black', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 10 },
  dot: { height: 5, borderRadius: 3 },

  // Section Header
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, marginBottom: 12, marginTop: 4,
  },
  sectionTitle: { fontSize: 17, fontWeight: '900', letterSpacing: -0.4 },
  refreshBtn: { padding: 4 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 13, gap: 12, marginBottom: 8 },

  // Video Card
  card: { width: CARD_WIDTH },
  fullWidthCard: { width: '100%', marginBottom: 10 },
  thumbContainer: {
    width: '100%', aspectRatio: 16 / 9, borderRadius: 14,
    overflow: 'hidden', backgroundColor: '#1A1A1A', marginBottom: 8,
  },
  fullWidthThumb: { borderRadius: 16, marginBottom: 12 },
  thumb: { width: '100%', height: '100%' },
  cardMeta: { paddingHorizontal: 2 },
  fullWidthMeta: { paddingHorizontal: 4 },
  cardTitle: { fontSize: 12, fontWeight: '700', lineHeight: 16, marginBottom: 5 },
  fullWidthTitle: { fontSize: 16, lineHeight: 22, marginBottom: 8 },
  channelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  channelAvatar: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#333' },
  channelAvatarFallback: { alignItems: 'center', justifyContent: 'center' },
  channelName: { color: '#ef4444', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', flex: 1 },
  metaLine: { color: '#888', fontSize: 10, fontWeight: '500' },

  // Skeleton
  skeletonBox: { backgroundColor: '#2A2A2A' },
  skeletonLine: { height: 10, borderRadius: 5, backgroundColor: '#2A2A2A' },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 16, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
