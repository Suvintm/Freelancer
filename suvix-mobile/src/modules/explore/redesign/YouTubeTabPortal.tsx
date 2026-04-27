// Version: 2.0.0 - Production Search Engine: Cursor Pagination + Click Tracking
import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, Image,
  TouchableOpacity, Dimensions, TextInput, ActivityIndicator,
  Keyboard, Animated as RNAnimated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { api } from '../../../api/client';
import { YouTubeVideo } from './youtubeMockData';

const { width, height } = Dimensions.get('window');
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
  // Legacy props kept for compatibility
  searchQuery?: string;
  isSearching?: boolean;
  suggestions?: string[];
  searchResults?: YouTubeVideo[];
  onSuggestionPress?: (q: string) => void;
}

// ─── Video Card Component ──────────────────────────────────────────────────
const VideoCard = ({
  video, isRelated = false, isFullWidth = false, onPress,
}: {
  video: LiveVideo;
  isRelated?: boolean;
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
      import('react-native').then(({ Linking }) => Linking.openURL(url));
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        isRelated && styles.relatedCard, 
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
  const overlayAnim = useRef(new RNAnimated.Value(0)).current;

  // Search logic states
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSugLoading, setIsSugLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<LiveVideo[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [resultCount, setResultCount] = useState(0);
  const [relatedVideos, setRelatedVideos] = useState<LiveVideo[]>([]);

  // Cursor-based pagination state
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Analytics: session ID (generated once per app session)
  const sessionId = useMemo(() => Math.random().toString(36).slice(2), []);
  const searchStartTime = useRef<number>(0);


  useEffect(() => {
    RNAnimated.timing(overlayAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

  // Billboard
  const [activeSlide, setActiveSlide] = useState(0);
  const billboardVideos = videos.slice(0, 5);
  useEffect(() => {
    if (isSearchActive || isFocused || billboardVideos.length === 0) return;
    const t = setInterval(() => {
      const next = (activeSlide + 1) % billboardVideos.length;
      scrollRef.current?.scrollTo({ x: next * (width - 40), animated: true });
      setActiveSlide(next);
    }, 4500);
    return () => clearInterval(t);
  }, [activeSlide, isSearchActive, isFocused, billboardVideos.length]);

  // Debounced suggestions
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 1) { setSuggestions([]); setShowSuggestions(false); return; }
    setIsSugLoading(true);
    try {
      const res = await api.get('/youtube-creator/explore/suggestions', { params: { q } });
      if (res.data?.success) { 
        setSuggestions(res.data.data || []); 
        setShowSuggestions(true); 
      }
    } catch { setSuggestions([]); }
    finally { setIsSugLoading(false); }
  }, []);

  const onChangeText = (text: string) => {
    setQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (text.length === 0) {
      setSuggestions([]); 
      setShowSuggestions(false);
      setIsSearchActive(false); 
      setSearchResults([]); 
      setRelatedVideos([]);
      return;
    }
    debounceTimer.current = setTimeout(() => fetchSuggestions(text), 300);
  };

  const executeSearch = useCallback(async (q: string, cursor: string | null = null) => {
    if (!q.trim()) return;
    if (!cursor) {
      Keyboard.dismiss();
      setIsFocused(false);
      setShowSuggestions(false);
      setIsSearchActive(true);
      setIsSearchLoading(true);
      setSearchResults([]);
      setRelatedVideos([]);
      setNextCursor(null);
      setHasMore(false);
      searchStartTime.current = Date.now();
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params: Record<string, string> = { q: q.trim() };
      if (cursor) params.cursor = cursor;

      const res = await api.get('/youtube-creator/explore/search', { params });
      if (res.data?.success) {
        const results: LiveVideo[] = res.data.data || [];
        if (cursor) {
          setSearchResults(prev => [...prev, ...results]);
        } else {
          setSearchResults(results);
          setResultCount(res.data.total || results.length);
          // Fetch related only on first page and only when results are sparse
          if (results.length <= 3 && results.length > 0) {
            try {
              const relRes = await api.get(`/youtube-creator/explore/related/${results[0].id}`);
              if (relRes.data?.success) setRelatedVideos(relRes.data.data || []);
            } catch { /* silent */ }
          }
        }
        setNextCursor(res.data.nextCursor || null);
        setHasMore(res.data.hasMore || false);
      }
    } catch { if (!cursor) setSearchResults([]); }
    finally { setIsSearchLoading(false); setIsLoadingMore(false); }
  }, []);

  // Triggered when user scrolls to bottom of search results
  const loadMoreResults = useCallback(() => {
    if (!hasMore || isLoadingMore || !query) return;
    executeSearch(query, nextCursor);
  }, [hasMore, isLoadingMore, query, nextCursor, executeSearch]);

  // Click tracking — fire-and-forget, never blocks UI
  const trackClick = useCallback((video: LiveVideo, position: number) => {
    const timeToClick = searchStartTime.current
      ? Date.now() - searchStartTime.current
      : null;
    api.post('/youtube-creator/explore/click', {
      query,
      videoId: video.id,
      position,
      sessionId,
      timeToClickMs: timeToClick,
    }).catch(() => { /* silent — analytics failure must never affect UX */ });
  }, [query, sessionId]);

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setIsSearchActive(false);
    setSearchResults([]);
    setRelatedVideos([]);
    setResultCount(0);
    setNextCursor(null);
    setHasMore(false);
    setIsLoadingMore(false);
    setIsFocused(false);
    Keyboard.dismiss();
  };

  const textColor = isDarkMode ? '#F1F1F1' : '#0F0F0F';
  const subTextColor = isDarkMode ? '#AAAAAA' : '#606060';
  const surfaceBg = isDarkMode ? '#1A1A1A' : '#F5F5F5';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E5E5E5';
  const dropdownBg = isDarkMode ? '#1F1F1F' : '#FFFFFF';

  return (
    <View style={styles.root}>
      {/* ── YouTube-style Search Bar ────────────────────────── */}
      <View style={styles.searchHeaderRow}>
        <View style={[styles.searchBar, { backgroundColor: surfaceBg, borderColor, flex: 1 }]}>
          <Ionicons name="search" size={18} color={subTextColor} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search videos, channels..."
            placeholderTextColor={subTextColor}
            value={query}
            onFocus={() => setIsFocused(true)}
            onChangeText={onChangeText}
            onSubmitEditing={() => executeSearch(query)}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="never"
          />
          {isSugLoading && <ActivityIndicator size="small" color="#ef4444" style={{ marginRight: 8 }} />}
          {query.length > 0 && !isSugLoading && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={subTextColor} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[
            styles.searchBtn, 
            { backgroundColor: query.length > 0 ? '#ef4444' : (isDarkMode ? '#333' : '#EEE') }
          ]} 
          onPress={() => executeSearch(query)}
          activeOpacity={0.8}
          disabled={query.length === 0}
        >
          <Text style={[styles.searchBtnText, { color: query.length > 0 ? 'white' : subTextColor }]}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* ── Full Screen Search Overlay (YouTube Style) ──────────── */}
      {(isFocused || (showSuggestions && suggestions.length > 0)) && (
        <RNAnimated.View 
          style={[
            styles.searchOverlay, 
            { 
              backgroundColor: isDarkMode ? '#0A0A0A' : '#FFFFFF',
              opacity: overlayAnim,
              transform: [{ translateY: overlayAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
            }
          ]}
        >
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.suggestionScroll}>
            {suggestions.length > 0 ? (
              suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.suggestionRow, { borderBottomColor: borderColor }]}
                  onPress={() => { setQuery(s); setShowSuggestions(false); executeSearch(s); }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trending-up" size={18} color={subTextColor} style={styles.sugIcon} />
                  <Text style={[styles.suggestionText, { color: textColor }]} numberOfLines={1}>{s}</Text>
                  <TouchableOpacity onPress={() => setQuery(s)}>
                    <Ionicons name="arrow-back-outline" size={18} color={subTextColor} style={{ transform: [{ rotate: '135deg' }] }} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            ) : query.length > 0 ? (
              <View style={styles.searchPlaceholder}>
                <Text style={{ color: subTextColor, fontSize: 13 }}>Press Enter to search for "{query}"</Text>
              </View>
            ) : (
              <View style={styles.searchPlaceholder}>
                <Ionicons name="search" size={40} color={isDarkMode ? '#222' : '#EEE'} />
                <Text style={{ color: subTextColor, marginTop: 10 }}>Search anything on SuviX</Text>
              </View>
            )}
          </ScrollView>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => { setIsFocused(false); Keyboard.dismiss(); }}
            pointerEvents="none"
          />
        </RNAnimated.View>
      )}

      {/* ── Content ───────────────────────────────────────────── */}
      {!isFocused && (
        <View>
          {isSearchActive ? (
            <View style={styles.searchResultsWrap}>
              <View style={styles.resultHeader}>
                <Text style={[styles.resultCount, { color: subTextColor }]}>
                  {isSearchLoading
                    ? 'Searching...'
                    : <>{resultCount.toLocaleString()} result{resultCount !== 1 ? 's' : ''} for <Text style={{ color: textColor, fontWeight: '800' }}>"{query}"</Text></>
                  }
                </Text>
              </View>

              {isSearchLoading ? (
                <View style={styles.listResults}>{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</View>
              ) : searchResults.length > 0 ? (
                <>
                  <FlatList
                    data={searchResults}
                    keyExtractor={(v) => v.id}
                    scrollEnabled={false}
                    contentContainerStyle={styles.listResults}
                    renderItem={({ item: v, index }) => (
                      <VideoCard
                        key={v.id}
                        video={v}
                        isFullWidth
                        onPress={() => {
                          trackClick(v, index + 1);
                          if (v.videoId) {
                            import('react-native').then(({ Linking }) =>
                              Linking.openURL(`https://www.youtube.com/watch?v=${v.videoId}`)
                            );
                          }
                        }}
                      />
                    )}
                    onEndReached={loadMoreResults}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                      isLoadingMore ? (
                        <View style={styles.loadMoreIndicator}>
                          <ActivityIndicator size="small" color="#ef4444" />
                          <Text style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>Loading more...</Text>
                        </View>
                      ) : hasMore ? (
                        <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMoreResults}>
                          <Text style={styles.loadMoreBtnText}>Load More</Text>
                        </TouchableOpacity>
                      ) : searchResults.length > 0 ? (
                        <Text style={styles.endOfResults}>· End of results ·</Text>
                      ) : null
                    }
                  />
                  {relatedVideos.length > 0 && (
                    <View style={styles.relatedSection}>
                      <View style={styles.relatedHeader}>
                        <View style={[styles.relatedDivider, { backgroundColor: borderColor }]} />
                        <Text style={[styles.relatedLabel, { color: subTextColor }]}>You might also like</Text>
                        <View style={[styles.relatedDivider, { backgroundColor: borderColor }]} />
                      </View>
                      <View style={styles.grid}>
                        {relatedVideos.map((v) => <VideoCard key={v.id} video={v} isRelated />)}
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={56} color={isDarkMode ? '#333' : '#CCC'} />
                  <Text style={[styles.emptyTitle, { color: textColor }]}>No results found</Text>
                  <Text style={[styles.emptySubtitle, { color: subTextColor }]}>Try different keywords or check spelling</Text>
                </View>
              )}
            </View>
          ) : (
            <>
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
                        onPress={() => v.videoId && import('react-native').then(({ Linking }) => Linking.openURL(`https://www.youtube.com/watch?v=${v.videoId}`))}
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
            </>
          )}
        </View>
      )}
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { paddingBottom: 80, flex: 1 },

  // Search Bar
  searchHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 6, gap: 10, zIndex: 1001 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', paddingVertical: 0 },
  clearBtn: { padding: 4 },
  searchBtn: { 
    height: 44, paddingHorizontal: 16, borderRadius: 12, 
    alignItems: 'center', justifyContent: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  searchBtnText: { color: 'white', fontSize: 13, fontWeight: '800' },

  // YouTube Style Search Overlay
  searchOverlay: {
    position: 'absolute',
    top: 54, // Just below search bar
    left: 0,
    right: 0,
    bottom: -height, // Cover more than screen
    zIndex: 1000,
    paddingTop: 10,
  },
  suggestionScroll: { flex: 1 },
  suggestionRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 15, 
    paddingHorizontal: 20, 
    paddingVertical: 14,
  },
  sugIcon: { opacity: 0.6 },
  suggestionText: { flex: 1, fontSize: 15, fontWeight: '500' },
  searchPlaceholder: { 
    paddingVertical: 100, 
    alignItems: 'center', 
    justifyContent: 'center',
    opacity: 0.5,
  },

  // Search Results
  searchResultsWrap: { marginTop: 8 },
  resultHeader: { paddingHorizontal: 20, marginBottom: 12 },
  resultCount: { fontSize: 13, fontWeight: '500' },
  listResults: { paddingHorizontal: 16, gap: 20, marginBottom: 20 },

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
  relatedCard: { opacity: 0.88 },
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

  // Related
  relatedSection: { marginTop: 20 },
  relatedHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginBottom: 14, gap: 10 },
  relatedDivider: { flex: 1, height: 1 },
  relatedLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },

  // Load more
  loadMoreIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  loadMoreBtn: { alignItems: 'center', paddingVertical: 14 },
  loadMoreBtnText: { color: '#ef4444', fontSize: 13, fontWeight: '700' },
  endOfResults: { textAlign: 'center', color: '#666', fontSize: 11, paddingVertical: 20, letterSpacing: 1 },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 16, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
