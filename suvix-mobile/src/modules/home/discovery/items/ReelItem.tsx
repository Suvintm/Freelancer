import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Share } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Video from 'react-native-video';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface ReelItemProps {
  data: {
    author: { name: string; avatar: string };
    thumbnail: string;
    videoUrl: string;
    title: string;
    views: string;
  };
  isVisible: boolean;
}

export const ReelItem = React.memo(({ data, isVisible }: ReelItemProps) => {
  const { isDarkMode, theme } = useTheme();
  const [isMuted, setIsMuted] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1); // Default Square
  
  const likeScale = useSharedValue(1);

  const toggleMute = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted(!isMuted);
  };

  const handleLike = (e: any) => {
    e.stopPropagation();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsLiked(!isLiked);
    
    likeScale.value = withSequence(
      withSpring(1.4, { damping: 10, stiffness: 100 }),
      withSpring(1, { damping: 10, stiffness: 100 })
    );
  };

  const onVideoLoad = (meta: any) => {
    setIsReady(true);
    if (meta.naturalSize) {
      const { width: vidWidth, height: vidHeight } = meta.naturalSize;
      if (vidWidth && vidHeight) {
        const naturalRatio = vidWidth / vidHeight;
        
        // 📐 PRECISION RATIO SYNC
        // Directly set the ratio to match the media exactly
        // Max vertical is 9:16 (0.5625)
        const MAX_RATIO = 9 / 16;
        const adaptiveRatio = Math.max(naturalRatio, MAX_RATIO);
        
        console.log(`🚀 [RATIO-SYNC] W:${vidWidth} H:${vidHeight} Applying Ratio: ${adaptiveRatio}`);
        setAspectRatio(adaptiveRatio);
      }
    }
  };

  const handleShare = async (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Check out this reel by ${data.author.name}: ${data.title}`,
        url: data.videoUrl,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const animatedLikeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: likeScale.value }]
    };
  });

  return (
    <View style={styles.container}>
      {/* 🎬 MAIN MEDIA CARD - SHAPE SHIFTS TO FIT MEDIA */}
      <TouchableOpacity 
        activeOpacity={0.95} 
        style={[styles.card, { aspectRatio }]} 
        onPress={handlePress}
      >
        {isVisible && (
          <Video
            source={{ 
              uri: data.videoUrl,
              headers: { 'User-Agent': 'Mozilla/5.0' }
            }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover" // 📐 EDGE-TO-EDGE FIT
            repeat={true}
            muted={isMuted}
            paused={!isVisible}
            onLoad={onVideoLoad}
            onBuffer={({ isBuffering }) => setIsBuffering(isBuffering)}
            onError={(err) => console.log('❌ [REEL-VIDEO] Error:', err)}
          />
        )}
        
        {/* Poster / Loading Fallback */}
        {(!isReady || isBuffering) && (
          <Image 
            source={{ uri: data.thumbnail }} 
            style={styles.thumbnail} 
            contentFit="cover" // 📐 EDGE-TO-EDGE FIT
            transition={300}
          />
        )}

        {/* Floating Controls (Top) */}
        <View style={styles.overlayControls}>
          <BlurView intensity={20} tint="light" style={styles.reelBadge}>
            <MaterialCommunityIcons name="movie-play" size={14} color="white" />
            <Text style={styles.reelText}>REEL</Text>
          </BlurView>

          <TouchableOpacity onPress={toggleMute} activeOpacity={0.7}>
            <BlurView intensity={30} tint="light" style={styles.muteBtn}>
              <Ionicons 
                name={isMuted ? "volume-mute" : "volume-high"} 
                size={18} 
                color="white" 
              />
            </BlurView>
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.bottomVignette}
        />
        
        <View style={styles.metaOverlay}>
          <View style={styles.authorRow}>
            <Image source={{ uri: data.author.avatar }} style={styles.miniAvatar} />
            <Text style={styles.authorName}>{data.author.name}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 🧬 INTERACTION BAR (BELOW CARD) */}
      <View style={styles.interactionFooter}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.footerIconBtn}>
            <Animated.View style={animatedLikeStyle}>
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={26} 
                color={isLiked ? "#FF3040" : isDarkMode ? "white" : "black"} 
              />
            </Animated.View>
            <Text style={[styles.statsLabel, { color: isDarkMode ? '#888' : '#666' }]}>1.2K</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.footerIconBtn}>
            <Feather name="message-circle" size={24} color={isDarkMode ? "white" : "black"} />
            <Text style={[styles.statsLabel, { color: isDarkMode ? '#888' : '#666' }]}>42</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.footerIconBtn}>
            <Feather name="send" size={23} color={isDarkMode ? "white" : "black"} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setIsSaved(!isSaved)}>
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={isSaved ? theme.accent : isDarkMode ? "white" : "black"} 
          />
        </TouchableOpacity>
      </View>

      {/* Title / Description */}
      <View style={styles.textContainer}>
        <Text numberOfLines={2} style={[styles.title, { color: isDarkMode ? 'white' : 'black' }]}>
          {data.title}
        </Text>
        <Text style={[styles.viewsCount, { color: isDarkMode ? '#777' : '#999' }]}>
          {data.views} views
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  card: {
    width: '100%',
    maxHeight: width * (16 / 9), 
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      }
    })
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  overlayControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  reelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
    overflow: 'hidden',
  },
  reelText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  muteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 100,
    zIndex: 5,
  },
  metaOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    zIndex: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'white',
  },
  authorName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  interactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  footerIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  textContainer: {
    paddingHorizontal: 4,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  viewsCount: {
    fontSize: 12,
    fontWeight: '600',
  }
});
