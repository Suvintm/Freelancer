import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { TextInput } from 'react-native-gesture-handler';
import { YOUTUBE_ARCHIVE, YouTubeVideo } from './youtubeMockData';

const { width } = Dimensions.get('window');

const VIDEO_CATEGORIES = [
  {
    id: 'cat1',
    title: 'Trending Vlogs',
    videos: [
      { id: 'v1', title: 'Day in Life: Tokyo Edition', channel: 'SuviX Travels', views: '1.2M', duration: '12:45', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=400' },
      { id: 'v2', title: 'I Built a Secret Base', channel: 'WonderBuilds', views: '8.5M', duration: '22:15', image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=400' },
      { id: 'v3', title: 'Hiking the Everest', channel: 'PeakPros', views: '3.4M', duration: '15:30', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400' },
    ]
  },
  {
    id: 'cat2',
    title: 'Cinematic VFX',
    videos: [
      { id: 'v4', title: 'The Future of AI Rendering', channel: 'VFX Master', views: '450K', duration: '08:20', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=400' },
      { id: 'v5', title: 'Impossible Transitions', channel: 'FlowState', views: '2.1M', duration: '10:45', image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400' },
      { id: 'v6', title: 'Marvel Style Grading', channel: 'ColoristLab', views: '900K', duration: '14:10', image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400' },
    ]
  },
  {
    id: 'cat3',
    title: 'Tech & Gadgets',
    videos: [
      { id: 'v7', title: 'iPhone 16 Pro: 1 Month Later', channel: 'TechReview', views: '15M', duration: '11:05', image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=400' },
      { id: 'v8', title: 'The $10,000 Setup', channel: 'DeskSpace', views: '5.2M', duration: '13:40', image: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=400' },
      { id: 'v9', title: 'Best Cameras 2024', channel: 'OpticFocus', views: '1.1M', duration: '20:00', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400' },
    ]
  }
];

const BILLBOARD_PICKS = [
  { id: 'p1', title: 'The Future of Motion', desc: 'Discover how VFX is changing in 2024.', tag: 'PERSONALIZED', image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800' },
  { id: 'p2', title: 'Secret Tokyo Spots', desc: 'A cinematic journey through hidden Japan.', tag: 'BASED ON INTERESTS', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=400' },
  { id: 'p3', title: 'MrBeast: Behind the Scenes', desc: 'How the world\'s biggest creator scales.', tag: 'TRENDING', image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=400' },
  { id: 'p4', title: 'Studio Gear Guide', desc: 'The essential kit for 2024 creators.', tag: 'HIDDEN GEM', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400' },
  { id: 'p5', title: 'AI Storytelling', desc: 'Crafting narratives with neural networks.', tag: 'NEW FOR YOU', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=400' },
];

interface YouTubeTabPortalProps {
  searchQuery: string;
  isSearching: boolean;
  suggestions: string[];
  searchResults: YouTubeVideo[];
  onSuggestionPress: (query: string) => void;
}

const VideoProductCard = ({ video }: { video: any }) => {
  const { isDarkMode } = useTheme();

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: video.image }} style={styles.image} />
        <View style={styles.durationBadge}><Text style={styles.durationText}>{video.duration}</Text></View>
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.imageOverlay} />
      </View>
      <View style={styles.cardContent}>
        <Text numberOfLines={1} style={styles.channelName}>{video.channel}</Text>
        <Text numberOfLines={2} style={[styles.videoTitle, { color: isDarkMode ? 'white' : 'black' }]}>{video.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{video.views} views</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>New</Text>
        </View>
        <TouchableOpacity style={styles.watchBtn}>
          <Text style={styles.watchBtnText}>WATCH</Text>
          <Ionicons name="play" size={12} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export const YouTubeTabPortal = ({
  searchQuery,
  isSearching,
  suggestions,
  searchResults,
  onSuggestionPress
}: YouTubeTabPortalProps) => {
  const { isDarkMode, theme } = useTheme();
  const scrollRef = React.useRef<ScrollView>(null);
  const [activeSlide, setActiveSlide] = React.useState(0);
  
  // 🛰️ Auto-Slide Engine (3s Cycle)
  React.useEffect(() => {
    if (isSearching) return; // Pause auto-slide during search
    const timer = setInterval(() => {
      const nextSlide = (activeSlide + 1) % BILLBOARD_PICKS.length;
      scrollRef.current?.scrollTo({ x: nextSlide * (width - 40), animated: true });
      setActiveSlide(nextSlide);
    }, 3000);

    return () => clearInterval(timer);
  }, [activeSlide, isSearching]);

  return (
    <View style={styles.container}>
      {/* 💡 Instant Suggestion Dropdown (Anchored to top of content) */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionAnchor}>
          <View style={[styles.suggestionBox, { backgroundColor: isDarkMode ? '#1A1A1A' : 'white' }]}>
            {suggestions.map((s, i) => (
              <TouchableOpacity 
                key={i} 
                style={styles.suggestionItem} 
                onPress={() => onSuggestionPress(s)}
              >
                <Ionicons name="trending-up" size={14} color="gray" />
                <Text style={[styles.suggestionText, { color: isDarkMode ? 'white' : 'black' }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {!isSearching || (isSearching && searchResults.length === 0 && searchQuery.length > 0 && suggestions.length > 0) ? (
        <>
          {/* 🚀 Premier Discoveries Pager */}
          <View style={[styles.sectionHeader, { marginBottom: 30 }]}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? 'white' : 'black' }]}>Premier Discoveries</Text>
          </View>
          <View style={styles.pagerWrapper}>
            <ScrollView 
              ref={scrollRef}
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const x = e.nativeEvent.contentOffset.x;
                setActiveSlide(Math.round(x / (width - 40)));
              }}
              scrollEventThrottle={16}
            >
              {BILLBOARD_PICKS.map((pick, i) => (
                <View key={pick.id} style={styles.billboardContainer}>
                  <Image source={{ uri: pick.image }} style={styles.billboardImage} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.billboardOverlay}>
                    <View style={styles.trendingBadge}><Text style={styles.trendingText}>{pick.tag}</Text></View>
                    <Text numberOfLines={1} style={styles.billboardTitle}>{pick.title}</Text>
                    <Text numberOfLines={1} style={styles.billboardDesc}>{pick.desc}</Text>
                    <TouchableOpacity style={styles.heroWatchBtn}>
                      <Text style={styles.heroWatchText}>WATCH NOW</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              ))}
            </ScrollView>
            <View style={styles.dotsRow}>
              {BILLBOARD_PICKS.map((_, i) => (
                <View key={i} style={[styles.dotItem, { backgroundColor: activeSlide === i ? '#ef4444' : 'rgba(255,255,255,0.2)' }]} />
              ))}
            </View>
          </View>

          {/* 🎥 Category Shelves */}
          {VIDEO_CATEGORIES.map(category => (
            <View key={category.id} style={styles.shelf}>
              <View style={styles.shelfHeader}>
                <Text style={[styles.shelfTitle, { color: isDarkMode ? 'white' : 'black' }]}>{category.title}</Text>
                <TouchableOpacity><Text style={styles.viewMore}>View More</Text></TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelfScroll}>
                {category.videos.map(video => (
                  <VideoProductCard key={video.id} video={video} />
                ))}
              </ScrollView>
            </View>
          ))}
        </>
      ) : (
        <View style={styles.searchResultsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? 'white' : 'black' }]}>
              {searchResults.length > 0 ? `Results for "${searchQuery}"` : 'Searching...'}
            </Text>
          </View>
          <View style={styles.resultsGrid}>
            {searchResults.length > 0 ? (
              searchResults.map(video => (
                <VideoProductCard key={video.id} video={video} />
              ))
            ) : (
              <View style={styles.noResults}>
                <Ionicons name="search-outline" size={48} color="gray" />
                <Text style={styles.noResultsText}>Try searching for "Home" or "VFX"</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 60,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 0,
    marginBottom: 0,
    zIndex: 200,
  },
  suggestionAnchor: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  suggestionBox: {
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchResultsContainer: {
    marginTop: 10,
  },
  resultsGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  noResults: {
    flex: 1,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  noResultsText: {
    marginTop: 12,
    fontSize: 14,
    color: 'gray',
    fontWeight: '600',
  },
  billboardContainer: {
    width: width - 40,
    height: 280,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
  },
  pagerWrapper: {
    paddingHorizontal: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 15,
  },
  dotItem: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  billboardImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  billboardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 24,
  },
  trendingBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  trendingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  billboardTitle: {
    color: 'white',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  billboardDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  heroWatchBtn: {
    backgroundColor: 'white',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
  },
  heroWatchText: {
    color: 'black',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  shelf: {
    marginTop: 35,
  },
  sectionHeader: {
    paddingHorizontal: 26,
    marginBottom: 15,
    marginTop: 25,
  },
  shelfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
  },
  shelfTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  viewMore: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ef4444',
  },
  shelfScroll: {
    paddingLeft: 20,
    gap: 15,
  },
  card: {
    width: 240,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  durationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
  },
  cardContent: {
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  channelName: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    opacity: 0.6,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'gray',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'gray',
  },
  watchBtn: {
    backgroundColor: '#ef4444',
    marginTop: 15,
    height: 36,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  watchBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
