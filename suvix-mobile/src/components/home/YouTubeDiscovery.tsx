import React, { useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Image, 
  TouchableOpacity,
  Linking,
  Platform
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.88;
const CARD_HEIGHT = 220;
const SPACING = 12;
const FULL_ITEM_SIZE = CARD_WIDTH + SPACING;

const MOCK_VIDEOS = [
  {
    id: '1',
    title: 'Cinematic Color Grading Masterclass',
    thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1080',
    channel: 'SuviX Academy',
    channelAvatar: 'https://images.unsplash.com/photo-1540331547168-8b63109225b7?q=80&w=100',
    url: 'https://youtube.com'
  },
  {
    id: '2',
    title: 'Modern Workspace Tour 2026',
    thumbnail: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1080',
    channel: 'TechVibe Studio',
    channelAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100',
    url: 'https://youtube.com'
  },
  {
    id: '3',
    title: 'Future of Mobile Development',
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=1080',
    channel: 'DevInsights Pro',
    channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100',
    url: 'https://youtube.com'
  }
];

export const YouTubeDiscovery = () => {
  const { isDarkMode, theme } = useTheme();
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const handlePress = (url: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <LinearGradient
            colors={['#FF0000', '#D40000']}
            style={styles.ytIcon}
          >
            <Ionicons name="logo-youtube" size={14} color="#FFF" />
          </LinearGradient>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFF' : '#000' }]}>Video Highlights</Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Text style={[styles.seeAll, { color: theme.accent }]}>Explore Channel</Text>
          <Ionicons name="arrow-forward" size={14} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={FULL_ITEM_SIZE}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {MOCK_VIDEOS.map((item, index) => (
          <YouTubeCard 
            key={item.id} 
            item={item} 
            index={index} 
            scrollX={scrollX} 
            onPress={() => handlePress(item.url)}
            isDarkMode={isDarkMode}
            accent={theme.accent}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
};

const YouTubeCard = ({ item, index, scrollX, onPress, isDarkMode, accent }: any) => {
  const inputRange = [
    (index - 1) * FULL_ITEM_SIZE,
    index * FULL_ITEM_SIZE,
    (index + 1) * FULL_ITEM_SIZE
  ];

  const cardStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.96, 1, 0.96],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }]
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [-50, 0, 50],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateX }]
    };
  });

  return (
    <Animated.View style={[styles.card, cardStyle, { borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
      <TouchableOpacity 
        activeOpacity={0.95} 
        onPress={onPress}
        style={styles.cardTouch}
      >
        <View style={styles.imageContainer}>
          <Animated.Image 
            source={{ uri: item.thumbnail }} 
            style={[styles.thumbnail, imageStyle]} 
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
            style={styles.vignette}
          />
          
          <View style={styles.topActions}>
             <BlurView intensity={30} tint="light" style={styles.categoryBadge}>
                <Text style={styles.categoryText}>PREMIUM CONTENT</Text>
             </BlurView>
             <TouchableOpacity style={styles.saveBtn}>
                <BlurView intensity={20} tint="light" style={styles.iconCircle}>
                    <Feather name="bookmark" size={16} color="#FFF" />
                </BlurView>
             </TouchableOpacity>
          </View>

          {/* Bottom Branding & Action Area */}
          <BlurView 
            intensity={isDarkMode ? 40 : 60} 
            tint={isDarkMode ? 'dark' : 'light'} 
            style={styles.infoArea}
          >
            <View style={styles.contentRow}>
              <View style={styles.mainInfo}>
                 <View style={styles.channelRow}>
                    <Image source={{ uri: item.channelAvatar }} style={styles.channelAvatar} />
                    <Text style={styles.channelName}>{item.channel}</Text>
                 </View>
                 <Text style={styles.videoTitle} numberOfLines={1}>{item.title}</Text>
              </View>

              <TouchableOpacity style={[styles.watchBtn, { backgroundColor: '#FF0000' }]} onPress={onPress}>
                <Text style={styles.watchText}>WATCH</Text>
                <Ionicons name="play" size={12} color="#FFF" />
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ytIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingRight: width - CARD_WIDTH - 16,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: SPACING,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#000',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 18,
      },
      android: {
        elevation: 12,
      }
    })
  },
  cardTouch: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  thumbnail: {
    width: CARD_WIDTH * 1.3,
    height: CARD_HEIGHT,
    position: 'absolute',
    left: -CARD_WIDTH * 0.15,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  categoryText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  infoArea: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 16,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mainInfo: {
    flex: 1,
    gap: 4,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  channelAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  channelName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  videoTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  watchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  watchText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  }
});
