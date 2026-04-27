import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenContainer } from '../../src/components/shared/ScreenContainer';
import { useAuthStore } from '../../src/store/useAuthStore';
import { ExploreSearchV2 } from '../../src/modules/explore/ExploreSearchV2';
import { ServiceGrid } from '../../src/modules/explore/ServiceGrid';
import { CreatorCarousel } from '../../src/modules/explore/CreatorCarousel';
import { MarketplaceSection } from '../../src/modules/explore/MarketplaceSection';
import { ExploreTabs, ExploreTabType } from '../../src/modules/explore/ExploreTabs';
import { EditorDiscovery } from '../../src/modules/explore/redesign/EditorDiscovery';
import { RentalView } from '../../src/modules/explore/RentalView';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Stack } from 'expo-router';

// 💎 Redesign Components
import { VideoDoubleRow } from '../../src/modules/explore/redesign/VideoDoubleRow';
import { CreatorMasterCard } from '../../src/modules/explore/redesign/CreatorMasterCard';
import { ReelCinematicStrip } from '../../src/modules/explore/redesign/ReelCinematicStrip';
import { RentalPodGrid } from '../../src/modules/explore/redesign/RentalPodGrid';
import { YouTubeTabPortal } from '../../src/modules/explore/redesign/YouTubeTabPortal';
import { YOUTUBE_ARCHIVE, YouTubeVideo } from '../../src/modules/explore/redesign/youtubeMockData';
import { api } from '../../src/api/client';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

const MOCK_EDITORS = [
  { id: 'e1', name: 'Alex VFX', subtitle: 'After Effects Expert', rating: 4.9, tag: 'PRO', image: 'https://images.unsplash.com/photo-1540331547168-8b63109225b7?q=80&w=400' },
  { id: 'e2', name: 'Studio Flow', subtitle: 'Premiere Pro Specialist', rating: 4.8, tag: 'TOP', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400' },
  { id: 'e3', name: 'Colorist Joy', subtitle: 'DaVinci Resolve', rating: 5.0, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400' },
];

const MOCK_GEAR = [
  { id: 'g1', name: 'Sony A7S III', subtitle: '4K 120fps Camera', price: '₹2500/day', tag: 'RENTAL', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400' },
  { id: 'g2', name: 'DJI Ronin RS3', subtitle: '3-Axis Stabilizer', price: '₹1200/day', image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=400' },
  { id: 'g3', name: 'Aputure 600d', subtitle: 'Studio Lighting', price: '₹1800/day', image: 'https://images.unsplash.com/photo-1589134719002-5883506fb95e?q=80&w=400' },
];

const MOCK_TALENT = [
  { id: 't1', name: 'Rhythm Souls', subtitle: 'Soul & Jazz Vocalist', rating: 4.9, tag: 'ARTIST', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400' },
  { id: 't2', name: 'Beat Smith', subtitle: 'Hip Hop Producer', rating: 4.7, image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=400' },
];

const TAB_THEMES: Record<ExploreTabType, { bg: string, active: string }> = {
  'All': { bg: '#0A0A0A', active: '#818cf8' },
  'Editors': { bg: '#0A0A0A', active: '#a855f7' },
  'YT Videos': { bg: '#0A0A0A', active: '#ef4444' },
  'Rental': { bg: '#0A0A0A', active: '#10b981' },
  'Promoters': { bg: '#0A0A0A', active: '#3b82f6' },
  'Singers': { bg: '#0A0A0A', active: '#f43f5e' },
};

export default function ExploreScreen({ scrollY: globalScrollY }: { scrollY?: SharedValue<number> }) {
  const { isDarkMode, theme } = useTheme();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ExploreTabType>('All');
  const [ytVideos, setYtVideos] = useState<YouTubeVideo[]>([]);
  const [isLoadingYt, setIsLoadingYt] = useState(false);

  // 🔍 [SEARCH INTELLIGENCE] Shared State for All Portals
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);

  // 📡 [DATA FETCHING] YouTube Explore Content
  useEffect(() => {
    if (activeTab === 'YT Videos' && ytVideos.length === 0) {
      fetchYouTubeVideos();
    }
  }, [activeTab]);

  const fetchYouTubeVideos = async () => {
    try {
      setIsLoadingYt(true);
      const response = await api.get('/youtube-creator/explore');
      if (response.data?.success) {
        setYtVideos(response.data.data);
      }
    } catch (error) {
      console.error('❌ [EXPLORE] Failed to fetch YT videos:', error);
    } finally {
      setIsLoadingYt(false);
    }
  };

  const currentTheme = TAB_THEMES[activeTab];
  // Always use dark background for the header
  const headerBg = '#0A0A0A'; 
  const isHeaderDark = true; 

  // 🛰️ [REANIMATED] Scroll-Driven Header Animation
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (globalScrollY) {
        globalScrollY.value = event.contentOffset.y;
      }
    },
  });

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'Editors': return 'Search for VFX Pros, Animators...';
      case 'YT Videos': return 'Search YouTube videos...';
      case 'Rental': return 'Search for Cameras, Drones, Lighting...';
      case 'Promoters': return 'Search for Brands, Agencies...';
      case 'Singers': return 'Search for Vocalists, Composers...';
      default: return 'Discover creators, editors, gear...';
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.length > 0) {
      setIsSearching(true);
      if (activeTab === 'YT Videos') {
        const matches = YOUTUBE_ARCHIVE.filter(v => 
          v.title.toLowerCase().includes(text.toLowerCase()) || 
          v.category.toLowerCase().includes(text.toLowerCase())
        );
        const suggs = Array.from(new Set(matches.map(m => {
          if (m.title.toLowerCase().startsWith(text.toLowerCase())) return m.title;
          return m.category;
        }))).slice(0, 5);
        setSuggestions(suggs);
      }
    } else {
      setIsSearching(false);
      setSuggestions([]);
      setSearchResults([]);
    }
  };

  const onExecuteSearch = (query: string) => {
    setSearchQuery(query);
    setSuggestions([]);
    if (activeTab === 'YT Videos') {
      const results = YOUTUBE_ARCHIVE.filter(v => 
        v.title.toLowerCase().includes(query.toLowerCase()) || 
        v.category.toLowerCase().includes(query.toLowerCase()) ||
        v.description.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
    }
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case 'All':
        return (
          <View style={styles.redesignContainer}>
            {/* 👤 Personalized Greeting Headline */}
            <View style={styles.personalizedHeader}>
              <Text style={[styles.recommendationText, { color: theme.textSecondary }]}>
                Today's Recommendation for
              </Text>
              <Text style={[styles.userNameText, { color: isDarkMode ? 'white' : 'black' }]}>
                {user?.firstName ? (user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)) : (user?.displayName ? (user.displayName.charAt(0).toUpperCase() + user.displayName.slice(1)) : 'You')}
              </Text>
            </View>

            {/* 🎞️ 1. Cinematic Reel Strip (High Energy Entry) */}
            <ReelCinematicStrip />

            {/* 🎬 2. Suggested Videos (2-Row High Density) */}
            <VideoDoubleRow />

            {/* 💎 3. Creator Spotlight (Master Identity Pods) */}
            <CreatorMasterCard />

            {/* ⚙️ 4. Premium Rental Grid (Industrial Tiles) */}
            <RentalPodGrid />

            {/* 🖋️ 5. Suggested Editors (More to come) */}
            <View style={styles.footerInfo}>
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                Discovering more creators...
              </Text>
            </View>
          </View>
        );
      case 'Editors': return <EditorDiscovery />;
      case 'YT Videos': 
        return (
          <YouTubeTabPortal 
            videos={ytVideos}
            isLoading={isLoadingYt}
            searchQuery={searchQuery}
            isSearching={isSearching}
            suggestions={suggestions}
            searchResults={searchResults}
            onSuggestionPress={onExecuteSearch}
            onRefresh={fetchYouTubeVideos}
          />
        );
      case 'Rental': return <RentalView />;
      default:
        return (
          <View style={styles.placeholderContainer}>
            <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
              {activeTab} Portal Coming Soon
            </Text>
          </View>
        );
    }
  };

  return (
    <ScreenContainer isScrollable={false} hasHeader={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.main, { backgroundColor: theme.background }]}>
        <Animated.ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <View style={styles.headerBuffer} />
          {renderContent()}
          <View style={styles.footerSpacer} />
        </Animated.ScrollView>

        {/* 🧊 INFINITE TRANSPARENCY HEADER SECTION */}
        <View style={styles.headerWrapper}>
          {/* 🌊 Lighter Smoked Waterfall Gradient (Permanent) */}
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={['#0A0A0A', 'rgba(10,10,10,0.8)', 'rgba(10,10,10,0.4)', 'rgba(10,10,10,0.1)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </View>
          
          <View style={{ paddingTop: insets.top }}>
            {/* 🌈 Adaptive Role-Based Glow for Cinematic Depth */}
            <LinearGradient
              colors={[`${currentTheme.active}50`, 'transparent']}
              style={styles.topOverlay}
            />
            
            <ExploreTabs 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
              activeColor={currentTheme.active}
              isDarkHeader={true}
            />

            {activeTab === 'All' || activeTab === 'YT Videos' ? (
              activeTab === 'All' ? (
                <View style={styles.heroHeader}>
                  <Text style={[styles.heroTitle, { color: 'white' }]}>
                    Explore SuviX
                  </Text>
                  <Text style={[styles.heroSubtitle, { color: 'rgba(255,255,255,0.7)' }]}>
                    Empowering your creative vision
                  </Text>
                </View>
              ) : null
            ) : (
              <ExploreSearchV2 
                placeholder={getSearchPlaceholder()} 
                activeColor={currentTheme.active}
                value={searchQuery}
                onChangeText={handleSearchChange}
                onSubmitEditing={() => onExecuteSearch(searchQuery)}
              />
            )}
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 10,
    overflow: 'hidden',
    zIndex: 100,
  },
  scrollContent: {
    paddingTop: 0,
  },
  headerBuffer: {
    height: 180, // Approximate header height for initial spacing
  },
  topOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: 100,
  },
  placeholderContainer: {
    flex: 1,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
  },
  redesignContainer: {
    paddingTop: 10,
    paddingBottom: 40,
  },
  footerInfo: {
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
    fontStyle: 'italic',
  },
  footerSpacer: {
    height: 100,
  },
  heroHeader: {
    paddingHorizontal: 22,
    marginTop: 15,
    marginBottom: 10,
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bgLogo: {
    width: 42,
    height: 42,
    borderRadius: 10,
    marginLeft: 2, // Tight integration
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: -0.1,
    opacity: 0.7,
  },
  personalizedHeader: {
    paddingHorizontal: 22,
    marginBottom: 20,
    marginTop: 10,
  },
  recommendationText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.8,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: -2,
  },
});


